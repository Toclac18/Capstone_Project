import torch
import torch.nn as nn
from PIL import Image
import torchvision.transforms as transforms
import logging
from typing import Dict, Any, List
from pathlib import Path

from ..config import IMAGE_MODEL_PATH, BASE_DIR

logger = logging.getLogger(__name__)


class ImageModerationService:
    """
    Image moderation service dùng MobileNetV3 Large (2 lớp: non-toxic / toxic).
    """

    def __init__(self, model_path: str | None = None):
        if model_path is None:
            model_path = (
                str(Path(IMAGE_MODEL_PATH).resolve())
                if Path(IMAGE_MODEL_PATH).is_absolute()
                else str(BASE_DIR / IMAGE_MODEL_PATH)
            )

        self.model_path = model_path
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model: nn.Module | None = None
        self.transform = None
        self.load_model()

    def load_model(self) -> None:
        """Load image moderation model."""
        try:
            logger.info(f"Loading image model from {self.model_path}")

            checkpoint = torch.load(self.model_path, map_location=self.device)

            if "model_state_dict" in checkpoint:
                logger.info(
                    "Detected full training checkpoint — loading model_state_dict..."
                )
                state_dict = checkpoint["model_state_dict"]
            else:
                logger.info("Detected pure state_dict file — loading directly...")
                state_dict = checkpoint

            from torchvision.models import mobilenet_v3_large

            self.model = mobilenet_v3_large(weights=None)
            self.model.classifier[3] = nn.Linear(
                self.model.classifier[3].in_features, 2
            )

            missing, unexpected = self.model.load_state_dict(
                state_dict, strict=False
            )
            logger.info(
                f"Model loaded successfully! Missing: {len(missing)}, Unexpected: {len(unexpected)}"
            )

            self.model.to(self.device)
            self.model.eval()

            self.transform = transforms.Compose(
                [
                    transforms.Resize((224, 224)),
                    transforms.ToTensor(),
                    transforms.Normalize(
                        mean=[0.485, 0.456, 0.406],
                        std=[0.229, 0.224, 0.225],
                    ),
                ]
            )

            logger.info("Image model loaded successfully")
        except Exception as e:
            logger.error(f"Error loading image model: {e}", exc_info=True)
            raise e

    def preprocess_image(self, image: Image.Image) -> torch.Tensor:
        """Tiền xử lý ảnh."""
        if image.mode != "RGB":
            image = image.convert("RGB")
        tensor = self.transform(image)
        return tensor.unsqueeze(0)

    def predict(self, image: Image.Image) -> Dict[str, Any]:
        """Dự đoán 1 ảnh có toxic hay không."""
        try:
            input_tensor = self.preprocess_image(image).to(self.device)

            with torch.no_grad():
                outputs = self.model(input_tensor)
                predictions = torch.nn.functional.softmax(outputs, dim=-1)

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
            logger.error(f"Error in image prediction: {e}", exc_info=True)
            raise e

    def predict_batch(self, images: List[Image.Image]) -> List[Dict[str, Any]]:
        """Dự đoán batch ảnh."""
        try:
            if not images:
                return []

            batch_tensors = []
            for image in images:
                if image.mode != "RGB":
                    image = image.convert("RGB")
                tensor = self.transform(image)
                batch_tensors.append(tensor)

            batch_tensor = torch.stack(batch_tensors).to(self.device)

            with torch.no_grad():
                predictions = self.model(batch_tensor)

            results: List[Dict[str, Any]] = []
            probabilities = predictions.cpu().numpy()
            predicted_classes = torch.argmax(predictions, dim=-1).cpu().numpy()

            labels = ["non-toxic", "toxic"]

            for i in range(len(images)):
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
            logger.error(f"Error in batch image prediction: {e}", exc_info=True)
            raise e

    def is_safe(self, image: Image.Image, threshold: float = 0.5) -> bool:
        """Ảnh an toàn nếu không toxic hoặc toxic nhưng dưới ngưỡng."""
        result = self.predict(image)
        return not result["is_toxic"] or result["confidence"] < threshold


