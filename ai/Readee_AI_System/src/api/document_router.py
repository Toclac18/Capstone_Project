"""
Tầng HTTP cho xử lý document.

Router chỉ làm 4 việc: kiểm tra file, lưu file tạm, đẩy job vào queue, và
trả trạng thái/kết quả job. Toàn bộ pipeline (OCR -> moderation -> summary)
nằm ở `src/services/document_pipeline.py`.
"""
import logging
import os
import tempfile
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile

from src.api.dependencies import verify_api_key
from src.api.schemas import DocumentResponse, JobStatusResponse, JobSubmitResponse
from src.config import MAX_UPLOAD_BYTES
from src.services.queue_manager import get_queue_manager

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1", tags=["document"])

ALLOWED_EXTENSIONS = (".pdf", ".docx")
UPLOAD_CHUNK_BYTES = 1024 * 1024


async def _save_upload_within_limit(
    file: UploadFile, suffix: str, max_bytes: int
) -> tuple[str, int]:
    """
    Ghi file upload ra file tạm, dừng ngay khi vượt `max_bytes`.

    Trước đây là `content = await file.read()` rồi mới kiểm `len(content)`:
    toàn bộ body vào RAM trước khi biết nó có quá lớn hay không, nên một
    request 2GB làm hết RAM dù giới hạn chỉ 10MB.

    Trả (đường dẫn file tạm, số byte). Raise HTTPException 413 nếu quá lớn,
    và dọn file tạm trước khi raise.
    """
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp:
        temp_path = temp.name
        size = 0
        while chunk := await file.read(UPLOAD_CHUNK_BYTES):
            size += len(chunk)
            if size > max_bytes:
                temp.close()
                os.unlink(temp_path)
                raise HTTPException(
                    status_code=413,
                    detail=(
                        f"File size exceeds maximum allowed size of "
                        f"{max_bytes / 1024 / 1024:.0f}MB"
                    ),
                )
            temp.write(chunk)

    if size == 0:
        os.unlink(temp_path)
        raise HTTPException(status_code=400, detail="File is empty")

    return temp_path, size


@router.post("/process-document", response_model=JobSubmitResponse)
async def process_document(
    file: UploadFile = File(...),
    callback_url: Optional[str] = Query(None, description="Optional webhook URL để gọi khi job completed/failed"),
    _: bool = Depends(verify_api_key),
) -> JobSubmitResponse:
    """
    Submit document để xử lý qua queue.
    Trả về job_id ngay lập tức để tránh timeout Cloudflare (100s).

    Có 2 cách lấy kết quả:
    1. Polling: Gọi GET /process-document/{job_id}/status hoặc /result để check
    2. Webhook: Cung cấp callback_url, hệ thống sẽ tự động POST kết quả về URL đó khi xong

    Args:
        file: File PDF/DOCX cần xử lý
        callback_url: Optional webhook URL để nhận kết quả tự động
    """
    try:
        filename = file.filename or "unknown"
        logger.info("========================================")
        logger.info("📄 Received document upload request")
        logger.info(f"   File name: {filename}")

        file_extension = Path(filename).suffix.lower()
        if file_extension not in ALLOWED_EXTENSIONS:
            logger.warning(f"   ❌ Invalid file format: {file_extension}")
            raise HTTPException(
                status_code=400, detail="File must be PDF or DOCX format"
            )

        # Ghi ra file tạm, dừng ngay khi vượt giới hạn
        temp_file_path, file_size = await _save_upload_within_limit(
            file, file_extension, MAX_UPLOAD_BYTES
        )

        logger.info(
            f"   File size: {file_size / 1024 / 1024:.2f} MB ({file_size:,} bytes)"
        )
        logger.info("   ✓ File validation passed")
        logger.info("========================================")

        # Validate callback_url nếu có
        if callback_url and not callback_url.startswith(("http://", "https://")):
            os.unlink(temp_file_path)
            raise HTTPException(
                status_code=400,
                detail="callback_url must be a valid HTTP/HTTPS URL"
            )

        # Submit job vào queue
        queue_manager = get_queue_manager()
        job_id = await queue_manager.submit_job(
            file_path=temp_file_path,
            filename=filename,
            callback_url=callback_url
        )

        logger.info(
            f"Job {job_id} submitted for file: {filename}. "
            f"Queue size: {queue_manager.queue.qsize()}, "
            f"Total tracked jobs: {len(queue_manager.jobs)}"
        )

        # Verify job was created
        status_check = await queue_manager.get_job_status(job_id)
        if status_check is None:
            logger.error(f"CRITICAL: Job {job_id} was not found immediately after submission!")
        else:
            logger.info(f"Verified: Job {job_id} exists with status: {status_check['status']}")

        return JobSubmitResponse(
            job_id=job_id,
            status="pending",
            message="Document submitted for processing. Use /process-document/{job_id}/status to check progress."
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error submitting document: {e}", exc_info=True)
        raise HTTPException(
            status_code=500, detail=f"Failed to submit document: {str(e)}"
        ) from e


@router.get("/process-document/{job_id}/status", response_model=JobStatusResponse)
async def get_job_status(
    job_id: str,
    _: bool = Depends(verify_api_key),
) -> JobStatusResponse:
    """
    Lấy status của job.
    """
    queue_manager = get_queue_manager()
    status = await queue_manager.get_job_status(job_id)

    if status is None:
        raise HTTPException(status_code=404, detail=f"Job {job_id} not found")

    return JobStatusResponse(**status)


@router.get("/process-document/{job_id}/result", response_model=DocumentResponse)
async def get_job_result(
    job_id: str,
    _: bool = Depends(verify_api_key),
) -> DocumentResponse:
    """
    Lấy kết quả của job (chỉ khi completed).
    """
    queue_manager = get_queue_manager()
    result = await queue_manager.get_job_result(job_id)

    if result is None:
        # Check if job exists
        status = await queue_manager.get_job_status(job_id)
        if status is None:
            raise HTTPException(status_code=404, detail=f"Job {job_id} not found")
        raise HTTPException(
            status_code=202,
            detail=f"Job {job_id} is still processing. Current status: {status['status']}"
        )

    if "error" in result:
        raise HTTPException(status_code=500, detail=result["error"])

    return DocumentResponse(**result)


@router.get("/process-document/queue-info")
async def get_queue_info(
    _: bool = Depends(verify_api_key),
):
    """
    Lấy thông tin về queue (số lượng jobs đang chờ, đang xử lý, v.v.).
    """
    queue_manager = get_queue_manager()
    return await queue_manager.get_queue_info()


@router.get("/process-document/debug/list-jobs")
async def list_all_jobs(
    limit: int = Query(50, description="Số lượng jobs tối đa để list"),
    _: bool = Depends(verify_api_key),
):
    """
    Debug endpoint: List tất cả jobs trong memory (để debug).
    """
    queue_manager = get_queue_manager()
    jobs_list = await queue_manager.list_jobs(limit=limit)
    queue_info = await queue_manager.get_queue_info()

    return {
        "total_jobs": queue_info["total_jobs"],
        "queue_info": queue_info,
        "jobs": jobs_list,
    }
