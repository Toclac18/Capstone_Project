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
    images = None
    full_text = None
    chunks = None

    try:
        logger.info(f"Processing document: {file.filename}")

        file_extension = Path(file.filename).suffix.lower() if file.filename else ""
        if file_extension not in [".pdf", ".docx"]:
            raise HTTPException(
                status_code=400, detail="File must be PDF or DOCX format"
            )

        # Kiểm tra kích thước file (giới hạn 10MB)
        MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB in bytes
        content = await file.read()
        file_size = len(content)
        
        if file_size > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=400,
                detail=f"File size ({file_size / 1024 / 1024:.2f}MB) exceeds maximum allowed size of 10MB"
            )
        
        if file_size == 0:
            raise HTTPException(
                status_code=400,
                detail="File is empty"
            )

        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=file_extension) as temp:
            temp.write(content)
            temp_file_path = temp.name
        # Clear file content từ memory ngay sau khi write
        del content

        doc_service = get_doc_service()
        text_service = get_text_service()
        image_service = get_image_service()

        violations: List[Dict[str, Any]] = []
        image_page_numbers: List[int] | None = None
        page_ranges: Dict[int, Tuple[int, int]] | None = None
        text_path: str | None = None  # Đường dẫn file txt từ OCR/DOCX

        # ----- Extract text + images (OCR / DOCX parsing) -----
        t0 = time.time()
        if file_extension == ".pdf":
            # Sử dụng parallel OCR để tăng tốc độ
            full_text, text_path, images, image_page_numbers, page_ranges = await doc_service.process_pdf(temp_file_path, use_parallel=True)
        else:
            full_text, text_path, images, image_page_numbers, page_ranges = doc_service.process_docx(temp_file_path)
        ocr_ms = (time.time() - t0) * 1000.0

        # ----- Image và Text moderation (chạy song song để tăng tốc) -----
        img_results = None
        txt_results = None
        chunks = None
        chunk_page_numbers = None
        img_mod_ms = 0.0
        text_mod_ms = 0.0
        
        # Chuẩn bị tasks để chạy song song
        tasks = []
        task_types = []
        
        if images:
            tasks.append(asyncio.to_thread(image_service.predict_batch, images))
            task_types.append("image")
        
        if full_text.strip():
            chunks, chunk_page_numbers = split_text_into_chunks(full_text, max_tokens=100, page_ranges=page_ranges)
            tasks.append(asyncio.to_thread(text_service.predict_batch, chunks))
            task_types.append("text")
        
        # Chạy song song image và text moderation
        if tasks:
            t1 = time.time()
            results = await asyncio.gather(*tasks, return_exceptions=True)
            total_moderation_ms = (time.time() - t1) * 1000.0
            
            # Phân loại kết quả và tính timing
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
                    # Lấy page number cho ảnh này
                    page_num = image_page_numbers[idx] if image_page_numbers and idx < len(image_page_numbers) else None
                    
                    violation = {
                        "type": "image",
                        "index": idx,
                        "prediction": res["prediction"],
                        "confidence": res["confidence"],
                    }
                    # Thêm page number nếu có
                    if page_num is not None:
                        violation["page"] = page_num
                    
                    violations.append(violation)
                    # stop at first violation
                    break
            # Clear images ngay sau khi moderation xong (tiết kiệm RAM)
            del images, img_results
            images = None
            if image_page_numbers:
                del image_page_numbers
            image_page_numbers = None
        
        # Xử lý text violations (chỉ nếu không có image violation)
        if not violations and txt_results:
            for idx, res in enumerate(txt_results):
                if res["is_toxic"] and res["confidence"] >= TEXT_THRESHOLD:
                    snippet = chunks[idx][:200]
                    # Lấy page number cho chunk này
                    page_num = chunk_page_numbers[idx] if idx < len(chunk_page_numbers) else None
                    
                    violation = {
                        "type": "text",
                        "index": idx,
                        "snippet": snippet,
                        "prediction": res["prediction"],
                        "confidence": res["confidence"],
                    }
                    # Thêm page number nếu có
                    if page_num is not None:
                        violation["page"] = page_num
                    
                    violations.append(violation)
                    break
            # Clear chunks sau khi moderation xong
            del chunks, chunk_page_numbers, txt_results
            chunks = None
        
        # Clear memory (chỉ collect generation 0 - nhanh hơn)
        gc.collect(0)

        if violations:
            # Clear full_text nếu có violations (không cần summary)
            if full_text:
                del full_text
                full_text = None
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
        try:
            summary_result = await summary_service.summarize_triple(
                text=full_text, speed=True
            )
        except Exception as e:
            # Log OOM error với message rõ ràng
            if "out of memory" in str(e).lower() or "CUDA" in str(e):
                logger.error(
                    f"GPU out of memory during summary. "
                    f"Consider reducing MAX_GPU_CONCURRENCY or using smaller model."
                )
            raise
        finally:
            # Clear full_text sau khi summary xong
            if full_text:
                del full_text
                full_text = None
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
        # Cleanup tất cả
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
        # Xóa file txt từ OCR/DOCX sau khi đã xử lý xong
        if 'text_path' in locals() and text_path and os.path.exists(text_path):
            try:
                os.unlink(text_path)
                logger.info(f"Deleted OCR text file: {text_path}")
            except Exception as e:
                logger.warning(f"Failed to delete OCR text file {text_path}: {e}")
        # Xóa file PDF/DOCX tạm
        if temp_file_path and os.path.exists(temp_file_path):
            try:
                os.unlink(temp_file_path)
            except Exception:
                pass
        # Force garbage collection để giải phóng memory (full collect ở cuối)
        gc.collect()


