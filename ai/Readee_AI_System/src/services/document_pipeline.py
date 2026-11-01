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
from typing import Any, Dict, List, Optional, Tuple

from src.api.dependencies import (
    get_doc_service,
    get_image_service,
    get_summary_service,
    get_text_service,
)
from src.config import IMAGE_THRESHOLD, TEXT_THRESHOLD
from src.services.text_chunker import split_text_into_chunks

logger = logging.getLogger(__name__)

ALLOWED_EXTENSIONS = (".pdf", ".docx")
TEXT_CHUNK_MAX_TOKENS = 100


class ModerationFailed(RuntimeError):
    """
    Một trong hai model kiểm duyệt lỗi.

    Phải là lỗi, không được bỏ qua: không kiểm duyệt được thì không biết
    document có vi phạm hay không, và "không biết" khác "sạch".
    """


def _build_violation(
    kind: str,
    index: int,
    result: Dict[str, Any],
    page: Optional[int],
    snippet: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Dựng một bản ghi vi phạm theo hợp đồng với backend
    (`be/.../dto/ai/AiModerationResponse.Violation`).

    `confidence` được kẹp về [0, 1]: model trả xác suất nên lẽ ra đã nằm
    trong khoảng này, kẹp chỉ để một lỗi ở tầng model không ghi số vô nghĩa
    vào DB.
    """
    confidence = max(0.0, min(1.0, float(result["confidence"])))
    violation: Dict[str, Any] = {
        "type": kind,
        "index": index,
        "prediction": result["prediction"],
        "confidence": confidence,  # Tỉ lệ [0, 1]
        "confidence_percent": round(confidence * 100.0, 2),  # Phần trăm [0, 100]
    }
    if snippet is not None:
        violation["snippet"] = snippet
    if page is not None:
        violation["page"] = page
    return violation


def _first_violation(
    kind: str,
    results: List[Dict[str, Any]],
    threshold: float,
    pages: Optional[List[Optional[int]]] = None,
    snippets: Optional[List[str]] = None,
) -> Optional[Dict[str, Any]]:
    """Vi phạm ĐẦU TIÊN vượt ngưỡng, hoặc None. Dừng ở cái đầu tiên là chủ ý:
    document bị chặn rồi thì không cần liệt kê hết."""
    for idx, result in enumerate(results):
        if not (result["is_toxic"] and result["confidence"] >= threshold):
            continue
        page = pages[idx] if pages and idx < len(pages) else None
        snippet = snippets[idx] if snippets and idx < len(snippets) else None
        return _build_violation(kind, idx, result, page, snippet)
    return None


async def _moderate(
    images: Optional[List[Any]],
    chunks: Optional[List[str]],
) -> Tuple[Optional[List[Dict[str, Any]]], Optional[List[Dict[str, Any]]], float, float]:
    """
    Chạy kiểm duyệt ảnh và text song song.

    Trả (img_results, txt_results, img_ms, text_ms). Mỗi nhánh tự đo thời
    gian của mình — trước đây cả hai cùng nhận wall-time của `gather`, nên
    `timings` báo trùng và tổng lớn hơn thực tế.

    Raise `ModerationFailed` nếu nhánh nào lỗi.
    """
    image_service = get_image_service()
    text_service = get_text_service()

    async def run(name: str, fn, payload) -> Tuple[str, List[Dict[str, Any]], float]:
        start = time.time()
        results = await asyncio.to_thread(fn, payload)
        return name, results, (time.time() - start) * 1000.0

    tasks = []
    if images:
        tasks.append(run("image", image_service.predict_batch, images))
    if chunks:
        tasks.append(run("text", text_service.predict_batch, chunks))

    if not tasks:
        return None, None, 0.0, 0.0

    settled = await asyncio.gather(*tasks, return_exceptions=True)

    failures = [r for r in settled if isinstance(r, BaseException)]
    if failures:
        for error in failures:
            logger.error(f"Moderation failed: {error}", exc_info=error)
        # Không bỏ qua: trước đây lỗi ở đây chỉ được log rồi `continue`, nên
        # model ảnh crash là document đi tiếp như thể không có ảnh vi phạm.
        raise ModerationFailed(
            f"{len(failures)}/{len(tasks)} model kiểm duyệt lỗi: "
            + "; ".join(str(e) for e in failures)
        ) from failures[0]

    by_name = {name: (results, elapsed) for name, results, elapsed in settled}
    img_results, img_ms = by_name.get("image", (None, 0.0))
    txt_results, text_ms = by_name.get("text", (None, 0.0))
    return img_results, txt_results, img_ms, text_ms


async def process_document_internal(
    job_id: str,
    temp_file_path: str,
    filename: str,
) -> Dict[str, Any]:
    """
    Xử lý document, được queue worker gọi.
    Trả về kết quả dạng DocumentResponse nhưng là dict.
    """
    start_time = time.time()
    ocr_ms = img_mod_ms = text_mod_ms = summary_ms = 0.0
    text_path: str | None = None

    def timings() -> Dict[str, float]:
        return {
            "ocr_ms": ocr_ms,
            "image_moderation_ms": img_mod_ms,
            "text_moderation_ms": text_mod_ms,
            "summary_ms": summary_ms,
            "total_ms": (time.time() - start_time) * 1000.0,
        }

    try:
        logger.info(f"Processing document (job_id={job_id}): {filename}")

        file_extension = Path(filename).suffix.lower() if filename else ""
        if file_extension not in ALLOWED_EXTENSIONS:
            raise ValueError("File must be PDF or DOCX format")

        doc_service = get_doc_service()

        # ----- Extract text + images (OCR / DOCX parsing) -----
        t0 = time.time()
        if file_extension == ".pdf":
            full_text, text_path, images, image_pages, page_ranges = (
                await doc_service.process_pdf(temp_file_path, use_parallel=True)
            )
        else:
            full_text, text_path, images, image_pages, page_ranges = (
                doc_service.process_docx(temp_file_path)
            )
        ocr_ms = (time.time() - t0) * 1000.0

        # ----- Kiểm duyệt ảnh + text (song song) -----
        chunks: List[str] | None = None
        chunk_pages: List[int] | None = None
        if full_text.strip():
            chunks, chunk_pages = split_text_into_chunks(
                full_text, max_tokens=TEXT_CHUNK_MAX_TOKENS, page_ranges=page_ranges
            )

        img_results, txt_results, img_mod_ms, text_mod_ms = await _moderate(
            images, chunks
        )

        # Ảnh đã kiểm duyệt xong thì không cần giữ trong RAM nữa
        images = None
        gc.collect(0)

        # Ảnh trước text: vi phạm ảnh là đủ để chặn, không cần tìm thêm.
        violation = None
        if img_results:
            violation = _first_violation(
                "image", img_results, IMAGE_THRESHOLD, pages=image_pages
            )
        if violation is None and txt_results:
            violation = _first_violation(
                "text",
                txt_results,
                TEXT_THRESHOLD,
                pages=chunk_pages,
                snippets=chunks,
            )

        if violation is not None:
            logger.info(
                f"Document blocked (job_id={job_id}). "
                f"Violation: {violation['type']} "
                f"(confidence {violation['confidence']:.3f}). "
                f"Total time: {time.time() - start_time:.2f}s"
            )
            return {
                "status": "fail",
                "violations": [violation],
                "summaries": None,
                "timings": timings(),
            }

        # Không còn cần chunk/kết quả kiểm duyệt. Với tài liệu lớn chúng nặng
        # xấp xỉ full_text, giải phóng trước khi model summary vào GPU.
        chunks = chunk_pages = img_results = txt_results = None
        gc.collect(0)

        # ----- Summary -----
        summary_service = get_summary_service()
        t3 = time.time()
        try:
            summary_result = await summary_service.summarize_triple(
                text=full_text, speed=True
            )
        except Exception as e:
            if "out of memory" in str(e).lower() or "CUDA" in str(e):
                logger.error(
                    f"GPU out of memory during summary (job_id={job_id}). "
                    f"Consider reducing MAX_GPU_CONCURRENCY or using smaller model."
                )
            raise
        summary_ms = (time.time() - t3) * 1000.0

        logger.info(
            f"Document processed successfully (job_id={job_id}). "
            f"Total time: {time.time() - start_time:.2f}s"
        )
        return {
            "status": "pass",
            "violations": [],
            "summaries": summary_result.get("results") if summary_result else None,
            "timings": timings(),
        }
    except Exception as e:
        logger.error(
            f"Error processing document (job_id={job_id}): {e}", exc_info=True
        )
        raise
    finally:
        # Xóa file txt từ OCR/DOCX
        if text_path and os.path.exists(text_path):
            try:
                os.unlink(text_path)
                logger.info(f"Deleted OCR text file: {text_path}")
            except OSError as e:
                logger.warning(f"Failed to delete OCR text file {text_path}: {e}")
        gc.collect()
