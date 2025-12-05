import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import logging
from typing import Dict, Any, List
from pathlib import Path

from ..config import TEXT_MODEL_PATH, BASE_DIR

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
            logger.info("Text model loaded successfully")
        except Exception as e:
            logger.error(f"Error loading text model: {e}", exc_info=True)
            raise e

    def predict(self, text: str) -> Dict[str, Any]:
        """Dự đoán 1 đoạn text có toxic hay không."""
        try:
            inputs = self.tokenizer(
                text,
                return_tensors="pt",
                truncation=True,
                padding=True,
                max_length=512,
            )
            inputs = {k: v.to(self.device) for k, v in inputs.items()}

            with torch.no_grad():
                outputs = self.model(**inputs)
                predictions = torch.nn.functional.softmax(outputs.logits, dim=-1)

            probabilities = predictions.cpu().numpy()[0]
            predicted_class = int(
                torch.argmax(predictions, dim=-1).cpu().numpy()[0]
            )

            labels = ["non-toxic", "toxic"]
            predicted_label = labels[predicted_class]
            confidence = float(probabilities[predicted_class])

            return {
                "prediction": predicted_label,
                "confidence": confidence,
                "probabilities": {
                    "non-toxic": float(probabilities[0]),
                    "toxic": float(probabilities[1]),
                },
                "is_toxic": predicted_class == 1,
            }
        except Exception as e:
            logger.error(f"Error in text prediction: {e}", exc_info=True)
            raise e

    def predict_batch(self, texts: List[str]) -> List[Dict[str, Any]]:
        """Dự đoán batch text (tối ưu hiệu năng)."""
        try:
            if not texts:
                return []

            inputs = self.tokenizer(
                texts,
                return_tensors="pt",
                padding=True,
                truncation=True,
                max_length=512,
            )
            inputs = {k: v.to(self.device) for k, v in inputs.items()}

            with torch.no_grad():
                outputs = self.model(**inputs)
                predictions = torch.nn.functional.softmax(outputs.logits, dim=-1)

            results: List[Dict[str, Any]] = []
            probabilities = predictions.cpu().numpy()
            predicted_classes = torch.argmax(predictions, dim=-1).cpu().numpy()

            labels = ["non-toxic", "toxic"]

            for i in range(len(texts)):
                predicted_class = int(predicted_classes[i])
                predicted_label = labels[predicted_class]
                confidence = float(probabilities[i][predicted_class])

                results.append(
                    {
                        "prediction": predicted_label,
                        "confidence": confidence,
                        "probabilities": {
                            "non-toxic": float(probabilities[i][0]),
                            "toxic": float(probabilities[i][1]),
                        },
                        "is_toxic": predicted_class == 1,
                    }
                )
            return results
        except Exception as e:
            logger.error(f"Error in batch text prediction: {e}", exc_info=True)
            raise e

    def is_safe(self, text: str, threshold: float = 0.5) -> bool:
        """Trả về True nếu text an toàn (non-toxic hoặc toxic nhưng dưới ngưỡng)."""
        result = self.predict(text)
        return not result["is_toxic"] or result["confidence"] < threshold


