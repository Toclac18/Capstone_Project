"""
Cấu hình duy nhất của Readee_AI_System.

Trước đây có hai module cấu hình song song và **lệch nhau**:
`src/config.py` lấy BASE_DIR = Readee_AI_System/, còn `src/summary/settings.py`
lấy BASE = src/. Hệ quả:

- `summary/settings.py` gọi `load_dotenv(src/.env)` — file đó không tồn tại.
  Nó chỉ chạy đúng nhờ `src.config` tình cờ được import trước và đã nạp
  `.env` vào `os.environ`. Import `src.summary.*` một mình (script, test) thì
  MODEL_ID / HF_TOKEN âm thầm về mặc định.
- `offload/` và `server/run_history.json` được tạo ở `src/`, trong khi
  `.gitignore` chặn `Readee_AI_System/offload/` và `Readee_AI_System/server/`
  ⇒ file sinh ra lúc chạy không bị ignore.

Giờ chỉ còn module này; `summary/settings.py` đã bỏ và summary/ import
trực tiếp từ đây.
"""
import os
from pathlib import Path

import yaml
from dotenv import load_dotenv

# ============================================
# Env flags cho HuggingFace / PyTorch
# ============================================
# Đặt trước khi transformers/torch được import lần đầu, nếu không chúng
# không có tác dụng.
os.environ.setdefault("TOKENIZERS_PARALLELISM", "false")
os.environ.setdefault("HF_HUB_DISABLE_TELEMETRY", "1")
os.environ.setdefault(
    "PYTORCH_CUDA_ALLOC_CONF",
    "expandable_segments:True,max_split_size_mb:64",
)

# Thư mục gốc của project (Readee_AI_System/)
# __file__ = Readee_AI_System/src/config.py
# parents[0] -> src/, parents[1] -> Readee_AI_System/
BASE_DIR = Path(__file__).resolve().parents[1]
SRC_DIR = BASE_DIR / "src"

# Load .env từ gốc project (Readee_AI_System/.env)
load_dotenv(BASE_DIR / ".env")


def _env_str(name: str, default: str | None = None) -> str | None:
    """Trả về None khi biến không có HOẶC rỗng — `API_KEY=` trong .env phải
    được hiểu là 'chưa cấu hình', không phải 'khoá là chuỗi rỗng'."""
    value = os.getenv(name)
    return value if value else default


# ============================================
# Summary Model Configuration (Llama)
# ============================================
SAFE_INPUT_TOKENS = int(os.getenv("SAFE_INPUT_TOKENS", "1024"))
PER_CHUNK_BUDGET = int(os.getenv("PER_CHUNK_BUDGET", "128"))
GPU_MAX_MEM = os.getenv("GPU_MAX_MEM", "11000MiB")
LOCAL_ONLY = os.getenv("LOCAL_ONLY", "0").lower() in ("1", "true", "yes")
MODEL_ID = os.getenv("MODEL_ID", "meta-llama/Llama-3.2-3B-Instruct")
HF_TOKEN = _env_str("HF_TOKEN")
MAX_GPU_CONCURRENCY = int(os.getenv("MAX_GPU_CONCURRENCY", "2"))

# ============================================
# Moderation Model Paths
# ============================================
# Mặc định trỏ tới thư mục models/ trong Readee_AI_System
TEXT_MODEL_PATH = os.getenv(
    "TEXT_MODEL_PATH",
    str(BASE_DIR / "models" / "textmodel" / "best"),
)
IMAGE_MODEL_PATH = os.getenv(
    "IMAGE_MODEL_PATH",
    str(BASE_DIR / "models" / "imagemodel" / "best_model.pth"),
)

# Số ảnh đưa vào GPU mỗi lượt. Không stack cả tài liệu vào một tensor:
# PDF nhiều ảnh sẽ làm OOM trước khi model kịp chạy.
IMAGE_BATCH_SIZE = int(os.getenv("IMAGE_BATCH_SIZE", "32"))

# ============================================
# Paths for summary offload/history
# ============================================
OFFLOAD_DIR = BASE_DIR / "offload"
OFFLOAD_DIR.mkdir(exist_ok=True)

HIST_PATH = BASE_DIR / "server" / "run_history.json"
HIST_PATH.parent.mkdir(parents=True, exist_ok=True)

# ============================================
# Prompts + dynamic budget (src/common/config.yaml)
# ============================================
# Đọc một lần ở đây. Trước đây `summary/settings.py` và `summary/prompts.py`
# mỗi file tự đọc lại cùng file YAML này.
CFG = yaml.safe_load(
    (SRC_DIR / "common" / "config.yaml").read_text(encoding="utf-8")
)

# ============================================
# API Security
# ============================================
API_KEY = _env_str("API_KEY")  # Set trong .env để bảo mật

# Shared secret để ký webhook callback về backend (HMAC-SHA256 trên raw body).
# Phải giống hệt AI_WEBHOOK_SECRET ở backend, nếu không backend trả 401.
WEBHOOK_SECRET = os.getenv("AI_WEBHOOK_SECRET", "")

# ============================================
# Upload limits
# ============================================
MAX_UPLOAD_BYTES = int(os.getenv("MAX_UPLOAD_BYTES", str(10 * 1024 * 1024)))
MAX_TEXT_LENGTH = int(os.getenv("MAX_TEXT_LENGTH", "1000000"))

# ============================================
# Moderation Thresholds
# ============================================
TEXT_THRESHOLD = float(os.getenv("TEXT_THRESHOLD", "0.5"))
IMAGE_THRESHOLD = float(os.getenv("IMAGE_THRESHOLD", "0.5"))
