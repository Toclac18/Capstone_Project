"""
Document Processing API Router for Readee_AI_System.

Pipeline:
- Nhận file PDF/DOCX.
- Gọi DocumentService để lấy (full_text, text_path, images).
- Dùng TextModerationService + ImageModerationService để kiểm duyệt.
- Nếu pass -> dùng SummaryService để tạo 3 mức summary.
- Trả về status + violations + summaries + text_path.
"""

from fastapi import APIRouter, HTTPException, UploadFile, File, Query, Header, Depends
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
import logging
import tempfile
import os
import time
import asyncio
from pathlib import Path

from src.services.document_service import DocumentService
from src.services.text_moderation_service import TextModerationService
from src.services.image_moderation_service import ImageModerationService
from src.services.summary_service import SummaryService
from src.config import API_KEY, TEXT_THRESHOLD, IMAGE_THRESHOLD

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1", tags=["document"])


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


class DocumentResponse(BaseModel):
    status: str
    violations: List[Dict[str, Any]]
    summaries: Optional[Dict[str, Any]] = None
    timings: Optional[Dict[str, float]] = None  # ms cho từng bước chính


def split_text_into_chunks(text: str, max_tokens: int = 100) -> List[str]:
    max_chars = max_tokens * 4

    if len(text) <= max_chars:
        return [text]

    chunks = []
    # Tách text thành từ (chỉ ở khoảng trắng)
    words = text.split()
    current_chunk: List[str] = []
    current_length = 0

    for word in words:
        # Độ dài từ + 1 khoảng trắng
        word_length = len(word) + 1

        # Nếu thêm từ này vượt quá max_chars và đã có từ trong chunk
        # -> Lưu chunk hiện tại, bắt đầu chunk mới
        if current_length + word_length > max_chars and current_chunk:
            chunks.append(" ".join(current_chunk))
            current_chunk = [word]
            current_length = word_length
        else:
            # Thêm từ vào chunk hiện tại
            current_chunk.append(word)
            current_length += word_length

    # Thêm chunk cuối cùng nếu còn
    if current_chunk:
        chunks.append(" ".join(current_chunk))

    return chunks


@router.post("/process-document", response_model=DocumentResponse)
async def process_document(
    file: UploadFile = File(...),
    _: bool = Depends(verify_api_key),  # API key authentication
) -> DocumentResponse:
    start_time = time.time()
    ocr_ms = 0.0
    img_mod_ms = 0.0
    text_mod_ms = 0.0
    summary_ms = 0.0
    temp_file_path: str | None = None

    try:
        logger.info(f"Processing document: {file.filename}")

        file_extension = Path(file.filename).suffix.lower() if file.filename else ""
        if file_extension not in [".pdf", ".docx"]:
            raise HTTPException(
                status_code=400, detail="File must be PDF or DOCX format"
            )

        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=file_extension) as temp:
            content = await file.read()
            temp.write(content)
            temp_file_path = temp.name

        doc_service = get_doc_service()
        text_service = get_text_service()
        image_service = get_image_service()

        violations: List[Dict[str, Any]] = []

        # ----- Extract text + images (OCR / DOCX parsing) -----
        t0 = time.time()
        if file_extension == ".pdf":
            full_text, _, images = doc_service.process_pdf(temp_file_path)
        else:
            full_text, _, images = doc_service.process_docx(temp_file_path)
        ocr_ms = (time.time() - t0) * 1000.0

        # ----- Image moderation -----
        if images:
            t1 = time.time()
            img_results = image_service.predict_batch(images)
            img_mod_ms = (time.time() - t1) * 1000.0
            for idx, res in enumerate(img_results):
                if res["is_toxic"] and res["confidence"] >= IMAGE_THRESHOLD:
                    violations.append(
                        {
                            "type": "image",
                            "index": idx,
                            "prediction": res["prediction"],
                            "confidence": res["confidence"],
                        }
                    )
                    # stop at first violation
                    break

        # ----- Text moderation -----
        if not violations and full_text.strip():
            chunks = split_text_into_chunks(full_text, max_tokens=100)
            t2 = time.time()
            txt_results = text_service.predict_batch(chunks)
            text_mod_ms = (time.time() - t2) * 1000.0
            for idx, res in enumerate(txt_results):
                if res["is_toxic"] and res["confidence"] >= TEXT_THRESHOLD:
                    snippet = chunks[idx][:200]
                    violations.append(
                        {
                            "type": "text",
                            "index": idx,
                            "snippet": snippet,
                            "prediction": res["prediction"],
                            "confidence": res["confidence"],
                        }
                    )
                    break

        if violations:
            logger.info(
                f"Document blocked. Violations: {len(violations)}. "
                f"Total time: {time.time() - start_time:.2f}s"
            )
            return DocumentResponse(
                status="fail",
                violations=violations,
                summaries=None,
                timings={
                    "ocr_ms": ocr_ms,
                    "image_moderation_ms": img_mod_ms,
                    "text_moderation_ms": text_mod_ms,
                    "summary_ms": summary_ms,
                    "total_ms": (time.time() - start_time) * 1000.0,
                },
            )

        # ----- Summary -----
        summary_service = get_summary_service()
        t3 = time.time()
        # Speed mode mặc định = True để tối ưu tốc độ
        summary_result = await summary_service.summarize_triple(
            text=full_text, speed=True
        )
        summary_ms = (time.time() - t3) * 1000.0

        logger.info(
            f"Document processed successfully. Total time: {time.time() - start_time:.2f}s"
        )
        return DocumentResponse(
            status="pass",
            violations=[],
            summaries=summary_result.get("results") if summary_result else None,
            timings={
                "ocr_ms": ocr_ms,
                "image_moderation_ms": img_mod_ms,
                "text_moderation_ms": text_mod_ms,
                "summary_ms": summary_ms,
                "total_ms": (time.time() - start_time) * 1000.0,
            },
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing document: {e}", exc_info=True)
        raise HTTPException(
            status_code=500, detail=f"Document processing failed: {str(e)}"
        )
    finally:
        if temp_file_path and os.path.exists(temp_file_path):
            try:
                os.unlink(temp_file_path)
            except Exception:
                pass


