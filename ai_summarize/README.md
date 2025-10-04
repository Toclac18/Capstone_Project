# Offline AI Suite v5 (LED & Llama 3.1 8B)

## Điểm mới v5
- **Swagger UI** có thể:
  - Inference: `/summarize` (LED), `/generate` (Llama).
  - Upload dataset: `/upload-dataset` (lưu vào `training/data/`).
  - Trigger training chạy nền: `/train/led`, `/train/llama`.
- Training xong sẽ **tự động chạy evaluation** trên `training/training_data/` và append kết quả vào
  `outputs/train_output/history_eval.json`.
- Inference API luôn trả **response ngay** đồng thời **ghi log** vào `outputs/run_output/history.json`.

## Cài đặt (Python 3.10.11 + CUDA 12.2)
```bash
# 1️⃣ Xóa toàn bộ venv cũ
rd /s /q .venv

# 2️⃣ Tạo mới môi trường ảo
python -m venv .venv
.venv\Scripts\activate

# 3️⃣ Cài đặt PyTorch CUDA 12.1 trước
pip install torch==2.3.0+cu121 torchvision==0.18.0+cu121 torchaudio==2.3.0+cu121 --index-url https://download.pytorch.org/whl/cu121

# 4️⃣ Cài các thư viện còn lại
pip install -r requirements.txt

# 5️⃣ Kiểm tra
python -c "import torch, transformers, accelerate; print(torch.__version__, transformers.__version__, accelerate.__version__)"

```

## Chuẩn bị checkpoint
Đặt trọng số vào:
- `checkpoints/led_pretrained` (ví dụ allenai/led-base-16384)
- `checkpoints/llama_pretrained` (ví dụ meta-llama/Llama-3.1-8B-Instruct)

## Chạy server
```bash
bash scripts/run_api.sh
# hoặc
python -m uvicorn server.api_main:app --host 0.0.0.0 --port 8000
```
Swagger: http://localhost:8000/docs

## Dùng Swagger
- `/summarize` & `/generate`: Inference (log tại `outputs/run_output/history.json`).
- `/upload-dataset`: chọn file JSONL để upload vào `training/data/`.
- `/train/led` hoặc `/train/llama`: Training chạy nền + tự eval; kết quả append vào `outputs/train_output/history_eval.json`.

## Training thủ công (không qua Swagger)
```bash
python training/led_finetune.py --train_file training/data/sample_led.jsonl --output_dir checkpoints/led_ft
python training/llama_finetune_sft.py --train_file training/data/sample_llama.jsonl --output_dir checkpoints/llama_lora
python training/eval_after_train.py --models checkpoints/led_ft --task led
```

## Lưu ý RTX 3050 (8GB)
- Llama: mặc định dùng 4-bit (bitsandbytes). Nếu lỗi trên Windows, chạy WSL hoặc đặt `use_4bit=False` trong code.
- LED: nếu OOM, giảm `max_length` từ 4096 xuống 2048 trong `models/led/model.py`.
