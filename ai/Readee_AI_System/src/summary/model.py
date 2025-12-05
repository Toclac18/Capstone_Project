import os
import logging
import torch
from transformers import AutoTokenizer, AutoModelForCausalLM, BitsAndBytesConfig
from huggingface_hub import login, HfFolder

from .settings import MODEL_ID, GPU_MAX_MEM, OFFLOAD_DIR, LOCAL_ONLY, HF_TOKEN

logger = logging.getLogger(__name__)

torch.set_grad_enabled(False)

# Performance optimizations (giống AI_Summarize)
torch.backends.cuda.matmul.allow_tf32 = True
torch.backends.cudnn.benchmark = True
torch.backends.cudnn.allow_tf32 = True


# Lấy token HF: ưu tiên .env, fallback từ cache 'hf auth login'
_token = HF_TOKEN
if not _token:
    try:
        _token = HfFolder.get_token()
    except Exception:
        _token = None


# Đăng nhập HF nếu có token
if _token:
    os.environ["HF_TOKEN"] = _token
    try:
        login(token=_token)
    except Exception as e:
        print(f"Warning: HuggingFace login failed: {e}")

_tokenizer = None
_model = None


def load_tokenizer():
    global _tokenizer
    if _tokenizer is None:
        _tokenizer = AutoTokenizer.from_pretrained(
            MODEL_ID,
            local_files_only=LOCAL_ONLY,
            token=_token,
        )
    return _tokenizer


def load_model():
    global _model
    if _model is None:
        # Log GPU/CUDA info
        logger.info("=" * 60)
        logger.info("GPU/CUDA Information:")
        logger.info(f"  CUDA available: {torch.cuda.is_available()}")
        if torch.cuda.is_available():
            logger.info(f"  CUDA version: {torch.version.cuda}")
            logger.info(f"  GPU count: {torch.cuda.device_count()}")
            for i in range(torch.cuda.device_count()):
                logger.info(f"  GPU {i}: {torch.cuda.get_device_name(i)}")
                logger.info(f"    Memory: {torch.cuda.get_device_properties(i).total_memory / 1024**3:.2f} GB")
        else:
            logger.warning("  ⚠️  CUDA NOT AVAILABLE - Model will run on CPU (VERY SLOW!)")
        logger.info("=" * 60)
        
        # Giống logic của AI_Summarize: ưu tiên quantization 4-bit, fallback full precision.
        # Tuy nhiên trên Windows / một số bản bitsandbytes, kernel nf4 có thể thiếu
        # (lỗi: function 'cquantize_blockwise_fp16_nf4' not found), nên ta phải
        # detect và fallback một cách an toàn.
        use_quantization = True
        try:
            import bitsandbytes as bnb  # noqa: F401

            if not torch.cuda.is_available():
                use_quantization = False
                logger.warning("CUDA not available, disabling quantization")
            else:
                try:
                    _ = BitsAndBytesConfig(load_in_4bit=True)
                    use_quantization = True
                    logger.info("✓ bitsandbytes 4-bit quantization available")
                except Exception as e:
                    logger.warning(f"bitsandbytes quantization not available: {e}")
                    logger.warning("Falling back to full precision (will use more VRAM)")
                    use_quantization = False
        except Exception as e:
            logger.warning(f"bitsandbytes not available: {e}")
            logger.warning("Falling back to full precision (will use more VRAM)")
            use_quantization = False

        def _load_fp16_model():
            """Load model FP16 trên GPU (không quantization)."""
            logger.info("Loading model in full precision FP16 (no 4-bit quantization)...")
            model = AutoModelForCausalLM.from_pretrained(
                MODEL_ID,
                torch_dtype=torch.float16,
                device_map="auto",
                max_memory={0: GPU_MAX_MEM, "cpu": "12GiB"},
                offload_folder=str(OFFLOAD_DIR),
                low_cpu_mem_usage=True,
                local_files_only=LOCAL_ONLY,
                token=_token,
                attn_implementation="sdpa",
            )
            # Log device info sau khi load
            device = model_device(model)
            logger.info(f"✓ Model loaded on device: {device}")
            if torch.cuda.is_available():
                logger.info(f"  GPU memory allocated: {torch.cuda.memory_allocated(device.index) / 1024**3:.2f} GB")
                logger.info(f"  GPU memory reserved: {torch.cuda.memory_reserved(device.index) / 1024**3:.2f} GB")
            return model

        if use_quantization:
            try:
                logger.info("Loading model with 4-bit quantization (NF4)...")
                bnb_cfg = BitsAndBytesConfig(
                    load_in_4bit=True,
                    bnb_4bit_quant_type="nf4",
                    bnb_4bit_use_double_quant=True,
                    bnb_4bit_compute_dtype=torch.float16,
                )
                _model = AutoModelForCausalLM.from_pretrained(
                    MODEL_ID,
                    quantization_config=bnb_cfg,
                    device_map="auto",
                    max_memory={0: GPU_MAX_MEM, "cpu": "12GiB"},
                    offload_folder=str(OFFLOAD_DIR),
                    low_cpu_mem_usage=True,
                    local_files_only=LOCAL_ONLY,
                    token=_token,
                    attn_implementation="sdpa",
                )
                # Log device info sau khi load
                device = model_device(_model)
                logger.info(f"✓ Model loaded with 4-bit quantization on device: {device}")
                if torch.cuda.is_available():
                    logger.info(f"  GPU memory allocated: {torch.cuda.memory_allocated(device.index) / 1024**3:.2f} GB")
                    logger.info(f"  GPU memory reserved: {torch.cuda.memory_reserved(device.index) / 1024**3:.2f} GB")
            except AttributeError as e:
                # Đây chính là lỗi bạn đang gặp: thiếu kernel nf4 trong bitsandbytes
                if "cquantize_blockwise_fp16_nf4" in str(e):
                    logger.warning(
                        "bitsandbytes 4-bit NF4 kernel not available on this "
                        "system. Falling back to FP16 without quantization."
                    )
                    _model = _load_fp16_model()
                else:
                    raise
        else:
            _model = _load_fp16_model()

        _model.config.use_cache = True

        # Optional compile for speed
        try:
            if hasattr(torch, "compile"):
                logger.info("Compiling model for faster inference...")
                _model = torch.compile(_model, mode="reduce-overhead", fullgraph=False)  # type: ignore[attr-defined]
                logger.info("✓ Model compiled successfully!")
        except Exception as e:
            logger.warning(f"Could not compile model: {e}")
            logger.warning("Continuing without compilation...")
        
        logger.info("=" * 60)

    return _model


def model_device(model) -> torch.device:
    return next(model.parameters()).device


