import logging
from pathlib import Path
from typing import Any, Dict, List, Sequence

import torch
import torch.nn as nn
import torchvision.transforms as transforms
from PIL import Image

from ..config import BASE_DIR, IMAGE_MODEL_PATH

logger = logging.getLogger(__name__)

LABELS = ("non-toxic", "toxic")

# Softmax phải cho tổng xác suất ~1. Sai số FP16 -> float chỉ cỡ 1e-3, nên
# ngưỡng này rộng rãi mà vẫn bắt được trường hợp quên softmax (hàng logit thô
# cộng lại ra 3.7, -1.2, ... chứ không ra 1).
_PROB_SUM_TOLERANCE = 0.05


def labelled_results(probabilities: Sequence[Sequence[float]]) -> List[Dict[str, Any]]:
    """
    Đổi ma trận xác suất [n, 2] thành danh sách kết quả.

    Hàm thuần (không torch) để hai đường `predict` và `predict_batch` dùng
    chung một chỗ hậu xử lý — chúng từng lệch nhau: bản batch thiếu softmax
    nên trả logit thô làm `confidence`.

    Raise ValueError nếu một hàng không phải phân phối xác suất. Đó chính là
    dấu hiệu của việc quên softmax, và thà nổ còn hơn ghi `confidence: 4.21`
    vào DB rồi kẹp về 1.0 cho giống thật.
    """
    results: List[Dict[str, Any]] = []
    for index, row in enumerate(probabilities):
        if len(row) != len(LABELS):
            raise ValueError(
                f"Ảnh {index}: model trả {len(row)} lớp, cần {len(LABELS)}"
            )

        total = float(sum(row))
        if abs(total - 1.0) > _PROB_SUM_TOLERANCE:
            raise ValueError(
                f"Ảnh {index}: tổng xác suất = {total:.4f}, không phải 1. "
                f"Output của model chưa qua softmax? (giá trị: {list(row)})"
            )

        probs = [float(value) for value in row]
        predicted_class = max(range(len(probs)), key=probs.__getitem__)
        results.append(
            {
                "prediction": LABELS[predicted_class],
                "confidence": probs[predicted_class],
                "probabilities": dict(zip(LABELS, probs)),
                "is_toxic": predicted_class == 1,
            }
        )
    return results


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

            # Tối ưu: Dùng FP16 (half precision) nếu GPU available để tăng tốc ~2x
            if self.device.type == "cuda":
                try:
                    self.model = self.model.half()  # FP16
                    logger.info("Image model converted to FP16 for faster inference")
                except Exception as e:
                    logger.warning(f"Could not convert image model to FP16: {e}")

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
            raise

    def preprocess_image(self, image: Image.Image) -> torch.Tensor:
        """Tiền xử lý ảnh."""
        if image.mode != "RGB":
            image = image.convert("RGB")
        tensor = self.transform(image)
        return tensor.unsqueeze(0)

    def _probabilities(self, batch_tensor: torch.Tensor) -> List[List[float]]:
        """
        Chạy model và trả xác suất (ĐÃ qua softmax) dạng list thuần.

        Đây là chỗ duy nhất gọi model, nên `predict` và `predict_batch` không
        thể lệch nhau về hậu xử lý nữa.
        """
        batch_tensor = batch_tensor.to(self.device)
        if next(self.model.parameters()).dtype == torch.float16:
            batch_tensor = batch_tensor.half()

        with torch.no_grad():
            logits = self.model(batch_tensor)
            # .float() trước softmax: FP16 dễ tràn ở exp()
            probabilities = torch.nn.functional.softmax(logits.float(), dim=-1)

        return probabilities.cpu().tolist()

    def predict(self, image: Image.Image) -> Dict[str, Any]:
        """Dự đoán 1 ảnh có toxic hay không."""
        try:
            probabilities = self._probabilities(self.preprocess_image(image))
            return labelled_results(probabilities)[0]
        except Exception as e:
            logger.error(f"Error in image prediction: {e}", exc_info=True)
            raise

    def predict_batch(self, images: List[Image.Image]) -> List[Dict[str, Any]]:
        """Dự đoán batch ảnh."""
        try:
            if not images:
                return []

            batch_tensors = [self.preprocess_image(image) for image in images]
            batch_tensor = torch.cat(batch_tensors, dim=0)
            return labelled_results(self._probabilities(batch_tensor))
        except Exception as e:
            logger.error(f"Error in batch image prediction: {e}", exc_info=True)
            raise
