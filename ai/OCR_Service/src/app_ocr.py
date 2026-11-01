"""
OCR_Service — OCR một trang PDF theo yêu cầu của Readee_AI_System.

Chỉ còn một endpoint làm việc: `/ocr-page`. Hai endpoint cũ `/ocr-file` và
`/ocr-file-parallel` đã bỏ — `DocumentService` tự quyết định trang nào thiếu
text trực tiếp và chỉ gọi OCR cho những trang đó.

Service này nhận ĐƯỜNG DẪN FILE, không nhận nội dung file, nên nó phải tự
giới hạn đọc trong thư mục được phép (xem `_resolve_pdf_path`) và chỉ lắng
nghe trên localhost.
"""
import asyncio
import gc
import logging
import os
import tempfile
import threading
from concurrent.futures import ThreadPoolExecutor
from contextlib import asynccontextmanager
from pathlib import Path

import torch
from fastapi import FastAPI, HTTPException, Query
from paddleocr import PaddleOCR
from pdf2image import convert_from_path
from pydantic import BaseModel

logger = logging.getLogger(__name__)

# Đường dẫn poppler. Để trống trên Linux/macOS (poppler nằm trong PATH);
# trên Windows trỏ tới ...\poppler-xx\Library\bin.
# Trước đây hard-code r"C:\poppler-25.11.0\Library\bin": pdf2image prepend
# đường dẫn này vào lệnh, nên trên Linux/macOS mọi lần convert đều lỗi.
POPPLER_PATH = os.getenv("POPPLER_PATH") or None

# Thư mục được phép đọc file đầu vào. Readee_AI_System ghi PDF tạm qua
# `tempfile.NamedTemporaryFile` nên tempdir là đủ cho đường chạy thật; thêm
# thư mục khác qua OCR_INPUT_DIRS (phân cách bằng os.pathsep).
ALLOWED_INPUT_DIRS = [Path(tempfile.gettempdir()).resolve()] + [
    Path(p).resolve()
    for p in os.getenv("OCR_INPUT_DIRS", "").split(os.pathsep)
    if p.strip()
]

# DPI 150 thay vì 200: nhanh hơn ~30%, vẫn đủ chất lượng cho OCR.
RENDER_DPI = int(os.getenv("OCR_DPI", "150"))

# Khởi tạo OCR - PaddleOCR tự động dùng GPU nếu có
ocr = PaddleOCR(lang="en")

# Thread pool cho phần convert PDF -> PNG (phần này mới chạy song song thật).
executor = ThreadPoolExecutor(max_workers=int(os.getenv("OCR_WORKERS", "4")))

# PaddleOCR không thread-safe: lock đảm bảo chỉ một thread gọi OCR tại một
# thời điểm. Nghĩa là bước nhận dạng vẫn tuần tự — chỉ việc render trang
# chạy song song.
ocr_lock = threading.Lock()


class OcrPageResponse(BaseModel):
    page_number: int
    text: str


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Startup/shutdown. Dùng lifespan thay `@app.on_event` (đã deprecated trong
    FastAPI, và in DeprecationWarning ở mỗi lần chạy test).
    Shutdown: tắt thread pool, nếu không thread render trang còn treo lại.
    """
    logger.info("=" * 60)
    logger.info("OCR Service Starting...")
    if torch.cuda.is_available():
        logger.info(f"✓ GPU Available: {torch.cuda.get_device_name(0)}")
        logger.info(
            f"✓ GPU Memory: "
            f"{torch.cuda.get_device_properties(0).total_memory / 1024**3:.2f} GB"
        )
        logger.info("✓ PaddleOCR will automatically use GPU if available")
    else:
        logger.warning("⚠️  GPU NOT AVAILABLE - PaddleOCR will use CPU")
    logger.info(f"Poppler path: {POPPLER_PATH or '(dùng PATH)'}")
    logger.info(f"Thư mục đầu vào được phép: {[str(d) for d in ALLOWED_INPUT_DIRS]}")
    logger.info("=" * 60)

    try:
        yield
    finally:
        logger.info("Shutting down OCR thread pool...")
        executor.shutdown(wait=True)


app = FastAPI(title="OCR Service", lifespan=lifespan)


def _resolve_pdf_path(
    path: str, allowed_dirs: list[Path] | None = None
) -> str:
    """
    Kiểm `path` rồi trả về đường dẫn tuyệt đối đã resolve.

    Endpoint nhận đường dẫn chứ không nhận file, nên không kiểm thì bất cứ ai
    gọi được service đều OCR được file bất kỳ trên máy và đọc lại nội dung qua
    response. `Path.resolve()` khử cả `..` và symlink trước khi so thư mục.

    `allowed_dirs` chỉ để test truyền thư mục tạm riêng; chạy thật thì None.
    """
    allowed_dirs = ALLOWED_INPUT_DIRS if allowed_dirs is None else allowed_dirs
    resolved = Path(path).resolve()

    if resolved.suffix.lower() != ".pdf":
        raise HTTPException(status_code=400, detail="Chỉ hỗ trợ PDF")

    if not any(
        resolved == allowed or allowed in resolved.parents
        for allowed in allowed_dirs
    ):
        logger.warning(f"Từ chối đường dẫn ngoài thư mục được phép: {resolved}")
        raise HTTPException(
            status_code=400, detail="Đường dẫn ngoài thư mục được phép"
        )

    if not resolved.is_file():
        raise HTTPException(status_code=400, detail="File không tồn tại")

    return str(resolved)


def extract_texts(result) -> list[str]:
    """Lấy danh sách text từ output của PaddleOCR (2 định dạng khác nhau)."""
    # Case 1: Classic OCR list output
    if isinstance(result, list) and result and isinstance(result[0], list):
        return [
            line[1][0]
            for line in result
            if isinstance(line, list) and len(line) == 2
        ]

    # Case 2: PP-OCRv5 structured output
    if isinstance(result, list) and result and isinstance(result[0], dict):
        return result[0].get("rec_texts", [])

    return []


async def ocr_single_page_internal(path: str, page_number: int) -> str:
    """
    OCR một trang PDF, trả text của trang đó.
    """
    loop = asyncio.get_running_loop()

    pages = await loop.run_in_executor(
        executor,
        lambda: convert_from_path(
            path,
            dpi=RENDER_DPI,
            poppler_path=POPPLER_PATH,
            first_page=page_number,
            last_page=page_number,
        ),
    )

    if not pages:
        raise ValueError(f"Trang {page_number} không tồn tại")

    # Dùng TemporaryDirectory: tự dọn cả thư mục kể cả khi OCR raise, thay cho
    # cặp os.remove + os.rmdir trong finally.
    with tempfile.TemporaryDirectory(prefix="ocr_page_") as temp_dir:
        img_path = os.path.join(temp_dir, f"page_{page_number}.png")
        pages[0].save(img_path, "PNG")
        del pages

        def ocr_with_lock() -> list[str]:
            with ocr_lock:
                return extract_texts(ocr.ocr(img_path))

        page_texts = await loop.run_in_executor(executor, ocr_with_lock)

    text = "\n".join(page_texts)

    if torch.cuda.is_available():
        torch.cuda.empty_cache()
    gc.collect(0)  # Chỉ collect generation 0 (nhanh hơn)

    return text


@app.get("/health")
def health():
    """Health check endpoint với thông tin GPU."""
    if not torch.cuda.is_available():
        gpu_info = {
            "cuda_available": False,
            "message": "CUDA not available - OCR will use CPU (slow)",
        }
    else:
        gpu_info = {
            "cuda_available": True,
            "gpu_count": torch.cuda.device_count(),
            "gpus": [
                {
                    "index": i,
                    "name": torch.cuda.get_device_name(i),
                    "total_memory_gb": round(
                        torch.cuda.get_device_properties(i).total_memory / 1024**3, 2
                    ),
                    "allocated_memory_gb": round(
                        torch.cuda.memory_allocated(i) / 1024**3, 2
                    ),
                    "cached_memory_gb": round(
                        torch.cuda.memory_reserved(i) / 1024**3, 2
                    ),
                }
                for i in range(torch.cuda.device_count())
            ],
        }

    return {
        "status": "ok",
        "gpu": gpu_info,
        "paddleocr_configured": True,
    }


@app.get("/ocr-page", response_model=OcrPageResponse)
async def ocr_page(
    path: str = Query(..., description="Đường dẫn tuyệt đối tới file PDF"),
    page_number: int = Query(..., ge=1, description="Số trang (1-indexed)"),
):
    """
    OCR một trang cụ thể của PDF.
    Readee_AI_System gọi song song nhiều trang qua endpoint này.
    """
    pdf_path = _resolve_pdf_path(path)
    try:
        text = await ocr_single_page_internal(pdf_path, page_number)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    return OcrPageResponse(page_number=page_number, text=text)


if __name__ == "__main__":
    import uvicorn

    # 127.0.0.1, không 0.0.0.0: endpoint nhận đường dẫn file nên không được
    # mở ra ngoài máy. Readee_AI_System gọi qua http://127.0.0.1:9000.
    uvicorn.run(
        "app_ocr:app",
        host=os.getenv("OCR_HOST", "127.0.0.1"),
        port=int(os.getenv("OCR_PORT", "9000")),
        reload=True,
    )
