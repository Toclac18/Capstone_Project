"""
Pipeline xử lý một document, do queue worker gọi.

Thứ tự: trích text+ảnh (OCR/DOCX) -> kiểm duyệt ảnh và text song song ->
nếu sạch thì sinh 3 mức summary. Trả dict đúng hình dạng `DocumentResponse`.

Tách khỏi `api/document_router.py` vì đây là nghiệp vụ, không phải tầng HTTP:
router chỉ nhận file, đẩy vào queue và trả job_id.
"""
import asyncio
import gc
import logging
import os
import time
from pathlib import Path
from typing import Any, Dict, List, Tuple

from src.api.dependencies import (
    get_doc_service,
    get_image_service,
    get_summary_service,
    get_text_service,
)
from src.config import IMAGE_THRESHOLD, TEXT_THRESHOLD
from src.services.text_chunker import split_text_into_chunks

logger = logging.getLogger(__name__)


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
