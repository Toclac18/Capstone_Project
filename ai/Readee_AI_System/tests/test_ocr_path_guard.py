"""
Chặn đường dẫn ở OCR_Service.

`/ocr-page` nhận ĐƯỜNG DẪN FILE chứ không nhận nội dung file, nên không kiểm
thì bất cứ ai gọi được service đều OCR được file bất kỳ trên máy và đọc lại
nội dung qua response.

Import hàm thật từ `app_ocr`, chỉ stub `paddleocr` / `pdf2image` / `torch`
(app_ocr khởi tạo PaddleOCR ngay lúc import).
"""
import os
import sys
import tempfile
from pathlib import Path

import pytest
from fastapi import HTTPException

from tests.test_api_contract import _Stub, _register


def _stub_ocr_libs() -> None:
    cuda = _Stub()
    cuda.is_available = lambda: False
    if "torch" not in sys.modules:
        _register("torch", cuda=cuda)
    _register("paddleocr", PaddleOCR=_Stub)
    _register("pdf2image", convert_from_path=_Stub)


_stub_ocr_libs()

from app_ocr import _resolve_pdf_path  # noqa: E402


@pytest.fixture
def allowed_dir():
    with tempfile.TemporaryDirectory(prefix="ocr_allowed_") as path:
        yield Path(path).resolve()


@pytest.fixture
def outside_dir():
    with tempfile.TemporaryDirectory(prefix="ocr_outside_") as path:
        yield Path(path).resolve()


def make_pdf(directory: Path, name: str = "doc.pdf") -> Path:
    target = directory / name
    target.write_bytes(b"%PDF-1.4 fake")
    return target


class TestResolvePdfPath:
    def test_pdf_trong_thu_muc_duoc_phep_thi_qua(self, allowed_dir):
        pdf = make_pdf(allowed_dir)
        assert _resolve_pdf_path(str(pdf), [allowed_dir]) == str(pdf)

    def test_pdf_trong_thu_muc_con_cung_qua(self, allowed_dir):
        nested = allowed_dir / "a" / "b"
        nested.mkdir(parents=True)
        pdf = make_pdf(nested)
        assert _resolve_pdf_path(str(pdf), [allowed_dir]) == str(pdf)

    def test_pdf_ngoai_thu_muc_duoc_phep_bi_tu_choi(self, allowed_dir, outside_dir):
        pdf = make_pdf(outside_dir)
        with pytest.raises(HTTPException) as exc:
            _resolve_pdf_path(str(pdf), [allowed_dir])
        assert exc.value.status_code == 400
        assert "ngoài thư mục" in exc.value.detail

    def test_duong_dan_dot_dot_khong_thoat_ra_duoc(self, allowed_dir, outside_dir):
        pdf = make_pdf(outside_dir, "secret.pdf")
        escape = allowed_dir / ".." / outside_dir.name / "secret.pdf"
        with pytest.raises(HTTPException, match="ngoài thư mục"):
            _resolve_pdf_path(str(escape), [allowed_dir])
        # Chốt là đường dẫn đó THẬT SỰ trỏ tới file ngoài kia, không phải
        # bị từ chối vì file không tồn tại.
        assert Path(escape).resolve() == pdf.resolve()

    @pytest.mark.skipif(
        os.name == "nt", reason="symlink trên Windows cần quyền riêng"
    )
    def test_symlink_tro_ra_ngoai_bi_tu_choi(self, allowed_dir, outside_dir):
        real = make_pdf(outside_dir, "real.pdf")
        link = allowed_dir / "link.pdf"
        link.symlink_to(real)
        with pytest.raises(HTTPException, match="ngoài thư mục"):
            _resolve_pdf_path(str(link), [allowed_dir])

    def test_file_khong_phai_pdf_bi_tu_choi(self, allowed_dir):
        other = allowed_dir / "id_rsa"
        other.write_text("khong phai pdf")
        with pytest.raises(HTTPException, match="Chỉ hỗ trợ PDF"):
            _resolve_pdf_path(str(other), [allowed_dir])

    def test_duoi_pdf_viet_hoa_van_qua(self, allowed_dir):
        pdf = make_pdf(allowed_dir, "DOC.PDF")
        assert _resolve_pdf_path(str(pdf), [allowed_dir]) == str(pdf)

    def test_pdf_khong_ton_tai_bi_tu_choi(self, allowed_dir):
        with pytest.raises(HTTPException, match="không tồn tại"):
            _resolve_pdf_path(str(allowed_dir / "khong-co.pdf"), [allowed_dir])

    def test_thu_muc_ten_pdf_khong_duoc_coi_la_file(self, allowed_dir):
        directory = allowed_dir / "thumuc.pdf"
        directory.mkdir()
        with pytest.raises(HTTPException, match="không tồn tại"):
            _resolve_pdf_path(str(directory), [allowed_dir])
