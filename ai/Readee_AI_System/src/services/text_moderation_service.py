import logging
from pathlib import Path
from typing import Any, Dict, List

import torch
from transformers import AutoModelForSequenceClassification, AutoTokenizer

from ..config import BASE_DIR, TEXT_MODEL_PATH
from .moderation_labels import labelled_results

logger = logging.getLogger(__name__)


class TextModerationService:
    """
    Text moderation service using a sequence classification model
    (ví dụ DeBERTa v2 hoặc model fine-tuned của bạn).
    """

    def __init__(self, model_path: str | None = None):
        if model_path is None:
            # Dùng path tuyệt đối từ config
            model_path = (
                str(Path(TEXT_MODEL_PATH).resolve())
                if Path(TEXT_MODEL_PATH).is_absolute()
                else str(BASE_DIR / TEXT_MODEL_PATH)
            )

        self.model_path = model_path
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.tokenizer = None
        self.model = None
        self.load_model()

    def load_model(self) -> None:
        """Load text moderation model."""
        try:
            logger.info(f"Loading text model from {self.model_path}")
            self.tokenizer = AutoTokenizer.from_pretrained(self.model_path)
            self.model = AutoModelForSequenceClassification.from_pretrained(
                self.model_path
            )
            self.model.to(self.device)
            self.model.eval()

            # Tối ưu: Dùng FP16 (half precision) nếu GPU available để tăng tốc ~2x
            if self.device.type == "cuda":
                try:
                    self.model = self.model.half()  # FP16
                    logger.info("Text model converted to FP16 for faster inference")
                except Exception as e:
                    logger.warning(f"Could not convert text model to FP16: {e}")

            logger.info("Text model loaded successfully")
        except Exception as e:
            logger.error(f"Error loading text model: {e}", exc_info=True)
            raise

    def _probabilities(self, texts: List[str]) -> List[List[float]]:
        """
        Tokenize + chạy model, trả xác suất (ĐÃ qua softmax) dạng list thuần.

        Chỗ duy nhất gọi model, để `predict` và `predict_batch` không lệch
        nhau về hậu xử lý — đúng lỗi đã xảy ra ở model ảnh.
        """
        inputs = self.tokenizer(
            texts,
            return_tensors="pt",
            truncation=True,
            padding=True,
            max_length=512,
        )
        inputs = {k: v.to(self.device) for k, v in inputs.items()}

        # Input của tokenizer là tensor số nguyên (input_ids, attention_mask),
        # không cần và không được đổi sang FP16 — model tự cast bên trong.
        with torch.no_grad():
            logits = self.model(**inputs).logits
            # .float() trước softmax: FP16 dễ tràn ở exp()
            probabilities = torch.nn.functional.softmax(logits.float(), dim=-1)

        return probabilities.cpu().tolist()

    def predict(self, text: str) -> Dict[str, Any]:
        """Dự đoán 1 đoạn text có toxic hay không."""
        try:
            return labelled_results(self._probabilities([text]))[0]
        except Exception as e:
            logger.error(f"Error in text prediction: {e}", exc_info=True)
            raise

    def predict_batch(self, texts: List[str]) -> List[Dict[str, Any]]:
        """Dự đoán batch text (tối ưu hiệu năng)."""
        try:
            if not texts:
                return []
            return labelled_results(self._probabilities(texts))
        except Exception as e:
            logger.error(f"Error in batch text prediction: {e}", exc_info=True)
            raise
