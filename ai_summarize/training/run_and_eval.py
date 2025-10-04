import argparse
import time
import json
import os
import shutil
from datetime import datetime
import sys

# === Bổ sung path để import module training/utils ===
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from training.led_finetune import train_led
from training.llama_finetune_sft import train_llama
from training.eval_after_train import eval_model


# ==============================
# 📦 Lưu version model sau mỗi lần train
# ==============================
def save_model_version(task, model_path):
    """Lưu model version mới vào checkpoints/<task>_ft_<timestamp>"""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M")
    version_dir = os.path.join("checkpoints", f"{task}_ft_{timestamp}")
    os.makedirs(version_dir, exist_ok=True)

    # ✅ Copy model (cross-platform)
    if os.path.exists(model_path):
        for item in os.listdir(model_path):
            src = os.path.join(model_path, item)
            dst = os.path.join(version_dir, item)
            if os.path.isdir(src):
                shutil.copytree(src, dst, dirs_exist_ok=True)
            else:
                shutil.copy2(src, dst)

    # ✅ Ghi lịch sử version
    os.makedirs("outputs/train_output", exist_ok=True)
    log_file = os.path.join("outputs", "train_output", "model_versions.json")

    history = []
    if os.path.exists(log_file):
        try:
            with open(log_file, "r", encoding="utf-8") as f:
                history = json.load(f)
        except json.JSONDecodeError:
            history = []

    entry = {
        "task": task,
        "version": version_dir,
        "timestamp": datetime.now().isoformat()
    }
    history.append(entry)

    with open(log_file, "w", encoding="utf-8") as f:
        json.dump(history, f, ensure_ascii=False, indent=2)

    print(f"💾 Model version saved → {version_dir}", flush=True)
    return version_dir


# ==============================
# 🚀 Main pipeline
# ==============================
def main():
    parser = argparse.ArgumentParser(description="Fine-tune and evaluate models (LED / LLaMA).")
    parser.add_argument("--task", required=True, choices=["led", "llama"], help="Chọn model cần train")
    parser.add_argument("--train_file", required=True, help="Đường dẫn file JSONL trong training/data/")
    args = parser.parse_args()

    start_all = time.time()
    start_time = datetime.now().isoformat()

    print(f"\n🚀 Starting pipeline for task = {args.task}", flush=True)
    print(f"📄 Train file: {args.train_file}", flush=True)
    print(f"🕒 Started at: {start_time}\n", flush=True)

    metrics_train, metrics_eval = {}, {}
    version_dir = "N/A"
    success = False

    try:
        # === 1️⃣ TRAIN ===
        if args.task == "led":
            metrics_train = train_led(args.train_file)
            model_path = "checkpoints/led_ft"
            eval_file = os.path.join("training", "training_data", "eval_led.jsonl")
        else:
            metrics_train = train_llama(args.train_file)
            model_path = "checkpoints/llama_ft"
            eval_file = os.path.join("training", "training_data", "eval_llama.jsonl")

        success = True

        # === 2️⃣ SAVE VERSION ===
        version_dir = save_model_version(args.task, model_path)

        # === 3️⃣ EVALUATE ===
        if os.path.exists(eval_file):
            print(f"🔎 Evaluating fine-tuned model: {version_dir}", flush=True)
            metrics_eval = eval_model(args.task, eval_file, version_dir)
        else:
            print(f"⚠️ No evaluation dataset found for {args.task}, skipping.", flush=True)
            metrics_eval = {"note": "No eval dataset found."}

    except Exception as e:
        print(f"❌ Training failed for {args.task}: {e}", flush=True)
        success = False

    # Nếu train vẫn có metrics thì coi như thành công
    if metrics_train:
        success = True

    if success:
        print(f"✅ Training completed successfully for {args.task}.", flush=True)

    # ================= 4️⃣ FINAL SUMMARY =================
    end_time = datetime.now().isoformat()
    total_runtime = round(time.time() - start_all, 2)

    summary = {
        "task": args.task,
        "train_metrics": metrics_train,
        "eval_metrics": metrics_eval,
        "model_version": version_dir,
        "start_time": start_time,
        "end_time": end_time,
        "total_runtime": total_runtime
    }

    os.makedirs("outputs/train_output", exist_ok=True)
    with open("outputs/train_output/last_pipeline_summary.json", "w", encoding="utf-8") as f:
        json.dump(summary, f, ensure_ascii=False, indent=2)

    # ✅ Ghi file active version (dùng khi inference)
    if version_dir != "N/A":
        active_file = f"checkpoints/active_model_{args.task}.txt"
        with open(active_file, "w", encoding="utf-8") as f:
            f.write(version_dir)
        print(f"\n🔥 Active model updated → {version_dir}", flush=True)

    print(f"🏁 Pipeline completed for {args.task}", flush=True)
    print(f"🕒 End time: {end_time}", flush=True)
    print(f"⏱️ Total runtime: {total_runtime}s\n", flush=True)


# ==============================
# Entry point
# ==============================
if __name__ == "__main__":
    main()
