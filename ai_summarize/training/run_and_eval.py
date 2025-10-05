import argparse, time, json, os, shutil, sys, docx
from PyPDF2 import PdfReader
from datetime import datetime
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from training.led_finetune import train_led
from training.llama_finetune_sft import train_llama

def load_dataset_from_folder(folder_path="training/data_training"):
    print(f"📂 Loading dataset from: {folder_path}", flush=True)
    data = []
    if not os.path.exists(folder_path):
        raise FileNotFoundError(f"❌ Folder not found: {folder_path}")

    for file in os.listdir(folder_path):
        fpath = os.path.join(folder_path, file)
        ext = os.path.splitext(file)[1].lower()
        text = ""
        try:
            if ext == ".txt":
                with open(fpath, "r", encoding="utf-8", errors="ignore") as f:
                    text = f.read()
            elif ext == ".docx":
                doc = docx.Document(fpath)
                text = "\n".join([p.text for p in doc.paragraphs])
            elif ext == ".pdf":
                reader = PdfReader(fpath)
                text = "\n".join([p.extract_text() or "" for p in reader.pages])
            else:
                continue
            if text.strip():
                data.append({"text": text.strip(), "summary": text[:400]})
        except Exception as e:
            print(f"⚠️ Error reading {file}: {e}")
    if not data:
        raise ValueError("❌ No valid data found in training/data_training")
    return data


def save_model_version(task, model_path):
    timestamp = datetime.now().strftime("%Y%m%d_%H%M")
    version_dir = os.path.join("checkpoints", f"{task}_ft_{timestamp}")
    os.makedirs(version_dir, exist_ok=True)
    for item in os.listdir(model_path):
        s, d = os.path.join(model_path, item), os.path.join(version_dir, item)
        if os.path.isdir(s): shutil.copytree(s, d, dirs_exist_ok=True)
        else: shutil.copy2(s, d)
    print(f"💾 Model version saved → {version_dir}")
    return version_dir

def main():
    parser = argparse.ArgumentParser(description="Fine-tune and evaluate models (LED / LLaMA).")
    parser.add_argument("--task", required=True, choices=["led", "llama"], help="Chọn model cần train (led hoặc llama)")
    args = parser.parse_args()

    start_all = time.time()
    start_time = datetime.now().isoformat()

    data_folder = "training/data_training"
    print(f"\n🚀 Starting pipeline for task = {args.task}", flush=True)
    print(f"📂 Data folder: {data_folder}", flush=True)
    print(f"🕒 Started at: {start_time}\n", flush=True)

    metrics_train, metrics_eval = {}, {}
    success = False
    version_dir = "N/A"

    try:
        if args.task == "led":
            metrics_train = train_led(data_folder)
            version_dir = save_model_version("led", "checkpoints/led_ft")
        else:
            metrics_train = train_llama(data_folder)
            version_dir = save_model_version("llama", "checkpoints/llama_ft")
        success = True
    except Exception as e:
        print(f"❌ Training failed for {args.task}: {e}", flush=True)

if __name__ == "__main__":
    main()
