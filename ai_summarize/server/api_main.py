import os, time, subprocess, docx, json
from fastapi import FastAPI, UploadFile, File, Query
from datetime import datetime

from models.led.model import LedSummarizer
from models.llama.model import LlamaChat
from utils.history import append_history
from utils.chunking import split_text, clean_text
from utils.config import config   # load config từ config/config.yaml

app = FastAPI(title="Offline AI API v5")

# ===== Load models =====
led = LedSummarizer(max_length=1024)   # Summarizer (BART/LED)
llama = LlamaChat(use_4bit=False)      # Generator (TinyLlama)

# ===== Auto inference endpoint =====
@app.post("/inference")
async def inference(
    file: UploadFile = File(...),
    max_new_tokens: int = 256,
    return_chunks: bool = False
):
    start_time = time.time()
    ext = os.path.splitext(file.filename)[1].lower()
    content = await file.read()

    # ---- Đọc nội dung file ----
    text = ""
    if ext == ".txt":
        text = content.decode("utf-8", errors="ignore")
    elif ext == ".docx":
        temp_path = f"temp_{file.filename}"
        with open(temp_path, "wb") as f:
            f.write(content)
        doc = docx.Document(temp_path)
        text = "\n".join([p.text for p in doc.paragraphs])
        os.remove(temp_path)
    else:
        return {"error": f"Unsupported file type: {ext}. Only .txt/.docx supported."}

    text = clean_text(text)
    words = text.split()
    input_tokens = len(words)

    # ---- Ngưỡng từ config ----
    llama_threshold = config["inference"]["llama_threshold"]
    chunk_size = config["inference"]["chunk_size"]

    # ---- Auto chọn model ----
    if input_tokens > llama_threshold:  # văn bản dài → Summarizer
        model_used = config["models"]["summarizer"]
        chunk_summaries = []

        if input_tokens <= chunk_size:
            final_summary = led.summarize(text, max_new_tokens=max_new_tokens)
        else:
            chunks = split_text(text, max_words=chunk_size)
            for chunk in chunks:
                summary = led.summarize(chunk, max_new_tokens=max_new_tokens)
                chunk_summaries.append(summary)
            combined_text = " ".join(chunk_summaries)
            final_summary = led.summarize(combined_text, max_new_tokens=max_new_tokens)

        output = final_summary
        output_tokens = len(final_summary.split())

    else:  # văn bản ngắn → Llama
        model_used = config["models"]["generator"]
        output = llama.chat([{"role": "user", "content": text}], max_new_tokens=max_new_tokens)
        output_tokens = len(output.split())
        chunk_summaries = None

    runtime = round(time.time() - start_time, 2)

    # ---- Ghi log ----
    log_entry = {
        "timestamp": datetime.now().isoformat(),
        "model": model_used,
        "file": file.filename,
        "input_tokens": input_tokens,
        "output_tokens": output_tokens,
        "max_new_tokens": max_new_tokens,
        "runtime": runtime,
        # luôn ghi final summary hoặc output cuối cùng
        "response": output
    }

    # nếu có chunk summaries thì thêm chi tiết
    if chunk_summaries and return_chunks:
        log_entry["chunks"] = chunk_summaries
        log_entry["final_summary"] = output

    append_history(log_entry)

    # ---- Response ----
    response = {
        "file": file.filename,
        "model": model_used,
        "max_new_tokens": max_new_tokens,
        "input_tokens": input_tokens,
        "output_tokens": output_tokens,
        "runtime": runtime,
        "output": output
    }
    if chunk_summaries and return_chunks:
        response["chunks"] = chunk_summaries
        response["final_summary"] = output

    return response



# ===== Dataset upload =====
@app.post("/upload-dataset")
async def upload_dataset(file: UploadFile = File(...)):
    os.makedirs("training/data", exist_ok=True)
    save_path = os.path.join("training", "data", file.filename)
    with open(save_path, "wb") as f:
        f.write(await file.read())
    return {"status": "uploaded", "path": save_path}

@app.post("/train")
def train(task: str = "led", train_file: str = None):
    # chọn dataset mặc định
    if not train_file:
        train_file = (
            "training/data/sample_led.jsonl"
            if task == "led"
            else "training/data/sample_llama.jsonl"
        )

    # reset status.json
    os.makedirs("outputs/train_output", exist_ok=True)
    with open("outputs/train_output/status.json", "w", encoding="utf-8") as f:
        json.dump({"task": task, "status": "running"}, f)

    # chạy nền (background)
    cmd = [
        "python", "training/run_and_eval.py",
        "--task", task,
        "--train_file", train_file
    ]
    subprocess.Popen(cmd)

    return {
        "status": "Training started",
        "task": task,
        "train_file": train_file,
        "message": "Training is running in background. Check outputs/train_output/history_eval.json for results."
    }