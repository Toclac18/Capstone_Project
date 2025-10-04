import os
import json
import time
import inspect
import numpy as np
from datetime import datetime

import torch
import accelerate
from datasets import Dataset
import evaluate

# --- Patch tránh lỗi dispatch_batches / even_batches ---
sig = inspect.signature(accelerate.Accelerator.__init__)
if "dispatch_batches" not in sig.parameters:
    old_init = accelerate.Accelerator.__init__
    def _patched_init(self, *args, **kwargs):
        kwargs.pop("dispatch_batches", None)
        kwargs.pop("even_batches", None)
        return old_init(self, *args, **kwargs)
    accelerate.Accelerator.__init__ = _patched_init
# ---------------------------------------------------

from transformers import (
    AutoTokenizer,
    AutoModelForCausalLM,
    Trainer,
    TrainingArguments,
)
from training.utils.train_history import log_eval


def train_llama(train_file: str):
    """Fine-tune TinyLlama cho chat-style dataset."""
    start_time = datetime.now().isoformat()
    start = time.time()

    print(f"🚀 Fine-tuning TinyLlama on {train_file}", flush=True)

    model_name = "TinyLlama/TinyLlama-1.1B-Chat-v1.0"
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    model = AutoModelForCausalLM.from_pretrained(model_name)

    # --- Load dataset ---
    data = []
    with open(train_file, encoding="utf-8") as f:
        for l in f:
            if not l.strip():
                continue
            try:
                obj = json.loads(l)
                if "messages" in obj and isinstance(obj["messages"], list):
                    data.append(obj)
            except Exception:
                continue

    if len(data) == 0:
        raise ValueError("Dataset rỗng hoặc sai định dạng JSONL (missing 'messages').")

    dataset = Dataset.from_list(data)

    # --- Tokenization ---
    def preprocess(batch):
        text = ""
        for msg in batch.get("messages", []):
            role = msg.get("role", "user").capitalize()
            content = msg.get("content", "")
            text += f"{role}: {content}\n"

        if not text.strip():
            return {}

        tok = tokenizer(
            text,
            truncation=True,
            padding="max_length",
            max_length=512,
        )
        tok["labels"] = tok["input_ids"].copy()
        return tok

    dataset = dataset.map(preprocess)

    # --- Metric ---
    bleu = evaluate.load("bleu")

    def compute_metrics(eval_pred):
        preds, labels = eval_pred

        # normalize
        if isinstance(preds, tuple):
            preds = preds[0]
        preds = np.array(preds)
        labels = np.array(labels)

        # --- Lọc token -100 ---
        preds_clean = [[int(x) for x in np.array(p).flatten().tolist() if x >= 0] for p in preds]
        labels_clean = [[int(x) for x in np.array(l).flatten().tolist() if x >= 0] for l in labels]

        decoded_preds = tokenizer.batch_decode(preds_clean, skip_special_tokens=True)
        decoded_labels = tokenizer.batch_decode(labels_clean, skip_special_tokens=True)

        try:
            result = bleu.compute(predictions=decoded_preds, references=decoded_labels)
        except Exception:
            result = {"bleu": 0.0}

        return result

    # --- Training setup ---
    args = TrainingArguments(
        output_dir="outputs/tmp_llama",
        per_device_train_batch_size=2,
        num_train_epochs=1,
        logging_steps=10,
        save_strategy="no",
        report_to="none",
        fp16=torch.cuda.is_available(),
    )

    trainer = Trainer(
        model=model,
        args=args,
        train_dataset=dataset,
        eval_dataset=dataset,
        tokenizer=tokenizer,
        compute_metrics=compute_metrics,
    )

    # --- Train & Eval ---
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

    log_eval("llama", metrics)

    # --- Save model ---
    os.makedirs("checkpoints/llama_ft", exist_ok=True)
    model.save_pretrained("checkpoints/llama_ft")
    tokenizer.save_pretrained("checkpoints/llama_ft")

    print("💾 Saved fine-tuned TinyLlama → checkpoints/llama_ft", flush=True)
    print(f"✅ Completed in {runtime}s.", flush=True)

    return metrics
