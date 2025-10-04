import os
import json
import time
from datetime import datetime
import torch
import numpy as np
from datasets import Dataset
import evaluate
import inspect
import accelerate

# --- Patch lỗi dispatch_batches / even_batches ---
sig = inspect.signature(accelerate.Accelerator.__init__)
if "dispatch_batches" not in sig.parameters:
    old_init = accelerate.Accelerator.__init__
    def _patched_init(self, *args, **kwargs):
        kwargs.pop("dispatch_batches", None)
        kwargs.pop("even_batches", None)
        return old_init(self, *args, **kwargs)
    accelerate.Accelerator.__init__ = _patched_init
# --------------------------------------------------

from transformers import (
    AutoTokenizer,
    AutoModelForSeq2SeqLM,
)
# --- Patch fallback tránh lỗi EncoderDecoderCache ---
from transformers import Trainer as BaseTrainer, TrainingArguments as BaseArgs
try:
    from transformers import Seq2SeqTrainer, Seq2SeqTrainingArguments
except Exception:
    Seq2SeqTrainer = BaseTrainer
    Seq2SeqTrainingArguments = BaseArgs
# --------------------------------------------------
from training.utils.train_history import log_eval


def train_led(train_file: str):
    """Fine-tune BART/LED trên dataset JSONL."""
    start_time = datetime.now().isoformat()
    start = time.time()

    print(f"🚀 Fine-tuning LED/BART on {train_file}", flush=True)

    tokenizer = AutoTokenizer.from_pretrained("facebook/bart-base")
    model = AutoModelForSeq2SeqLM.from_pretrained("facebook/bart-base")

    # --- Load dataset ---
    data = []
    with open(train_file, encoding="utf-8") as f:
        for l in f:
            if not l.strip():
                continue
            try:
                obj = json.loads(l)
                if "text" in obj and "summary" in obj:
                    data.append(obj)
            except Exception:
                continue

    if len(data) == 0:
        raise ValueError("Dataset rỗng hoặc sai định dạng JSONL.")

    dataset = Dataset.from_list(data)

    def preprocess(batch):
        text = batch.get("text", "")
        summary = batch.get("summary", "")
        if not isinstance(text, str) or not isinstance(summary, str):
            return {}
        model_inputs = tokenizer(
            text,
            max_length=512,
            truncation=True,
            padding="max_length"
        )
        with tokenizer.as_target_tokenizer():
            labels = tokenizer(
                summary,
                max_length=128,
                truncation=True,
                padding="max_length"
            )
        model_inputs["labels"] = labels["input_ids"]
        return model_inputs

    dataset = dataset.map(preprocess)

    rouge = evaluate.load("rouge")

    def compute_metrics(eval_pred):
        preds, labels = eval_pred

        # --- Chuẩn hóa dữ liệu ---
        if isinstance(preds, tuple):
            preds = preds[0]
        preds = np.array(preds)
        labels = np.array(labels)

        # --- Lọc bỏ token -100 (ignore index) ---
        preds = [p for p in preds if len(p) > 0]
        labels = [l for l in labels if len(l) > 0]

        if len(preds) == 0 or len(labels) == 0:
            return {"rougeL": 0.0}

        # --- Chuyển thành list[int] và bỏ -100 ---
        preds_clean = [[int(x) for x in np.array(p).flatten().tolist() if x >= 0] for p in preds]
        labels_clean = [[int(x) for x in np.array(l).flatten().tolist() if x >= 0] for l in labels]

        if len(preds_clean) == 0 or len(labels_clean) == 0:
            return {"rougeL": 0.0}

        decoded_preds = tokenizer.batch_decode(preds_clean, skip_special_tokens=True)
        decoded_labels = tokenizer.batch_decode(labels_clean, skip_special_tokens=True)

        try:
            result = rouge.compute(predictions=decoded_preds, references=decoded_labels)
        except Exception:
            result = {"rougeL": 0.0}
        return result

    args = Seq2SeqTrainingArguments(
        output_dir="outputs/tmp_led",
        per_device_train_batch_size=2,
        num_train_epochs=1,
        logging_steps=5,
        save_strategy="no",
        report_to="none",
        fp16=torch.cuda.is_available(),
    )

    trainer = Seq2SeqTrainer(
        model=model,
        args=args,
        train_dataset=dataset,
        eval_dataset=dataset,
        tokenizer=tokenizer,
        compute_metrics=compute_metrics,
    )

    trainer.train()
    metrics = trainer.evaluate(dataset)

    runtime = round(time.time() - start, 2)
    end_time = datetime.now().isoformat()

    metrics.update({
        "train_file": train_file,
        "epochs": 1,
        "runtime": runtime,
        "start_time": start_time,
        "end_time": end_time,
    })

    log_eval("led", metrics)

    os.makedirs("checkpoints/led_ft", exist_ok=True)
    model.save_pretrained("checkpoints/led_ft")
    tokenizer.save_pretrained("checkpoints/led_ft")

    print(f"💾 Saved fine-tuned LED model → checkpoints/led_ft")
    print(f"✅ Completed in {runtime}s.")
    return metrics
