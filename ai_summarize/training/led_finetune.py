import os
import time
from datetime import datetime

import torch
import evaluate
import numpy as np
from datasets import Dataset

# --- Patch tránh lỗi dispatch_batches/even_batches với accelerate ---
import inspect
import accelerate
_sig = inspect.signature(accelerate.Accelerator.__init__)
if "dispatch_batches" not in _sig.parameters:
    _old_init = accelerate.Accelerator.__init__
    def _patched_init(self, *args, **kwargs):
        kwargs.pop("dispatch_batches", None)
        kwargs.pop("even_batches", None)
        return _old_init(self, *args, **kwargs)
    accelerate.Accelerator.__init__ = _patched_init
# -------------------------------------------------------------------

from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
# Fallback an toàn nếu Seq2SeqTrainer không khả dụng
from transformers import Trainer as BaseTrainer, TrainingArguments as BaseArgs
try:
    from transformers import Seq2SeqTrainer, Seq2SeqTrainingArguments
    _HAS_S2S = True
except Exception:
    Seq2SeqTrainer = BaseTrainer
    Seq2SeqTrainingArguments = BaseArgs
    _HAS_S2S = False

from training.utils.train_history import log_eval
from training.utils.file_loader import load_all_data_from_folder


def train_led(data_folder: str):
    """Fine-tune BART/LED trên thư mục chứa .txt/.docx/.pdf (dùng nội dung tự tóm tắt)."""
    start_time = datetime.now().isoformat()
    t0 = time.time()

    print(f"🚀 Fine-tuning LED/BART using data in folder: {data_folder}", flush=True)

    # 1) Model & tokenizer (bạn có thể đổi sang 'allenai/led-base-16384' nếu cần input dài)
    model_name = "facebook/bart-base"
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    model = AutoModelForSeq2SeqLM.from_pretrained(model_name)

    if tokenizer.pad_token is None:
        # BART đã có pad_token, phòng hờ trường hợp khác
        tokenizer.pad_token = tokenizer.eos_token

    # 2) Load dữ liệu (đã chuẩn hóa thành [{'text': ..., 'summary': ...}, ...])
    data = load_all_data_from_folder(data_folder)
    if not data:
        raise ValueError("❌ No valid training data found in folder.")
    raw_ds = Dataset.from_list(data)

    # 3) Tiền xử lý cho batched=True
    def preprocess(batch):
        # batch["text"] & batch["summary"] là list[str]
        enc = tokenizer(
            batch["text"],
            max_length=512,             # đổi nếu muốn input dài hơn khi dùng LED
            truncation=True,
            padding="max_length",
        )
        # dùng text_target để mã hóa label đúng nhánh decoder (không cần as_target_tokenizer)
        lab = tokenizer(
            text_target=batch["summary"],
            max_length=128,
            truncation=True,
            padding="max_length",
        )
        enc["labels"] = lab["input_ids"]          # (batch, seq_len) list[list[int]]
        return enc

    ds = raw_ds.map(preprocess, batched=True, remove_columns=raw_ds.column_names)

    # 4) Metric (ROUGE)
    rouge = evaluate.load("rouge")

    def compute_metrics(eval_pred):
        """
        Robust với cả 2 trường hợp:
        - Seq2SeqTrainer + predict_with_generate=True -> preds là token IDs [bsz, seq]
        - Fallback Trainer (hoặc cấu hình khác) -> có thể trả về logits [bsz, seq, vocab]
        """
        preds, labels = eval_pred

        # Chuẩn hoá preds
        if isinstance(preds, tuple):
            preds = preds[0]
        preds = np.asarray(preds)
        if preds.ndim == 3:  # logits -> ids
            preds = preds.argmax(axis=-1)
        preds_list = preds.tolist()  # list[list[int]]

        # Chuẩn hoá labels: thay -100 bằng pad_token_id để decode
        labels = np.asarray(labels)
        pad_id = tokenizer.pad_token_id if tokenizer.pad_token_id is not None else tokenizer.eos_token_id
        labels = np.where(labels == -100, pad_id, labels)
        labels_list = labels.tolist()

        # Decode
        decoded_preds = tokenizer.batch_decode(preds_list, skip_special_tokens=True)
        decoded_labels = tokenizer.batch_decode(labels_list, skip_special_tokens=True)

        decoded_preds = [p.strip() for p in decoded_preds]
        decoded_labels = [l.strip() for l in decoded_labels]

        return rouge.compute(predictions=decoded_preds, references=decoded_labels)

    # 5) Training args
    # Với Seq2SeqTrainer, predict_with_generate=True để evaluate dùng token-ids sinh từ generate()
    # Nếu fallback về Base Trainer, cờ này được bỏ qua an toàn.
    args = Seq2SeqTrainingArguments(
        output_dir="outputs/tmp_led",
        per_device_train_batch_size=2,
        num_train_epochs=1,
        logging_steps=5,
        save_strategy="no",
        report_to="none",
        fp16=torch.cuda.is_available(),
        predict_with_generate=True,        # 🔑 ưu tiên IDs thay vì logits
        generation_max_length=128,         # độ dài khi generate cho eval
        generation_num_beams=1,            # nhanh & đơn giản
        remove_unused_columns=True,
    )

    # 6) Trainer
    TrainerCls = Seq2SeqTrainer if _HAS_S2S else BaseTrainer
    trainer = TrainerCls(
        model=model,
        args=args,
        train_dataset=ds,
        eval_dataset=ds,                   # có thể đổi sang subset nếu muốn nhanh hơn
        tokenizer=tokenizer,
        compute_metrics=compute_metrics,
    )

    # 7) Train & Eval
    print("🎯 Starting fine-tuning ...", flush=True)
    trainer.train()
    metrics = trainer.evaluate()

    runtime = round(time.time() - t0, 2)
    end_time = datetime.now().isoformat()

    metrics.update({
        "train_folder": data_folder,
        "epochs": 1,
        "runtime": runtime,
        "start_time": start_time,
        "end_time": end_time,
        "model_name": model_name,
    })

    # 8) Log + save
    try:
        log_eval("led", metrics)
        print("📊 Evaluation log saved successfully.", flush=True)
    except Exception as e:
        print(f"⚠️ Failed to log evaluation: {e}", flush=True)

    os.makedirs("checkpoints/led_ft", exist_ok=True)
    model.save_pretrained("checkpoints/led_ft")
    tokenizer.save_pretrained("checkpoints/led_ft")

    print("💾 Saved fine-tuned LED model → checkpoints/led_ft", flush=True)
    print(f"✅ Completed in {runtime}s.", flush=True)
    return metrics
