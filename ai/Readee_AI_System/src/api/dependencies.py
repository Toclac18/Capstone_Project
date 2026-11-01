"""
Dependency của tầng API: xác thực và các service dùng chung.

Bốn service đều nạp model vào GPU nên phải là singleton — tạo mới mỗi request
là nạp lại model. Chúng được tạo lười (lần gọi đầu) chứ không lúc import, để
`uvicorn --reload` và `compileall` không phải chạm tới GPU.
"""
import logging
from typing import Optional

from fastapi import Header, HTTPException

from src.config import API_KEY
from src.services.document_service import DocumentService
from src.services.image_moderation_service import ImageModerationService
from src.services.summary_service import SummaryService
from src.services.text_moderation_service import TextModerationService

logger = logging.getLogger(__name__)


def verify_api_key(x_api_key: Optional[str] = Header(None, alias="X-API-Key")):
    """
    Dependency để verify API key từ header X-API-Key.
    - Nếu API_KEY trong .env không được set -> cho phép tất cả (development mode)
    - Nếu API_KEY trong .env có set -> BẮT BUỘC phải có header X-API-Key và phải đúng
    """
    if API_KEY is None:
        # Nếu không set API_KEY trong .env -> cho phép tất cả (development mode)
        logger.warning("API_KEY not set in .env - API is open to all requests")
        return True

    # Nếu API_KEY đã được set trong .env -> BẮT BUỘC phải có header
    if x_api_key is None:
        raise HTTPException(
            status_code=401,
            detail="API key required. Please provide X-API-Key header."
        )

    if x_api_key != API_KEY:
        raise HTTPException(
            status_code=401,
            detail="Invalid API key. Please provide a valid X-API-Key header."
        )
    return True


_doc_service: DocumentService | None = None
_text_service: TextModerationService | None = None
_image_service: ImageModerationService | None = None
_summary_service: SummaryService | None = None


def get_doc_service() -> DocumentService:
    global _doc_service
    if _doc_service is None:
        _doc_service = DocumentService()
    return _doc_service


def get_text_service() -> TextModerationService:
    global _text_service
    if _text_service is None:
        _text_service = TextModerationService()
    return _text_service


def get_image_service() -> ImageModerationService:
    global _image_service
    if _image_service is None:
        _image_service = ImageModerationService()
    return _image_service


def get_summary_service() -> SummaryService:
    global _summary_service
    if _summary_service is None:
        _summary_service = SummaryService()
    return _summary_service
