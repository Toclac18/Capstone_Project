import os, json
from datetime import datetime

EVAL_LOG_FILE = os.path.join("outputs", "train_output", "history_eval.json")
os.makedirs(os.path.dirname(EVAL_LOG_FILE), exist_ok=True)

def log_eval(task: str, metrics: dict):
    """Ghi log sau mỗi lần training hoặc evaluation."""
    record = {
        "timestamp": datetime.now().isoformat(),
        "task": task,
        "metrics": metrics,
    }

    # Load lịch sử cũ nếu có
    history = []
    if os.path.exists(EVAL_LOG_FILE):
        try:
            with open(EVAL_LOG_FILE, "r", encoding="utf-8") as f:
                history = json.load(f)
        except json.JSONDecodeError:
            history = []

    history.append(record)
    with open(EVAL_LOG_FILE, "w", encoding="utf-8") as f:
        json.dump(history, f, ensure_ascii=False, indent=2)

    print(f"📊 Evaluation log saved to {EVAL_LOG_FILE}", flush=True)
    return record
