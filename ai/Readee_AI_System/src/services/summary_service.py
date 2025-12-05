"""
Summary Service Wrapper for Readee_AI_System.
Sử dụng lại cấu trúc từ TestOcr/src/ddd/summary_service.py.
"""
import logging
import os
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

_summarizer: Optional[Any] = None


class SummaryService:
    """Service wrapper cho summarization (triple / single)."""

    def __init__(self):
        self._ensure_loaded()

    def _ensure_loaded(self) -> None:
        """Load model + tokenizer nếu chưa load."""
        global _summarizer
        if _summarizer is None:
            try:
                logger.info("Loading summary model and tokenizer...")
                from ..summary.model import load_model, load_tokenizer
                from ..summary.worker import AsyncSummarizer

                tokenizer = load_tokenizer()
                model = load_model()

                # Log device info
                from ..summary.model import model_device
                device = model_device(model)
                logger.info(f"Model device: {device}")
                if device.type == "cuda":
                    import torch
                    logger.info(f"  GPU: {torch.cuda.get_device_name(device.index)}")
                    logger.info(f"  GPU memory: {torch.cuda.memory_allocated(device.index) / 1024**3:.2f} GB allocated")

                # Cho phép cấu hình concurrency qua ENV, mặc định 2 cho RTX 5070 12GB
                max_conc = int(os.getenv("MAX_GPU_CONCURRENCY", "2"))

                _summarizer = AsyncSummarizer(
                    model=model,
                    tokenizer=tokenizer,
                    max_gpu_concurrency=max_conc,
                )
                logger.info(
                    f"✓ Summary model loaded successfully (max_gpu_concurrency={max_conc}, device={device})"
                )
            except Exception as e:
                logger.error(f"Failed to load summary model: {e}", exc_info=True)
                raise

    async def summarize_triple(
        self, text: str, speed: bool = False
    ) -> Dict[str, Any]:
        """
        Sinh 3 mức summary (short / medium / detailed) từ 1 chuỗi text.
        """
        if _summarizer is None:
            raise RuntimeError("Summary model not loaded")

        if not text or not text.strip():
            return {
                "input_tokens": 0,
                "budgets": {},
                "runtime_ms_total": 0,
                "results": {
                    "short": {"text": "", "output_tokens": 0},
                    "medium": {"text": "", "output_tokens": 0},
                    "detailed": {"text": "", "output_tokens": 0},
                },
            }

        try:
            result = await _summarizer.summarize_triple(text=text, speed=speed)
            return result
        except Exception as e:
            logger.error(f"Error generating summary: {e}", exc_info=True)
            raise

    async def summarize_single(
        self, level: str, text: str, speed: bool = False
    ) -> Dict[str, Any]:
        """
        Sinh summary 1 mức (short / medium / detailed).
        """
        if _summarizer is None:
            raise RuntimeError("Summary model not loaded")

        if level not in ["short", "medium", "detailed"]:
            raise ValueError(
                f"Invalid level: {level}. Must be 'short', 'medium', or 'detailed'"
            )

        if not text or not text.strip():
            return {
                "input_tokens": 0,
                "budget": 0,
                "result": {
                    "text": "",
                    "output_tokens": 0,
                    "runtime_ms": 0,
                },
            }

        try:
            result = await _summarizer.summarize_single(
                level=level, text=text, speed=speed
            )
            return result
        except Exception as e:
            logger.error(f"Error generating {level} summary: {e}", exc_info=True)
            raise


