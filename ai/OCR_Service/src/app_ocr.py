from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel
from paddleocr import PaddleOCR
from pdf2image import convert_from_path
from pathlib import Path
import os
import tempfile
import uuid
import gc
import torch
from concurrent.futures import ThreadPoolExecutor
import asyncio
from typing import List
import logging

logger = logging.getLogger(__name__)


app = FastAPI(title="OCR Service")

# Cấu hình POPPLER (giống main.py demo của bạn)
POPPLER_PATH = r"C:\poppler-25.11.0\Library\bin"

# Thư mục lưu file txt kết quả OCR
BASE_DIR = Path(__file__).resolve().parents[1]
OUTPUT_TEXT_DIR = BASE_DIR / "ocr_outputs"
OUTPUT_TEXT_DIR.mkdir(exist_ok=True)

# Khởi tạo OCR - PaddleOCR tự động dùng GPU nếu có
ocr = PaddleOCR(lang="en")

# Thread pool cho parallel OCR processing
# Lưu ý: PaddleOCR không thread-safe, cần lock để đảm bảo chỉ một thread gọi OCR tại một thời điểm
executor = ThreadPoolExecutor(max_workers=4)  # Có thể điều chỉnh số worker

# Lock để đảm bảo PaddleOCR chỉ được gọi tuần tự (thread-safe)
import threading
ocr_lock = threading.Lock()


@app.on_event("startup")
async def startup_event():
    """Log GPU info khi service start."""
    logger.info("=" * 60)
    logger.info("OCR Service Starting...")
    if torch.cuda.is_available():
        logger.info(f"✓ GPU Available: {torch.cuda.get_device_name(0)}")
        logger.info(f"✓ GPU Memory: {torch.cuda.get_device_properties(0).total_memory / 1024**3:.2f} GB")
        logger.info("✓ PaddleOCR will automatically use GPU if available")
    else:
        logger.warning("⚠️  GPU NOT AVAILABLE - PaddleOCR will use CPU")
    logger.info("=" * 60)


class OcrResponse(BaseModel):
    text_path: str  # đường dẫn tuyệt đối tới file txt đã lưu


def extract_texts(result):
    texts = []

    # Case 1: Classic OCR list output
    if isinstance(result, list) and len(result) > 0 and isinstance(result[0], list):
        for line in result:
            if isinstance(line, list) and len(line) == 2:
                texts.append(line[1][0])
        return texts

    # Case 2: PP-OCRv5 structured output
    if isinstance(result, list) and len(result) > 0 and isinstance(result[0], dict):
        dic = result[0]
        if "rec_texts" in dic:
            return dic["rec_texts"]

    return texts


async def ocr_single_page_internal(path: str, page_number: int) -> str:
    """
    Internal function để OCR một trang PDF.
    Trả về text của trang đó.
    """
    # Convert PDF page cụ thể
    loop = asyncio.get_event_loop()
    pages = await loop.run_in_executor(
        executor,
        lambda: convert_from_path(
            path, 
            dpi=150,  # Giảm DPI từ 200 xuống 150 để tăng tốc ~30% (vẫn đủ chất lượng)
            poppler_path=POPPLER_PATH,
            first_page=page_number,
            last_page=page_number
        )
    )
    
    if not pages or len(pages) == 0:
        raise ValueError(f"Trang {page_number} không tồn tại")
    
    page = pages[0]
    temp_dir = tempfile.mkdtemp(prefix="ocr_page_")
    img_path = os.path.join(temp_dir, f"page_{page_number}.png")
    
    try:
        page.save(img_path, "PNG")
        
        # OCR page này với lock để đảm bảo thread-safe
        # PaddleOCR không thread-safe nên cần lock
        def ocr_with_lock(img_path):
            with ocr_lock:
                return ocr.ocr(img_path)
        
        result = await loop.run_in_executor(executor, ocr_with_lock, img_path)
        page_texts = extract_texts(result)
        text = "\n".join(page_texts)
        
        # Clear memory và GPU cache
        del result, page_texts, page, pages
        if torch.cuda.is_available():
            # Clear GPU cache để tận dụng tối đa GPU memory
            torch.cuda.empty_cache()
            # Không cần synchronize ở đây vì đã await xong
        gc.collect(0)  # Chỉ collect generation 0 (nhanh hơn)
        
        return text
    finally:
        # Cleanup
        try:
            if os.path.exists(img_path):
                os.remove(img_path)
            os.rmdir(temp_dir)
        except Exception:
            pass


@app.get("/health")
def health():
    """Health check endpoint với thông tin GPU."""
    gpu_info = {}
    if torch.cuda.is_available():
        gpu_info = {
            "cuda_available": True,
            "gpu_count": torch.cuda.device_count(),
            "gpus": []
        }
        for i in range(torch.cuda.device_count()):
            props = torch.cuda.get_device_properties(i)
            gpu_info["gpus"].append({
                "index": i,
                "name": torch.cuda.get_device_name(i),
                "total_memory_gb": round(props.total_memory / 1024**3, 2),
                "allocated_memory_gb": round(torch.cuda.memory_allocated(i) / 1024**3, 2),
                "cached_memory_gb": round(torch.cuda.memory_reserved(i) / 1024**3, 2),
            })
    else:
        gpu_info = {
            "cuda_available": False,
            "message": "CUDA not available - OCR will use CPU (slow)"
        }
    
    # Kiểm tra PaddleOCR có dùng GPU không
    try:
        # PaddleOCR có thể expose device info qua internal attributes
        ocr_using_gpu = hasattr(ocr, 'det_model') and hasattr(ocr.det_model, 'device')
        if ocr_using_gpu:
            try:
                device = str(ocr.det_model.device) if hasattr(ocr.det_model, 'device') else "unknown"
                gpu_info["paddleocr_device"] = device
            except:
                pass
    except:
        pass
    
    return {
        "status": "ok",
        "gpu": gpu_info,
        "paddleocr_configured": True
    }


@app.get("/ocr-file", response_model=OcrResponse)
def ocr_file(
    path: str = Query(..., description="Đường dẫn tuyệt đối tới file PDF hoặc ảnh đã lưu"),
):
    if not os.path.exists(path):
        raise HTTPException(status_code=400, detail="File không tồn tại")

    texts: list[str] = []
    ext = os.path.splitext(path)[1].lower()

    # Nếu là PDF → convert từng page rồi OCR (tối ưu memory)
    if ext == ".pdf":
        temp_dir = tempfile.mkdtemp(prefix="ocr_pages_")
        pages = None

        try:
            # Convert PDF thành pages (có thể tốn RAM nếu PDF lớn)
            pages = convert_from_path(path, dpi=150, poppler_path=POPPLER_PATH)  # DPI 150 - nhanh hơn
            
            # Xử lý từng page và clear ngay sau khi OCR xong (tiết kiệm RAM)
            for i, page in enumerate(pages):
                img_path = os.path.join(temp_dir, f"page_{i + 1}.png")
                page.save(img_path, "PNG")
                
                # OCR page này (với lock để thread-safe)
                with ocr_lock:
                    result = ocr.ocr(img_path)
                page_texts = extract_texts(result)
                texts.extend(page_texts)
                
                # Clear ngay sau mỗi page để tiết kiệm memory
                del result, page_texts
                # Xóa file ảnh tạm ngay sau khi OCR xong
                try:
                    os.remove(img_path)
                except Exception:
                    pass
                
                # Clear GPU cache sau mỗi page (nếu PaddleOCR dùng GPU)
                if torch.cuda.is_available():
                    torch.cuda.empty_cache()
                
                # Clear page object
                del page
                gc.collect()
            
            # Clear pages list
            if pages:
                del pages
                pages = None
                
        except Exception as e:
            # Clear GPU cache nếu có lỗi
            if torch.cuda.is_available():
                try:
                    torch.cuda.empty_cache()
                except Exception:
                    pass
            raise e
        finally:
            # Xoá thư mục tạm (nếu còn file nào)
            try:
                for f in os.listdir(temp_dir):
                    fp = os.path.join(temp_dir, f)
                    if os.path.isfile(fp):
                        os.remove(fp)
                os.rmdir(temp_dir)
            except Exception:
                pass
            # Clear GPU cache cuối cùng
            if torch.cuda.is_available():
                try:
                    torch.cuda.empty_cache()
                except Exception:
                    pass
            # Force garbage collection
            gc.collect()
    else:
        # Không phải PDF (ảnh) → OCR trực tiếp (với lock để thread-safe)
        try:
            with ocr_lock:
                result = ocr.ocr(path)
            texts = extract_texts(result)
            # Clear result ngay sau khi extract
            del result
            # Clear GPU cache sau OCR
            if torch.cuda.is_available():
                torch.cuda.empty_cache()
        except Exception as e:
            # Clear GPU cache nếu có lỗi
            if torch.cuda.is_available():
                try:
                    torch.cuda.empty_cache()
                except Exception:
                    pass
            raise e

    joined = "\n".join(texts)
    
    # Clear texts list sau khi join (tiết kiệm RAM)
    del texts
    gc.collect()

    # Lưu full text ra file txt, trả về path
    out_name = f"ocr_{uuid.uuid4().hex}.txt"
    out_path = OUTPUT_TEXT_DIR / out_name
    out_path.write_text(joined, encoding="utf-8")
    
    # Clear joined string sau khi write
    del joined
    # Clear GPU cache cuối cùng
    if torch.cuda.is_available():
        try:
            torch.cuda.empty_cache()
        except Exception:
            pass
    gc.collect()

    return OcrResponse(text_path=str(out_path))


class OcrPageResponse(BaseModel):
    page_number: int
    text: str


@app.get("/ocr-page", response_model=OcrPageResponse)
async def ocr_page(
    path: str = Query(..., description="Đường dẫn tuyệt đối tới file PDF"),
    page_number: int = Query(..., description="Số trang (1-indexed)"),
):
    """
    OCR một trang cụ thể của PDF.
    Dùng cho parallel processing - OCR nhiều trang cùng lúc.
    """
    if not os.path.exists(path):
        raise HTTPException(status_code=400, detail="File không tồn tại")
    
    ext = os.path.splitext(path)[1].lower()
    if ext != ".pdf":
        raise HTTPException(status_code=400, detail="Chỉ hỗ trợ PDF")
    
    try:
        text = await ocr_single_page_internal(path, page_number)
        return OcrPageResponse(page_number=page_number, text=text)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/ocr-file-parallel", response_model=OcrResponse)
async def ocr_file_parallel(
    path: str = Query(..., description="Đường dẫn tuyệt đối tới file PDF"),
    max_workers: int = Query(4, description="Số worker song song (mặc định 4)"),
):
    """
    OCR PDF song song nhiều trang cùng lúc, sau đó ghép lại theo thứ tự.
    Nhanh hơn /ocr-file khi PDF có nhiều trang.
    """
    if not os.path.exists(path):
        raise HTTPException(status_code=400, detail="File không tồn tại")
    
    ext = os.path.splitext(path)[1].lower()
    if ext != ".pdf":
        raise HTTPException(status_code=400, detail="Chỉ hỗ trợ PDF")
    
    # Đếm số trang bằng pdfinfo từ poppler (nhanh nhất, không cần convert)
    loop = asyncio.get_event_loop()
    import subprocess
    
    def count_pages():
        try:
            # Thử dùng pdfinfo từ poppler (nhanh nhất)
            pdfinfo_path = os.path.join(POPPLER_PATH, "pdfinfo.exe")
            if os.path.exists(pdfinfo_path):
                result = subprocess.run(
                    [pdfinfo_path, path],
                    capture_output=True,
                    text=True,
                    timeout=10
                )
                if result.returncode == 0:
                    # Parse output để tìm "Pages: X"
                    for line in result.stdout.split('\n'):
                        if line.startswith('Pages:'):
                            return int(line.split(':')[1].strip())
        except Exception:
            pass
        
        # Fallback: convert PDF với DPI thấp để đếm (chậm hơn nhưng đảm bảo hoạt động)
        try:
            # Convert toàn bộ với DPI thấp để đếm nhanh
            all_pages = convert_from_path(
                path,
                dpi=50,  # DPI thấp để đếm nhanh (không cần chất lượng cao)
                poppler_path=POPPLER_PATH
            )
            count = len(all_pages)
            del all_pages
            gc.collect()
            return count
        except Exception:
            # Nếu vẫn lỗi, thử convert từng trang
            page_num = 1
            while page_num <= 1000:  # Giới hạn tối đa 1000 trang
                try:
                    pages = convert_from_path(
                        path,
                        dpi=50,
                        poppler_path=POPPLER_PATH,
                        first_page=page_num,
                        last_page=page_num
                    )
                    if not pages:
                        break
                    page_num += 1
                    del pages
                except:
                    break
            return page_num - 1
    
    total_pages = await loop.run_in_executor(executor, count_pages)
    
    # OCR tất cả các trang song song với semaphore để giới hạn số worker
    semaphore = asyncio.Semaphore(max_workers)
    
    async def ocr_page_with_semaphore(page_num):
        async with semaphore:
            return await ocr_single_page_internal(path, page_num)
    
    # Tạo tasks cho tất cả các trang
    tasks = [
        ocr_page_with_semaphore(page_num) 
        for page_num in range(1, total_pages + 1)
    ]
    
    # Chạy tất cả và đợi kết quả (giữ nguyên thứ tự)
    page_texts = await asyncio.gather(*tasks)
    
    # Ghép lại theo thứ tự (đã đúng thứ tự từ gather)
    joined = "\n".join(page_texts)
    
    # Clear
    del page_texts, tasks
    if torch.cuda.is_available():
        torch.cuda.empty_cache()
    gc.collect()
    
    # Lưu full text ra file txt
    out_name = f"ocr_{uuid.uuid4().hex}.txt"
    out_path = OUTPUT_TEXT_DIR / out_name
    out_path.write_text(joined, encoding="utf-8")
    
    del joined
    gc.collect()
    
    return OcrResponse(text_path=str(out_path))


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app_ocr:app", host="0.0.0.0", port=9000, reload=True)


