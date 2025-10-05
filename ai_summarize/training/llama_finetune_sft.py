import time
import os
from datetime import datetime
import torch
import numpy as np
from datasets import Dataset
import evaluate
import inspect
import accelerate
from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training
from transformers import (
    AutoTokenizer,
    AutoModelForCausalLM,
    Trainer,
    TrainingArguments,
    BitsAndBytesConfig,
)
from training.utils.file_loader import load_all_data_from_folder
from training.utils.train_history import log_eval


# --- Patch tránh lỗi dispatch_batches / even_batches (một số bản accelerate cũ) ---
sig = inspect.signature(accelerate.Accelerator.__init__)
if "dispatch_batches" not in sig.parameters:
    old_init = accelerate.Accelerator.__init__

    def _patched_init(self, *args, **kwargs):
        kwargs.pop("dispatch_batches", None)
        kwargs.pop("even_batches", None)
        return old_init(self, *args, **kwargs)

    accelerate.Accelerator.__init__ = _patched_init
# -------------------------------------------------------------------------------


def train_llama(data_folder: str):
    """Fine-tune TinyLlama bằng LoRA/QLoRA trên folder chứa .txt/.docx/.pdf."""
    start_iso = datetime.now().isoformat()
    t0 = time.time()

    print(f"🚀 Fine-tuning TinyLlama using data in folder: {data_folder}", flush=True)

    # ===== Load dataset =====
    data = load_all_data_from_folder(data_folder)
    if not data:
        raise ValueError("❌ No valid training data found in folder.")

    raw_ds = Dataset.from_list(data)
    print(f"📂 Loaded {len(raw_ds)} structured samples from {data_folder}")

    # ===== Model & tokenizer =====
    model_name = "TinyLlama/TinyLlama-1.1B-Chat-v1.0"
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token
    tokenizer.padding_side = "right"

    print("💡 Loading model in 4-bit quantization for RTX 3050 efficiency...")
    quant_config = BitsAndBytesConfig(
        load_in_4bit=True,
        bnb_4bit_quant_type="nf4",
        bnb_4bit_use_double_quant=True,
        bnb_4bit_compute_dtype=torch.float16,
    )

    model = AutoModelForCausalLM.from_pretrained(
        model_name,
        quantization_config=quant_config,
        device_map="auto",
    )
    model.config.use_cache = False  # cần cho gradient checkpointing

    # ===== LoRA config =====
    model = prepare_model_for_kbit_training(model)
    lora_cfg = LoraConfig(
        r=8,
        lora_alpha=16,
        target_modules=["q_proj", "v_proj"],
        lora_dropout=0.05,
        bias="none",
        task_type="CAUSAL_LM",
    )
    model = get_peft_model(model, lora_cfg)

    # ===== Tokenization / Formatting =====
    assistant_tag = "Assistant:"
    assistant_token_ids = tokenizer(assistant_tag, add_special_tokens=False)["input_ids"]

    def preprocess(batch):
        text = batch.get("text", "")
        summary = batch.get("summary", "")

        if isinstance(text, list):
            text = " ".join([t for t in text if isinstance(t, str)])
        if isinstance(summary, list):
            summary = " ".join([s for s in summary if isinstance(s, str)])

        full_prompt = f"User: {text.strip()}\n{assistant_tag} {summary.strip() or text[:256]}"

        enc = tokenizer(
            full_prompt,
            truncation=True,
            padding="max_length",
            max_length=512,
            return_tensors="pt",
        )
        input_ids = enc["input_ids"].squeeze(0)
        attn = enc["attention_mask"].squeeze(0)

        # Tìm vị trí "Assistant:" trong input_ids
        assistant_pos = 0
        try:
            pattern = torch.tensor(assistant_token_ids, dtype=input_ids.dtype)
            for i in range(0, input_ids.size(0) - pattern.size(0) + 1):
                if torch.equal(input_ids[i : i + pattern.size(0)], pattern):
                    assistant_pos = i
                    break
        except Exception:
            assistant_pos = 0

        labels = input_ids.clone()
        labels[:assistant_pos] = -100

        return {
            "input_ids": input_ids.tolist(),
            "attention_mask": attn.tolist(),
            "labels": labels.tolist(),
        }

    print("🔧 Tokenizing dataset ...")
    ds = raw_ds.map(preprocess, remove_columns=raw_ds.column_names)

    # ===== Metric =====
    bleu = evaluate.load("bleu")

    def compute_metrics(eval_pred):
        """Fix lỗi: argument 'ids': 'list' object cannot be interpreted as an integer."""
        preds, labels = eval_pred

        if isinstance(preds, tuple):
            preds = preds[0]
        preds = np.asarray(preds)
        if preds.ndim == 3:
            preds = preds.argmax(axis=-1)
        preds_list = preds.tolist()

        labels = np.asarray(labels)
        pad_id = tokenizer.pad_token_id or tokenizer.eos_token_id
        labels = np.where(labels == -100, pad_id, labels)
        labels_list = labels.tolist()

        decoded_preds = tokenizer.batch_decode(preds_list, skip_special_tokens=True)
        decoded_labels = tokenizer.batch_decode(labels_list, skip_special_tokens=True)

        try:
            result = bleu.compute(
                predictions=[p.strip() for p in decoded_preds],
                references=[[l.strip()] for l in decoded_labels],
            )
        except Exception:
            result = {"bleu": 0.0}
        return result

    # ===== Training arguments =====
    args = TrainingArguments(
        output_dir="outputs/tmp_llama",
        per_device_train_batch_size=1,
        num_train_epochs=1,
        gradient_accumulation_steps=2,
        learning_rate=2e-4,
        logging_steps=5,
        save_strategy="no",
        report_to="none",
        fp16=torch.cuda.is_available(),
        gradient_checkpointing=True,
        optim="paged_adamw_32bit",
    )

    trainer = Trainer(
        model=model,
        args=args,
        train_dataset=ds,
        eval_dataset=ds.select(range(min(64, len(ds)))),
        tokenizer=tokenizer,
        compute_metrics=compute_metrics,
    )

    print("🎯 Starting fine-tuning ...", flush=True)
    trainer.train()
    eval_metrics = trainer.evaluate()

    if "eval_loss" in eval_metrics:
        try:
            eval_metrics["ppl"] = float(np.exp(eval_metrics["eval_loss"]))
        except Exception:
            pass

    runtime = round(time.time() - t0, 2)
    end_iso = datetime.now().isoformat()

    eval_metrics.update({
        "train_folder": data_folder,
        "epochs": 1,
        "runtime": runtime,
        "start_time": start_iso,
        "end_time": end_iso,
        "model_name": model_name,
    })

    try:
        log_eval("llama", eval_metrics)
        print("📊 Evaluation log saved successfully.", flush=True)
    except Exception as e:
        print(f"⚠️ Failed to log evaluation: {e}", flush=True)

    os.makedirs("checkpoints/llama_ft", exist_ok=True)
    model.save_pretrained("checkpoints/llama_ft")
    tokenizer.save_pretrained("checkpoints/llama_ft")

    print("💾 Saved fine-tuned TinyLlama → checkpoints/llama_ft", flush=True)
    print(f"✅ Completed in {runtime}s.", flush=True)
    return eval_metrics
