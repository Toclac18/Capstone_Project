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
from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional, Tuple
import logging
import tempfile
import os
import time
import asyncio
import gc
from pathlib import Path

# Note: GPU cache clearing is handled in summary/worker.py

from src.services.document_service import DocumentService
from src.services.text_moderation_service import TextModerationService
from src.services.image_moderation_service import ImageModerationService
from src.services.summary_service import SummaryService
from src.services.queue_manager import get_queue_manager
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


class JobSubmitResponse(BaseModel):
    job_id: str
    status: str
    message: str


class JobStatusResponse(BaseModel):
    job_id: str
    status: str
    filename: str
    created_at: float
    progress: float
    started_at: Optional[float] = None
    completed_at: Optional[float] = None
    elapsed_seconds: Optional[float] = None
    processing_time_seconds: Optional[float] = None
    error: Optional[str] = None


def split_text_into_chunks(
    text: str, 
    max_tokens: int = 100,
    page_ranges: Dict[int, Tuple[int, int]] | None = None
) -> Tuple[List[str], List[int]]:
    """
    Tách text thành chunks và map về page numbers.
    Returns: (chunks, chunk_page_numbers)
    """
    max_chars = max_tokens * 4

    if len(text) <= max_chars:
        # Tìm page cho toàn bộ text
        page_num = _find_page_for_position(0, len(text), page_ranges)
        return [text], [page_num]

    chunks = []
    chunk_page_numbers = []
    # Tách text thành từ (chỉ ở khoảng trắng)
    words = text.split()
    current_chunk: List[str] = []
    current_length = 0
    current_start_pos = 0

    for word in words:
        # Độ dài từ + 1 khoảng trắng
        word_length = len(word) + 1

        # Nếu thêm từ này vượt quá max_chars và đã có từ trong chunk
        # -> Lưu chunk hiện tại, bắt đầu chunk mới
        if current_length + word_length > max_chars and current_chunk:
            chunk_text = " ".join(current_chunk)
            chunks.append(chunk_text)
            
            # Tìm page number cho chunk này
            chunk_end_pos = current_start_pos + len(chunk_text)
            page_num = _find_page_for_position(current_start_pos, chunk_end_pos, page_ranges)
            chunk_page_numbers.append(page_num)
            
            current_chunk = [word]
            current_length = word_length
            # Cập nhật start position cho chunk mới
            current_start_pos = chunk_end_pos + 1  # +1 cho space giữa chunks
        else:
            # Thêm từ vào chunk hiện tại
            current_chunk.append(word)
            current_length += word_length

    # Thêm chunk cuối cùng nếu còn
    if current_chunk:
        chunk_text = " ".join(current_chunk)
        chunks.append(chunk_text)
        chunk_end_pos = current_start_pos + len(chunk_text)
        page_num = _find_page_for_position(current_start_pos, chunk_end_pos, page_ranges)
        chunk_page_numbers.append(page_num)

    return chunks, chunk_page_numbers


def _find_page_for_position(
    start_pos: int, 
    end_pos: int, 
    page_ranges: Dict[int, Tuple[int, int]] | None
) -> int:
    """
    Tìm page number cho một đoạn text dựa trên vị trí trong full_text.
    Returns page number (1-indexed), default = 1 nếu không tìm thấy.
    Tối ưu: tìm page chứa start_pos (thường là page đúng nhất).
    """
    if not page_ranges:
        return 1
    
    # Tối ưu: tìm page chứa start_pos (nhanh hơn)
    sorted_pages = sorted(page_ranges.items())
    for page_num, (page_start, page_end) in sorted_pages:
        # Nếu start_pos nằm trong range của page này
        if page_start <= start_pos < page_end:
            return page_num
        # Nếu start_pos < page_start và đã qua page đầu tiên -> thuộc page trước đó
        if start_pos < page_start and page_num > 1:
            return page_num - 1
    
    # Nếu không tìm thấy, kiểm tra overlap
    for page_num, (page_start, page_end) in sorted_pages:
        if start_pos < page_end and end_pos > page_start:
            return page_num
    
    # Default: trả về page cuối cùng hoặc 1
    return sorted_pages[-1][0] if sorted_pages else 1


async def process_document_internal(
    job_id: str,
    temp_file_path: str,
    filename: str,
) -> Dict[str, Any]:
    """
    Internal function để xử lý document (được gọi bởi queue worker).
    Trả về kết quả dạng DocumentResponse nhưng là dict.
    """
    start_time = time.time()
    ocr_ms = 0.0
    img_mod_ms = 0.0
    text_mod_ms = 0.0
    summary_ms = 0.0
    images = None
    full_text = None
    chunks = None

    try:
        logger.info(f"Processing document (job_id={job_id}): {filename}")

        file_extension = Path(filename).suffix.lower() if filename else ""
        if file_extension not in [".pdf", ".docx"]:
            raise ValueError("File must be PDF or DOCX format")

        doc_service = get_doc_service()
        text_service = get_text_service()
        image_service = get_image_service()

        violations: List[Dict[str, Any]] = []
        image_page_numbers: List[int] | None = None
        page_ranges: Dict[int, Tuple[int, int]] | None = None
        text_path: str | None = None

        # ----- Extract text + images (OCR / DOCX parsing) -----
        t0 = time.time()
        if file_extension == ".pdf":
            full_text, text_path, images, image_page_numbers, page_ranges = await doc_service.process_pdf(
                temp_file_path, use_parallel=True
            )
        else:
            full_text, text_path, images, image_page_numbers, page_ranges = doc_service.process_docx(temp_file_path)
        ocr_ms = (time.time() - t0) * 1000.0

        # ----- Image và Text moderation (chạy song song để tăng tốc) -----
        img_results = None
        txt_results = None
        chunk_page_numbers = None
        img_mod_ms = 0.0
        text_mod_ms = 0.0
        
        tasks = []
        task_types = []
        
        if images:
            tasks.append(asyncio.to_thread(image_service.predict_batch, images))
            task_types.append("image")
        
        if full_text.strip():
            chunks, chunk_page_numbers = split_text_into_chunks(full_text, max_tokens=100, page_ranges=page_ranges)
            tasks.append(asyncio.to_thread(text_service.predict_batch, chunks))
            task_types.append("text")
        
        if tasks:
            t1 = time.time()
            results = await asyncio.gather(*tasks, return_exceptions=True)
            total_moderation_ms = (time.time() - t1) * 1000.0
            
            result_idx = 0
            for task_type in task_types:
                result = results[result_idx]
                result_idx += 1
                
                if isinstance(result, Exception):
                    logger.error(f"Error in {task_type} moderation: {result}", exc_info=True)
                    continue
                    
                if task_type == "image":
                    img_results = result
                    img_mod_ms = total_moderation_ms
                elif task_type == "text":
                    txt_results = result
                    text_mod_ms = total_moderation_ms
        
        # Xử lý image violations
        if img_results:
            for idx, res in enumerate(img_results):
                if res["is_toxic"] and res["confidence"] >= IMAGE_THRESHOLD:
                    page_num = image_page_numbers[idx] if image_page_numbers and idx < len(image_page_numbers) else None
                    
                    # Đảm bảo confidence trong [0, 1] và tính phần trăm
                    confidence_value = float(res["confidence"])
                    confidence_value = max(0.0, min(1.0, confidence_value))  # Clamp trong [0, 1]
                    confidence_percent = confidence_value * 100.0
                    
                    violation = {
                        "type": "image",
                        "index": idx,
                        "prediction": res["prediction"],
                        "confidence": confidence_value,  # Tỉ lệ [0, 1]
                        "confidence_percent": round(confidence_percent, 2),  # Phần trăm [0, 100]
                    }
                    if page_num is not None:
                        violation["page"] = page_num
                    
                    violations.append(violation)
                    break
            del images, img_results
            images = None
            if image_page_numbers:
                del image_page_numbers
            image_page_numbers = None
        
        # Xử lý text violations
        if not violations and txt_results:
            for idx, res in enumerate(txt_results):
                if res["is_toxic"] and res["confidence"] >= TEXT_THRESHOLD:
                    # Lấy toàn bộ chunk thay vì chỉ 200 ký tự đầu
                    snippet = chunks[idx] if idx < len(chunks) else ""
                    page_num = chunk_page_numbers[idx] if idx < len(chunk_page_numbers) else None
                    
                    # Đảm bảo confidence trong [0, 1] và tính phần trăm
                    confidence_value = float(res["confidence"])
                    confidence_value = max(0.0, min(1.0, confidence_value))  # Clamp trong [0, 1]
                    confidence_percent = confidence_value * 100.0
                    
                    violation = {
                        "type": "text",
                        "index": idx,
                        "snippet": snippet,  # Toàn bộ chunk vi phạm
                        "prediction": res["prediction"],
                        "confidence": confidence_value,  # Tỉ lệ [0, 1]
                        "confidence_percent": round(confidence_percent, 2),  # Phần trăm [0, 100]
                    }
                    if page_num is not None:
                        violation["page"] = page_num
                    
                    violations.append(violation)
                    break
            del chunks, chunk_page_numbers, txt_results
            chunks = None
        
        gc.collect(0)

        if violations:
            if full_text:
                del full_text
                full_text = None
            logger.info(
                f"Document blocked (job_id={job_id}). Violations: {len(violations)}. "
                f"Total time: {time.time() - start_time:.2f}s"
            )
            return {
                "status": "fail",
                "violations": violations,
                "summaries": None,
                "timings": {
                    "ocr_ms": ocr_ms,
                    "image_moderation_ms": img_mod_ms,
                    "text_moderation_ms": text_mod_ms,
                    "summary_ms": summary_ms,
                    "total_ms": (time.time() - start_time) * 1000.0,
                },
            }

        # ----- Summary -----
        summary_service = get_summary_service()
        t3 = time.time()
        try:
            summary_result = await summary_service.summarize_triple(text=full_text, speed=True)
        except Exception as e:
            if "out of memory" in str(e).lower() or "CUDA" in str(e):
                logger.error(
                    f"GPU out of memory during summary (job_id={job_id}). "
                    f"Consider reducing MAX_GPU_CONCURRENCY or using smaller model."
                )
            raise
        finally:
            if full_text:
                del full_text
                full_text = None
        summary_ms = (time.time() - t3) * 1000.0

        logger.info(
            f"Document processed successfully (job_id={job_id}). Total time: {time.time() - start_time:.2f}s"
        )
        return {
            "status": "pass",
            "violations": [],
            "summaries": summary_result.get("results") if summary_result else None,
            "timings": {
                "ocr_ms": ocr_ms,
                "image_moderation_ms": img_mod_ms,
                "text_moderation_ms": text_mod_ms,
                "summary_ms": summary_ms,
                "total_ms": (time.time() - start_time) * 1000.0,
            },
        }
    except Exception as e:
        logger.error(f"Error processing document (job_id={job_id}): {e}", exc_info=True)
        raise
    finally:
        # Cleanup
        if 'images' in locals() and images:
            del images
        if 'full_text' in locals() and full_text:
            del full_text
        if 'chunks' in locals() and chunks:
            del chunks
        if 'image_page_numbers' in locals() and image_page_numbers:
            del image_page_numbers
        if 'page_ranges' in locals() and page_ranges:
            del page_ranges
        # Xóa file txt từ OCR/DOCX
        if 'text_path' in locals() and text_path and os.path.exists(text_path):
            try:
                os.unlink(text_path)
                logger.info(f"Deleted OCR text file: {text_path}")
            except Exception as e:
                logger.warning(f"Failed to delete OCR text file {text_path}: {e}")
        gc.collect()


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
        if file_extension not in [".pdf", ".docx"]:
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
        if callback_url:
            # Basic URL validation
            if not (callback_url.startswith("http://") or callback_url.startswith("https://")):
                raise HTTPException(
                    status_code=400,
                    detail="callback_url must be a valid HTTP/HTTPS URL"
                )
        
        # Submit job vào queue
        queue_manager = get_queue_manager()
        job_id = await queue_manager.submit_job(
            file_path=temp_file_path,
            filename=file.filename or "unknown",
            callback_url=callback_url
        )

        logger.info(
            f"Job {job_id} submitted for file: {file.filename}. "
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
        else:
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
    info = await queue_manager.get_queue_info()
    return info


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


class SummarizeTextRequest(BaseModel):
    """Request model cho summarize text API."""
    text: str = Field(..., description="Text cần summarize", min_length=1)
    speed: bool = Field(False, description="Dùng speed mode (nhanh hơn nhưng chất lượng thấp hơn)")


class SummarizeTextResponse(BaseModel):
    """Response model cho summarize text API."""
    input_tokens: int
    budgets: Dict[str, int]
    runtime_ms_total: float
    results: Dict[str, Dict[str, Any]]


@router.post("/summarize-text", response_model=SummarizeTextResponse)
async def summarize_text(
    request: SummarizeTextRequest,
    _: bool = Depends(verify_api_key),
) -> SummarizeTextResponse:
    """
    API để summarize text thành 3 mức (short, medium, detailed).
    Nhận text trong JSON body.
    
    Args:
        request: JSON body với field "text" và optional "speed"
    
    Returns:
        SummarizeTextResponse với 3 mức summary
    """
    try:
        text_content = request.text.strip()
        
        if not text_content or len(text_content) == 0:
            raise HTTPException(status_code=400, detail="Text content is empty")
        
        # Kiểm tra độ dài text (giới hạn hợp lý)
        MAX_TEXT_LENGTH = 1_000_000  # 1M characters
        if len(text_content) > MAX_TEXT_LENGTH:
            raise HTTPException(
                status_code=400,
                detail=f"Text too long ({len(text_content):,} characters). Maximum allowed: {MAX_TEXT_LENGTH:,} characters"
            )
        
        logger.info(f"Summarizing text (length: {len(text_content):,} chars, speed={request.speed})")
        
        # Gọi SummaryService
        summary_service = get_summary_service()
        start_time = time.time()
        
        try:
            result = await summary_service.summarize_triple(text=text_content, speed=request.speed)
        except Exception as e:
            logger.error(f"Error generating summary: {e}", exc_info=True)
            if "out of memory" in str(e).lower() or "CUDA" in str(e):
                raise HTTPException(
                    status_code=500,
                    detail="GPU out of memory during summary generation. Try using speed=True or reducing text length."
                )
            raise HTTPException(
                status_code=500,
                detail=f"Summary generation failed: {str(e)}"
            )
        
        elapsed_ms = (time.time() - start_time) * 1000.0
        logger.info(f"Summary generated successfully in {elapsed_ms:.2f}ms")
        
        return SummarizeTextResponse(**result)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in summarize_text endpoint: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to summarize text: {str(e)}"
        )


@router.post("/summarize-text-file", response_model=SummarizeTextResponse)
async def summarize_text_file(
    file: UploadFile = File(...),
    speed: bool = Query(False, description="Dùng speed mode để tăng tốc độ"),
    _: bool = Depends(verify_api_key),
) -> SummarizeTextResponse:
    """
    API để summarize text từ file .txt thành 3 mức (short, medium, detailed).
    
    Args:
        file: File .txt upload
        speed: Dùng speed mode để tăng tốc độ (mặc định False)
    
    Returns:
        SummarizeTextResponse với 3 mức summary
    """
    try:
        # Kiểm tra file extension
        if file.filename and not file.filename.lower().endswith('.txt'):
            raise HTTPException(
                status_code=400,
                detail="File must be .txt format"
            )
        
        # Đọc file
        content = await file.read()
        if len(content) == 0:
            raise HTTPException(status_code=400, detail="File is empty")
        
        # Giới hạn kích thước file (10MB)
        MAX_FILE_SIZE = 10 * 1024 * 1024
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=400,
                detail=f"File size ({len(content) / 1024 / 1024:.2f}MB) exceeds maximum allowed size of 10MB"
            )
        
        # Decode text (thử UTF-8 trước, fallback sang các encoding khác)
        try:
            text_content = content.decode('utf-8').strip()
        except UnicodeDecodeError:
            try:
                text_content = content.decode('latin-1').strip()
            except UnicodeDecodeError:
                raise HTTPException(
                    status_code=400,
                    detail="File encoding not supported. Please use UTF-8 or Latin-1 encoding."
                )
        
        if not text_content or len(text_content) == 0:
            raise HTTPException(status_code=400, detail="Text content is empty")
        
        # Kiểm tra độ dài text (giới hạn hợp lý)
        MAX_TEXT_LENGTH = 1_000_000  # 1M characters
        if len(text_content) > MAX_TEXT_LENGTH:
            raise HTTPException(
                status_code=400,
                detail=f"Text too long ({len(text_content):,} characters). Maximum allowed: {MAX_TEXT_LENGTH:,} characters"
            )
        
        logger.info(f"Summarizing text from file (length: {len(text_content):,} chars, speed={speed})")
        
        # Gọi SummaryService
        summary_service = get_summary_service()
        start_time = time.time()
        
        try:
            result = await summary_service.summarize_triple(text=text_content, speed=speed)
        except Exception as e:
            logger.error(f"Error generating summary: {e}", exc_info=True)
            if "out of memory" in str(e).lower() or "CUDA" in str(e):
                raise HTTPException(
                    status_code=500,
                    detail="GPU out of memory during summary generation. Try using speed=True or reducing text length."
                )
            raise HTTPException(
                status_code=500,
                detail=f"Summary generation failed: {str(e)}"
            )
        
        elapsed_ms = (time.time() - start_time) * 1000.0
        logger.info(f"Summary generated successfully in {elapsed_ms:.2f}ms")
        
        return SummarizeTextResponse(**result)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in summarize_text_file endpoint: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to summarize text file: {str(e)}"
        )


