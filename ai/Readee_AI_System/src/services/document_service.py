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
import asyncio
from pathlib import Path
from typing import List, Tuple, Dict

import fitz  # PyMuPDF
from docx import Document
from PIL import Image

from src.services.ocr_client import run_ocr_on_file, run_ocr_on_file_parallel


class DocumentService:
    def __init__(self) -> None:
        self.temp_dir = Path(tempfile.gettempdir())

    # --------------------- PDF helpers ---------------------

    def _extract_images_from_pdf(self, pdf_path: str) -> Tuple[List[Image.Image], List[int]]:
        """
        Trích ảnh từ PDF và trả về (images, page_numbers).
        page_numbers[i] = số trang (1-indexed) của images[i].
        Tối ưu: resize và convert ngay trong quá trình extract để tiết kiệm memory.
        """
        images: List[Image.Image] = []
        page_numbers: List[int] = []
        doc = fitz.open(pdf_path)
        max_size = (1280, 1280)  # Max 1280x1280 - đủ cho moderation, nhanh hơn
        
        try:
            for page_index in range(len(doc)):
                page = doc.load_page(page_index)
                page_num = page_index + 1  # 1-indexed
                
                for img in page.get_images():
                    xref = img[0]
                    base_image = doc.extract_image(xref)
                    image_bytes = base_image["image"]
                    
                    # Mở và xử lý ảnh - load toàn bộ vào memory trước khi đóng buffer
                    img_buffer = io.BytesIO(image_bytes)
                    img_obj = Image.open(img_buffer)
                    # Load toàn bộ image vào memory để tránh lỗi khi buffer đóng
                    img_obj.load()
                    # Đóng buffer sau khi đã load xong
                    img_buffer.close()
                    
                    # Convert sang RGB nếu cần (giảm memory cho RGBA)
                    if img_obj.mode != "RGB":
                        img_obj = img_obj.convert("RGB")
                    
                    # Resize nếu quá lớn (giảm RAM usage và tăng tốc độ inference)
                    if img_obj.size[0] > max_size[0] or img_obj.size[1] > max_size[1]:
                        img_obj.thumbnail(max_size, Image.Resampling.LANCZOS)
                    
                    images.append(img_obj)
                    page_numbers.append(page_num)
                    
                    # Clear image_bytes ngay sau khi tạo Image object
                    del image_bytes, base_image
                
                # Clear page object sau mỗi page để giải phóng memory
                del page
        finally:
            doc.close()
            del doc
        return images, page_numbers
    
    def _extract_text_by_pages_from_pdf(self, pdf_path: str) -> Tuple[str, Dict[int, Tuple[int, int]]]:
        """
        Trích text từ PDF theo từng trang và trả về:
        - full_text: toàn bộ text đã nối
        - page_ranges: dict mapping page_num -> (start_char, end_char) trong full_text
        """
        doc = fitz.open(pdf_path)
        page_texts: List[str] = []
        page_ranges: Dict[int, Tuple[int, int]] = {}
        
        try:
            current_pos = 0
            for page_index in range(len(doc)):
                page = doc.load_page(page_index)
                page_num = page_index + 1  # 1-indexed
                page_text = page.get_text()
                
                start_pos = current_pos
                end_pos = current_pos + len(page_text)
                
                # Nếu không phải trang cuối, thêm newline
                if page_index < len(doc) - 1:
                    page_text += "\n"
                    end_pos += 1
                
                page_texts.append(page_text)
                page_ranges[page_num] = (start_pos, end_pos)
                current_pos = end_pos
                
                del page
        finally:
            doc.close()
            del doc
        
        full_text = "".join(page_texts)
        del page_texts
        return full_text, page_ranges

    # --------------------- DOCX helpers ---------------------

    def _extract_text_and_images_from_docx(
        self, docx_path: str
    ) -> Tuple[str, List[Image.Image], List[int], Dict[int, Tuple[int, int]]]:
        """
        Trích text và ảnh từ DOCX.
        Trả về: (full_text, images, image_page_numbers, page_ranges)
        Note: DOCX không có khái niệm "trang" rõ ràng, nên ta ước tính dựa trên số đoạn.
        """
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
        image_page_numbers: List[int] = []
        
        # Ước tính page number cho ảnh dựa trên vị trí trong document
        # Giả sử mỗi ~50 dòng text = 1 trang (ước tính)
        paragraphs_per_page = 50
        current_paragraph_count = 0
        max_size = (1280, 1280)  # Max 1280x1280 - đủ cho moderation, nhanh hơn
        
        for rel in doc.part.rels.values():
            if "image" in rel.reltype:
                img_data = rel.target_part.blob
                
                # Mở và xử lý ảnh - load toàn bộ vào memory trước khi đóng buffer
                img_buffer = io.BytesIO(img_data)
                img_obj = Image.open(img_buffer)
                # Load toàn bộ image vào memory để tránh lỗi khi buffer đóng
                img_obj.load()
                # Đóng buffer sau khi đã load xong
                img_buffer.close()
                
                # Convert sang RGB nếu cần (giảm memory cho RGBA)
                if img_obj.mode != "RGB":
                    img_obj = img_obj.convert("RGB")
                
                # Resize nếu quá lớn (giảm RAM usage và tăng tốc độ inference)
                if img_obj.size[0] > max_size[0] or img_obj.size[1] > max_size[1]:
                    img_obj.thumbnail(max_size, Image.Resampling.LANCZOS)
                
                images.append(img_obj)
                # Ước tính page number (1-indexed)
                estimated_page = max(1, (current_paragraph_count // paragraphs_per_page) + 1)
                image_page_numbers.append(estimated_page)
                
                # Clear img_data ngay sau khi tạo Image object
                del img_data
        
        # Tạo page_ranges cho text (ước tính)
        full_text = "\n".join(texts)
        page_ranges: Dict[int, Tuple[int, int]] = {}
        if texts:
            chars_per_page = len(full_text) // max(1, (len(texts) // paragraphs_per_page) + 1)
            current_pos = 0
            page_num = 1
            
            for i, text in enumerate(texts):
                if i > 0 and i % paragraphs_per_page == 0:
                    # Bắt đầu trang mới
                    page_ranges[page_num] = (current_pos, current_pos)
                    page_num += 1
                    current_pos = len("\n".join(texts[:i]))
            
            # Trang cuối
            if page_num not in page_ranges:
                page_ranges[page_num] = (current_pos, len(full_text))
        
        # Clear texts list sau khi join
        del texts
        return full_text, images, image_page_numbers, page_ranges

    # --------------------- Public API ---------------------

    async def process_pdf(self, pdf_path: str, use_parallel: bool = True) -> Tuple[str, str, List[Image.Image], List[int], Dict[int, Tuple[int, int]]]:
        """
        Xử lý PDF:
        - Gọi OCR_Service với parallel processing (mặc định) -> text_path (file txt).
        - Đọc full_text từ text_path.
        - Trích ảnh từ PDF với page numbers.
        - Trả về page_ranges để map text chunks về pages.
        
        Args:
            pdf_path: Đường dẫn file PDF
            use_parallel: Nếu True, dùng parallel OCR (nhanh hơn). Nếu False, dùng tuần tự.
        
        Returns: (full_text, text_path, images, image_page_numbers, page_ranges)
        """
        # Tối ưu: Chạy song song OCR và image extraction để tăng tốc độ
        if use_parallel:
            ocr_task = run_ocr_on_file_parallel(pdf_path, max_workers=4)
        else:
            ocr_task = asyncio.to_thread(run_ocr_on_file, pdf_path)
        
        # Chạy song song: OCR và image extraction
        ocr_result, (images, image_page_numbers), (_, page_ranges) = await asyncio.gather(
            ocr_task,
            asyncio.to_thread(self._extract_images_from_pdf, pdf_path),
            asyncio.to_thread(self._extract_text_by_pages_from_pdf, pdf_path),
        )
        
        text_path = ocr_result["text_path"]
        full_text = Path(text_path).read_text(encoding="utf-8")
        
        return full_text, text_path, images, image_page_numbers, page_ranges

    def process_docx(self, docx_path: str) -> Tuple[str, str, List[Image.Image], List[int], Dict[int, Tuple[int, int]]]:
        """
        Xử lý DOCX:
        - Trích text + ảnh bằng python-docx.
        - Ghi text ra file txt tạm -> text_path.
        - Trả về page numbers (ước tính) cho images và page_ranges cho text.
        
        Returns: (full_text, text_path, images, image_page_numbers, page_ranges)
        """
        full_text, images, image_page_numbers, page_ranges = self._extract_text_and_images_from_docx(docx_path)

        with tempfile.NamedTemporaryFile(delete=False, suffix=".txt") as tf:
            tf.write(full_text.encode("utf-8"))
            text_path = tf.name

        return full_text, text_path, images, image_page_numbers, page_ranges


