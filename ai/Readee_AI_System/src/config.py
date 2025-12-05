"""
Configuration module for Readee_AI_System.
Loads environment variables and provides configuration for moderation and summary models.
"""
import os
from pathlib import Path

from dotenv import load_dotenv

# Base directory for this project (Readee_AI_System root)
# __file__ = Readee_AI_System/src/config.py
# parents[0] -> src/, parents[1] -> Readee_AI_System/
BASE_DIR = Path(__file__).resolve().parents[1]

# Load .env from project root (Readee_AI_System/.env)
load_dotenv(BASE_DIR / ".env")

# ============================================
# Summary Model Configuration (Llama)
# ============================================
SAFE_INPUT_TOKENS = int(os.getenv("SAFE_INPUT_TOKENS", "1024"))
PER_CHUNK_BUDGET = int(os.getenv("PER_CHUNK_BUDGET", "128"))
GPU_MAX_MEM = os.getenv("GPU_MAX_MEM", "11000MiB")
LOCAL_ONLY = os.getenv("LOCAL_ONLY", "0").lower() in ("1", "true", "yes")
MODEL_ID = os.getenv("MODEL_ID", "meta-llama/Llama-3.2-3B-Instruct")
HF_TOKEN = os.getenv("HF_TOKEN", None)

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

# ============================================
# Paths for summary offload/history
# ============================================
OFFLOAD_DIR = BASE_DIR / "offload"
OFFLOAD_DIR.mkdir(exist_ok=True)

HIST_PATH = BASE_DIR / "server" / "run_history.json"
HIST_PATH.parent.mkdir(parents=True, exist_ok=True)

# ============================================
# API Security
# ============================================
API_KEY = os.getenv("API_KEY", None)  # Set trong .env để bảo mật

# ============================================
# Moderation Thresholds
# ============================================
TEXT_THRESHOLD = float(os.getenv("TEXT_THRESHOLD", "0.5"))
IMAGE_THRESHOLD = float(os.getenv("IMAGE_THRESHOLD", "0.5"))


