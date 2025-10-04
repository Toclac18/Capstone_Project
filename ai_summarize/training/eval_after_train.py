import json, time
from datetime import datetime
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM, AutoModelForCausalLM
from datasets import Dataset
import evaluate
from utils.train_history import log_eval

def eval_model(task: str, eval_file: str, model_path: str):
    start_time = datetime.now().isoformat()
    start = time.time()

    data = [json.loads(l) for l in open(eval_file, encoding="utf-8")]
    dataset = Dataset.from_list(data)

    if task == "led":
        tokenizer = AutoTokenizer.from_pretrained(model_path)
        model = AutoModelForSeq2SeqLM.from_pretrained(model_path)
        rouge = evaluate.load("rouge")

        preds, refs = [], []
        for sample in dataset:
            inputs = tokenizer(sample["text"], return_tensors="pt", truncation=True, max_length=512)
            output = model.generate(**inputs, max_new_tokens=128)
            pred = tokenizer.decode(output[0], skip_special_tokens=True)
            preds.append(pred)
            refs.append(sample["summary"])

        metrics = rouge.compute(predictions=preds, references=refs)

    else:  # task == "llama"
        tokenizer = AutoTokenizer.from_pretrained(model_path)
        model = AutoModelForCausalLM.from_pretrained(model_path)
        bleu = evaluate.load("bleu")

        preds, refs = [], []
        for sample in dataset:
            text = ""
            for msg in sample["messages"]:
                text += f"{msg['role'].capitalize()}: {msg['content']}\n"
            inputs = tokenizer(text, return_tensors="pt", truncation=True, max_length=512)
            output = model.generate(**inputs, max_new_tokens=128)
            pred = tokenizer.decode(output[0], skip_special_tokens=True)
            preds.append(pred)
            refs.append(text)

        metrics = bleu.compute(predictions=preds, references=refs)

    metrics.update({
        "eval_file": eval_file,
        "model_path": model_path,
        "runtime": round(time.time() - start, 2),
        "start_time": start_time,
        "end_time": datetime.now().isoformat()
    })

    log_eval(task, metrics)
    print(f"✅ Evaluation completed for {task}. Logged to history_eval.json.\n")
    return metrics
