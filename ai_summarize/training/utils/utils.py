import json

def jsonl_reader(path: str):
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                yield json.loads(line)

def load_led_samples(path: str):
    return list(jsonl_reader(path))

def load_llama_messages(path: str):
    return list(jsonl_reader(path))
