import os, time, subprocess, docx, json
from PyPDF2 import PdfReader
from fastapi import FastAPI, UploadFile, File
from typing import List
from datetime import datetime

from models.led.model import LedSummarizer
from models.llama.model import LlamaChat
from utils.history import append_history
from utils.chunking import split_text, clean_text
from utils.config import config

app = FastAPI(title="Offline AI Suite v5")

led = LedSummarizer(max_length=1024)
llama = LlamaChat(use_4bit=False)

@app.post("/inference")
async def inference(
    file: UploadFile = File(...),
    max_new_tokens: int = 256
):
    """
    Auto chọn mô hình để tóm tắt hoặc trò chuyện tùy theo độ dài văn bản.
    - Văn bản ngắn → TinyLlama (chat)
    - Văn bản dài → LED/BART (summarization)
    - Trả về 'chunks' nếu văn bản được chia làm nhiều phần
    """
    start_time = time.time()
    ext = os.path.splitext(file.filename)[1].lower()
    text = ""

    # === Đọc nội dung file ===
    if ext == ".txt":
        text = (await file.read()).decode("utf-8", errors="ignore")

    elif ext == ".docx":
        temp_path = f"temp_{file.filename}"
        with open(temp_path, "wb") as f:
            f.write(await file.read())
        doc = docx.Document(temp_path)
        text = "\n".join([p.text for p in doc.paragraphs])
        os.remove(temp_path)

    elif ext == ".pdf":
        temp_path = f"temp_{file.filename}"
        with open(temp_path, "wb") as f:
            f.write(await file.read())
        reader = PdfReader(temp_path)
        text = "\n".join([page.extract_text() or "" for page in reader.pages])
        os.remove(temp_path)

    else:
        return {"error": f"Unsupported file type: {ext}. Only .txt/.docx/.pdf supported."}

    # === Làm sạch và tách từ ===
    text = clean_text(text)
    words = text.split()
    input_tokens = len(words)

    # === Ngưỡng lựa chọn model ===
    llama_threshold = config["inference"]["llama_threshold"]
    chunk_size = config["inference"]["chunk_size"]

    model_used = ""
    chunk_summaries = []
    final_summary = ""

    # === Chọn mô hình ===
    if input_tokens > llama_threshold:
        model_used = "LED/BART"
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
    else:
        model_used = "TinyLlama"
        output = llama.chat([{"role": "user", "content": text}], max_new_tokens=max_new_tokens)

    runtime = round(time.time() - start_time, 2)

    # === Ghi log vào history ===
    log_entry = {
        "timestamp": datetime.now().isoformat(),
        "model": model_used,
        "file": file.filename,
        "input_tokens": input_tokens,
        "output_tokens": len(output.split()),
        "runtime": runtime,
        "response": output,
    }

    # Nếu có chunk summaries thật sự (tức > 1 chunk)
    if len(chunk_summaries) > 1:
        log_entry["chunks"] = chunk_summaries
        log_entry["final_summary"] = output

    append_history(log_entry)

    # === Trả kết quả ===
    response = {
        "file": file.filename,
        "model": model_used,
        "input_tokens": input_tokens,
        "runtime": runtime,
        "output": output,
    }
    if len(chunk_summaries) > 1:
        response["chunks"] = chunk_summaries
        response["final_summary"] = output

    return response

@app.post("/upload-dataset")
async def upload_dataset(files: List[UploadFile] = File(...)):
    os.makedirs("training/data_training", exist_ok=True)
    saved_files = []
    for file in files:
        ext = os.path.splitext(file.filename)[1].lower()
        if ext not in [".txt", ".docx", ".pdf"]:
            continue
        save_path = os.path.join("training/data_training", file.filename)
        with open(save_path, "wb") as f:
            f.write(await file.read())
        saved_files.append(save_path)
    return {"status": "uploaded", "files": saved_files}


@app.post("/train")
def train(task: str = "led"):
    cmd = ["python", "training/run_and_eval.py", "--task", task]
    subprocess.Popen(cmd)
    return {
        "status": "started",
        "task": task,
        "msg": "Training is running. Check outputs/train_output/ for logs."
    }