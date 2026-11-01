"""
Tầng HTTP cho summarize text trực tiếp (không qua pipeline document).

Hai endpoint cùng một việc, khác nguồn text: JSON body hoặc file .txt upload.
Phần kiểm tra + gọi SummaryService dùng chung ở `_summarize`.
"""
import logging
import time

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile

from src.api.dependencies import get_summary_service, verify_api_key
from src.api.schemas import SummarizeTextRequest, SummarizeTextResponse
from src.config import MAX_TEXT_LENGTH, MAX_UPLOAD_BYTES

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1", tags=["summary"])


async def _summarize(text_content: str, speed: bool) -> SummarizeTextResponse:
    """
    Kiểm tra độ dài rồi sinh 3 mức summary.

    Gộp từ hai endpoint: trước đây mỗi endpoint tự lặp lại nguyên khối
    kiểm-tra-rỗng, kiểm-tra-độ-dài, bắt OOM và dựng HTTPException.
    """
    if not text_content:
        raise HTTPException(status_code=400, detail="Text content is empty")

    if len(text_content) > MAX_TEXT_LENGTH:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Text too long ({len(text_content):,} characters). "
                f"Maximum allowed: {MAX_TEXT_LENGTH:,} characters"
            ),
        )

    logger.info(
        f"Summarizing text (length: {len(text_content):,} chars, speed={speed})"
    )

    summary_service = get_summary_service()
    start_time = time.time()
    try:
        result = await summary_service.summarize_triple(
            text=text_content, speed=speed
        )
    except Exception as e:
        logger.error(f"Error generating summary: {e}", exc_info=True)
        if "out of memory" in str(e).lower() or "CUDA" in str(e):
            raise HTTPException(
                status_code=500,
                detail=(
                    "GPU out of memory during summary generation. "
                    "Try using speed=True or reducing text length."
                ),
            ) from e
        raise HTTPException(
            status_code=500, detail=f"Summary generation failed: {str(e)}"
        ) from e

    elapsed_ms = (time.time() - start_time) * 1000.0
    logger.info(f"Summary generated successfully in {elapsed_ms:.2f}ms")

    return SummarizeTextResponse(**result)


@router.post("/summarize-text", response_model=SummarizeTextResponse)
async def summarize_text(
    request: SummarizeTextRequest,
    _: bool = Depends(verify_api_key),
) -> SummarizeTextResponse:
    """
    API để summarize text thành 3 mức (short, medium, detailed).
    Nhận text trong JSON body.
    """
    return await _summarize(request.text.strip(), request.speed)


@router.post("/summarize-text-file", response_model=SummarizeTextResponse)
async def summarize_text_file(
    file: UploadFile = File(...),
    speed: bool = Query(False, description="Dùng speed mode để tăng tốc độ"),
    _: bool = Depends(verify_api_key),
) -> SummarizeTextResponse:
    """
    API để summarize text từ file .txt thành 3 mức (short, medium, detailed).
    """
    if file.filename and not file.filename.lower().endswith(".txt"):
        raise HTTPException(status_code=400, detail="File must be .txt format")

    content = await file.read()
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="File is empty")

    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=400,
            detail=(
                f"File size ({len(content) / 1024 / 1024:.2f}MB) exceeds maximum "
                f"allowed size of {MAX_UPLOAD_BYTES / 1024 / 1024:.0f}MB"
            ),
        )

    # Thử UTF-8 trước, fallback Latin-1
    try:
        text_content = content.decode("utf-8").strip()
    except UnicodeDecodeError:
        try:
            text_content = content.decode("latin-1").strip()
        except UnicodeDecodeError as e:
            raise HTTPException(
                status_code=400,
                detail="File encoding not supported. Please use UTF-8 or Latin-1 encoding.",
            ) from e

    return await _summarize(text_content, speed)
