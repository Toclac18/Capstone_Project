import os
from pathlib import Path
import yaml
from dotenv import load_dotenv

# Env flags cho HF / PyTorch
os.environ.setdefault("TOKENIZERS_PARALLELISM", "false")
os.environ.setdefault("HF_HUB_DISABLE_TELEMETRY", "1")
os.environ.setdefault(
    "PYTORCH_CUDA_ALLOC_CONF",
    "expandable_segments:True,max_split_size_mb:64",
)

# BASE là thư mục Readee_AI_System (cha của summary/)
BASE = Path(__file__).resolve().parents[1]
load_dotenv(BASE / ".env")

# Core tuning knobs
SAFE_INPUT_TOKENS = int(os.getenv("SAFE_INPUT_TOKENS", "1024"))
PER_CHUNK_BUDGET = int(os.getenv("PER_CHUNK_BUDGET", "128"))
GPU_MAX_MEM = os.getenv("GPU_MAX_MEM", "11000MiB")
LOCAL_ONLY = os.getenv("LOCAL_ONLY", "0").lower() in ("1", "true", "yes")
MODEL_ID = os.getenv("MODEL_ID", "meta-llama/Llama-3.2-3B-Instruct")
HF_TOKEN = os.getenv("HF_TOKEN", None)

# Load config.yaml cho prompts + dynamic budgets
CFG = yaml.safe_load(
    (BASE / "common" / "config.yaml").read_text(encoding="utf-8")
)

# Paths cho history + offload
HIST_PATH = BASE / "server" / "run_history.json"
HIST_PATH.parent.mkdir(parents=True, exist_ok=True)

OFFLOAD_DIR = BASE / "offload"
OFFLOAD_DIR.mkdir(exist_ok=True)


