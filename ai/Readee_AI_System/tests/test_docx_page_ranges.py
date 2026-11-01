"""
Ước tính khoảng trang của DOCX.

`find_page_for_position` tìm trang CHỨA offset, nên các khoảng phải liền nhau
và không rỗng. Bản cũ ghi khoảng rỗng và vẫn ra đúng số trang nhờ nhánh dự
phòng của hàm đó bù lại — các test dưới đây chốt rằng khoảng tự đúng, không
cần ai bù.
"""
import pytest

from tests.test_api_contract import _stub_ml_libs

_stub_ml_libs()

from src.services.document_service import estimate_docx_page_ranges  # noqa: E402
from src.services.text_chunker import find_page_for_position  # noqa: E402


def full_text_of(paragraphs: list[str]) -> str:
    """Giống `"\\n".join(texts)` trong `_extract_text_and_images_from_docx`."""
    return "\n".join(paragraphs)


class TestEstimateDocxPageRanges:
    def test_khong_co_doan_nao_tra_ve_rong(self):
        assert estimate_docx_page_ranges([]) == {}

    def test_it_doan_hon_mot_trang_thi_mot_trang(self):
        paragraphs = [f"doan {i}" for i in range(10)]
        ranges = estimate_docx_page_ranges(paragraphs, paragraphs_per_page=50)
        assert ranges == {1: (0, len(full_text_of(paragraphs)))}

    def test_khoang_lien_nhau_phu_kin_full_text(self):
        paragraphs = [f"doan so {i} voi mot it chu" for i in range(260)]
        full_text = full_text_of(paragraphs)
        ranges = estimate_docx_page_ranges(paragraphs, paragraphs_per_page=50)

        assert len(ranges) == 6  # 260 đoạn / 50
        assert sorted(ranges) == list(range(1, 7))
        assert ranges[1][0] == 0
        assert ranges[6][1] == len(full_text)
        # liền nhau: end của trang n = start của trang n+1
        for page in range(1, 6):
            assert ranges[page][1] == ranges[page + 1][0]

    def test_khong_co_khoang_rong(self):
        # Bản cũ ghi (current_pos, current_pos) cho mọi trang trừ trang cuối.
        paragraphs = [f"doan {i}" for i in range(200)]
        ranges = estimate_docx_page_ranges(paragraphs, paragraphs_per_page=50)
        assert all(end > start for start, end in ranges.values())

    def test_moi_offset_trong_full_text_deu_tim_duoc_trang(self):
        paragraphs = [f"doan so {i} them chu cho dai" for i in range(180)]
        full_text = full_text_of(paragraphs)
        ranges = estimate_docx_page_ranges(paragraphs, paragraphs_per_page=50)

        pages = [
            find_page_for_position(pos, pos + 1, ranges)
            for pos in range(0, len(full_text), 37)
        ]
        # Trang tăng dần theo offset và đi qua đủ 4 trang.
        assert pages == sorted(pages)
        assert set(pages) == {1, 2, 3, 4}

    @pytest.mark.parametrize("per_page", [1, 7, 50, 1000])
    def test_moi_paragraphs_per_page_deu_phu_kin(self, per_page):
        paragraphs = [f"d{i}" for i in range(97)]
        full_text = full_text_of(paragraphs)
        ranges = estimate_docx_page_ranges(paragraphs, paragraphs_per_page=per_page)
        assert min(s for s, _ in ranges.values()) == 0
        assert max(e for _, e in ranges.values()) == len(full_text)
        assert all(end > start for start, end in ranges.values())
