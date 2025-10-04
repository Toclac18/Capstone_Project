import os, json
HISTORY_FILE = os.path.join("outputs", "run_output", "history.json")
os.makedirs(os.path.dirname(HISTORY_FILE), exist_ok=True)

def append_history(entry: dict):
    hist = []
    if os.path.exists(HISTORY_FILE):
        try:
            with open(HISTORY_FILE, "r", encoding="utf-8") as f:
                hist = json.load(f)
        except Exception:
            hist = []
    hist.append(entry)
    with open(HISTORY_FILE, "w", encoding="utf-8") as f:
        json.dump(hist, f, ensure_ascii=False, indent=2)
