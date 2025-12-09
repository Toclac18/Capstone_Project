"""
Document processing service cho Readee_AI_System.

Pipeline:
- PDF:
  + Gọi OCR_Service để lấy text_path (file .txt đã OCR 100%).
  + Đọc full_text từ text_path.
  + Trích ảnh từ PDF để moderation ảnh.
- DOCX:
  + Trích text + ảnh trực tiếp bằng python-docx.
  + Ghi text ra file tạm -> text_path.

Sau đó:
- Chia text thành nhiều đoạn nhỏ -> moderation text.
- Trả về (full_text, text_path, images) cho router dùng với moderation + summary.
"""

from __future__ import annotations

import io
import tempfile
from pathlib import Path
from typing import List, Tuple

import fitz  # PyMuPDF
from docx import Document
from PIL import Image

from src.services.ocr_client import run_ocr_on_file


class DocumentService:
    def __init__(self) -> None:
        self.temp_dir = Path(tempfile.gettempdir())

    # --------------------- PDF helpers ---------------------

    def _extract_images_from_pdf(self, pdf_path: str) -> List[Image.Image]:
        images: List[Image.Image] = []
        doc = fitz.open(pdf_path)
        try:
            for page_index in range(len(doc)):
                page = doc.load_page(page_index)
                for img in page.get_images():
                    xref = img[0]
                    base_image = doc.extract_image(xref)
                    image_bytes = base_image["image"]
                    img_obj = Image.open(io.BytesIO(image_bytes))
                    
                    # Convert sang RGB nếu cần (giảm memory cho RGBA)
                    if img_obj.mode != "RGB":
                        img_obj = img_obj.convert("RGB")
                    
                    # Resize nếu quá lớn (giảm RAM usage)
                    max_size = (1920, 1920)  # Max 1920x1920
                    if img_obj.size[0] > max_size[0] or img_obj.size[1] > max_size[1]:
                        img_obj.thumbnail(max_size, Image.Resampling.LANCZOS)
                    
                    images.append(img_obj)
                    
                    # Clear image_bytes ngay sau khi tạo Image object
                    del image_bytes, base_image
                
                # Clear page object sau mỗi page
                del page
        finally:
            doc.close()
            del doc
        return images

    # --------------------- DOCX helpers ---------------------

    def _extract_text_and_images_from_docx(
        self, docx_path: str
    ) -> Tuple[str, List[Image.Image]]:
        doc = Document(docx_path)

        texts: List[str] = []
        for p in doc.paragraphs:
            if p.text.strip():
                texts.append(p.text.strip())

        for table in doc.tables:
            for row in table.rows:
                for cell in row.cells:
                    if cell.text.strip():
                        texts.append(cell.text.strip())

        images: List[Image.Image] = []
        for rel in doc.part.rels.values():
            if "image" in rel.reltype:
                img_data = rel.target_part.blob
                img_obj = Image.open(io.BytesIO(img_data))
                
                # Convert sang RGB nếu cần (giảm memory cho RGBA)
                if img_obj.mode != "RGB":
                    img_obj = img_obj.convert("RGB")
                
                # Resize nếu quá lớn (giảm RAM usage)
                max_size = (1920, 1920)  # Max 1920x1920
                if img_obj.size[0] > max_size[0] or img_obj.size[1] > max_size[1]:
                    img_obj.thumbnail(max_size, Image.Resampling.LANCZOS)
                
                images.append(img_obj)
                
                # Clear img_data ngay sau khi tạo Image object
                del img_data

        full_text = "\n".join(texts)
        # Clear texts list sau khi join
        del texts
        return full_text, images

    # --------------------- Public API ---------------------

    def process_pdf(self, pdf_path: str) -> Tuple[str, str, List[Image.Image]]:
        """
        Xử lý PDF:
        - Gọi OCR_Service -> text_path (file txt).
        - Đọc full_text từ text_path.
        - Trích ảnh từ PDF.
        """
        ocr_result = run_ocr_on_file(pdf_path)
        text_path = ocr_result["text_path"]
        full_text = Path(text_path).read_text(encoding="utf-8")

        images = self._extract_images_from_pdf(pdf_path)
        return full_text, text_path, images

    def process_docx(self, docx_path: str) -> Tuple[str, str, List[Image.Image]]:
        """
        Xử lý DOCX:
        - Trích text + ảnh bằng python-docx.
        - Ghi text ra file txt tạm -> text_path.
        """
        full_text, images = self._extract_text_and_images_from_docx(docx_path)

        with tempfile.NamedTemporaryFile(delete=False, suffix=".txt") as tf:
            tf.write(full_text.encode("utf-8"))
            text_path = tf.name

        return full_text, text_path, images


