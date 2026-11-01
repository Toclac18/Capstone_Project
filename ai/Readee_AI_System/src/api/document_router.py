"""
Tầng HTTP cho xử lý document.

Router chỉ làm 4 việc: kiểm tra file, lưu file tạm, đẩy job vào queue, và
trả trạng thái/kết quả job. Toàn bộ pipeline (OCR -> moderation -> summary)
nằm ở `src/services/document_pipeline.py`.
"""
import logging
import tempfile
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile

from src.api.dependencies import verify_api_key
from src.api.schemas import DocumentResponse, JobStatusResponse, JobSubmitResponse
from src.services.queue_manager import get_queue_manager

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1", tags=["document"])

ALLOWED_EXTENSIONS = (".pdf", ".docx")


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

        # Kiểm tra kích thước file (giới hạn 10MB)
        MAX_FILE_SIZE = 10 * 1024 * 1024
        content = await file.read()
        file_size = len(content)
        file_size_mb = file_size / 1024 / 1024

        logger.info(f"   File size: {file_size_mb:.2f} MB ({file_size:,} bytes)")

        if file_size > MAX_FILE_SIZE:
            logger.warning(f"   ❌ File too large: {file_size_mb:.2f}MB > 10MB")
            raise HTTPException(
                status_code=400,
                detail=f"File size ({file_size_mb:.2f}MB) exceeds maximum allowed size of 10MB"
            )

        if file_size == 0:
            logger.warning("   ❌ File is empty")
            raise HTTPException(status_code=400, detail="File is empty")

        logger.info("   ✓ File validation passed")
        logger.info("========================================")

        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=file_extension) as temp:
            temp.write(content)
            temp_file_path = temp.name
        del content

        # Validate callback_url nếu có
        if callback_url and not callback_url.startswith(("http://", "https://")):
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
