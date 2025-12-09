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


app = FastAPI(title="OCR Service")

# Cấu hình POPPLER (giống main.py demo của bạn)
POPPLER_PATH = r"C:\poppler-25.11.0\Library\bin"

# Thư mục lưu file txt kết quả OCR
BASE_DIR = Path(__file__).resolve().parents[1]
OUTPUT_TEXT_DIR = BASE_DIR / "ocr_outputs"
OUTPUT_TEXT_DIR.mkdir(exist_ok=True)

# Khởi tạo OCR 1 lần (để Paddle tự chọn GPU/CPU theo env)
ocr = PaddleOCR(lang="en")


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


@app.get("/health")
def health():
    return {"status": "ok"}


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
            pages = convert_from_path(path, dpi=200, poppler_path=POPPLER_PATH)
            
            # Xử lý từng page và clear ngay sau khi OCR xong (tiết kiệm RAM)
            for i, page in enumerate(pages):
                img_path = os.path.join(temp_dir, f"page_{i + 1}.png")
                page.save(img_path, "PNG")
                
                # OCR page này
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
        # Không phải PDF (ảnh) → OCR trực tiếp
        try:
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


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app_ocr:app", host="0.0.0.0", port=9000, reload=True)


