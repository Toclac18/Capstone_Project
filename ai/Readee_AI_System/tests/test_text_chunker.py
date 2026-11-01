"""
Chốt hành vi của `split_text_into_chunks` / `find_page_for_position`.

Nội dung chunk là đầu vào của text moderation, nên nó phải giữ nguyên qua mọi
lần refactor: đổi cách chia chunk là đổi kết quả kiểm duyệt.
"""
from src.services.text_chunker import find_page_for_position, split_text_into_chunks


def pdf_like_pages(page_texts: list[str]) -> tuple[str, dict[int, tuple[int, int]]]:
    """
    Dựng (full_text, page_ranges) giống `_extract_text_by_pages_from_pdf`:
    các trang nối liền nhau, mỗi trang trừ trang cuối được thêm "\\n".
    """
    parts: list[str] = []
    ranges: dict[int, tuple[int, int]] = {}
    pos = 0
    for i, text in enumerate(page_texts):
        chunk = text if i == len(page_texts) - 1 else text + "\n"
        parts.append(chunk)
        ranges[i + 1] = (pos, pos + len(chunk))
        pos += len(chunk)
    return "".join(parts), ranges


class TestSplitTextIntoChunks:
    def test_text_ngan_hon_gioi_han_tra_ve_nguyen_van(self):
        chunks, pages = split_text_into_chunks("hello world", max_tokens=100)
        assert chunks == ["hello world"]
        assert pages == [1]

    def test_khong_co_page_ranges_thi_moi_chunk_la_trang_1(self):
        text = " ".join(f"w{i}" for i in range(500))
        chunks, pages = split_text_into_chunks(text, max_tokens=10)
        assert len(chunks) > 1
        assert set(pages) == {1}

    def test_moi_chunk_khong_vuot_max_chars(self):
        text = " ".join(f"word{i}" for i in range(400))
        max_tokens = 25
        chunks, _ = split_text_into_chunks(text, max_tokens=max_tokens)
        # Thuật toán đóng chunk khi thêm từ kế tiếp sẽ vượt max_chars, nên
        # mỗi chunk luôn <= max_chars (trừ trường hợp một từ dài hơn cả chunk).
        assert all(len(c) <= max_tokens * 4 for c in chunks)

    def test_ghep_lai_dung_thu_tu_va_du_tu(self):
        words = [f"w{i}" for i in range(300)]
        chunks, pages = split_text_into_chunks(" ".join(words), max_tokens=12)
        assert " ".join(chunks).split() == words
        assert len(pages) == len(chunks)

    def test_chunk_khong_bao_gio_rong(self):
        text = " ".join(f"token{i}" for i in range(200))
        chunks, _ = split_text_into_chunks(text, max_tokens=8)
        assert all(c.strip() for c in chunks)

    def test_khoang_trang_lien_tiep_khong_sinh_tu_rong(self):
        text = "alpha  \n\n  beta\t\tgamma " + " ".join(f"x{i}" for i in range(200))
        chunks, _ = split_text_into_chunks(text, max_tokens=10)
        assert all(c.strip() for c in chunks)
        assert chunks[0].startswith("alpha beta gamma")


class TestFindPageForPosition:
    def test_page_ranges_rong_tra_ve_1(self):
        assert find_page_for_position(0, 10, None) == 1
        assert find_page_for_position(0, 10, {}) == 1

    def test_vi_tri_trong_trang_tra_ve_dung_trang(self):
        ranges = {1: (0, 100), 2: (100, 250), 3: (250, 400)}
        assert find_page_for_position(0, 50, ranges) == 1
        assert find_page_for_position(99, 120, ranges) == 1
        assert find_page_for_position(100, 150, ranges) == 2
        assert find_page_for_position(249, 260, ranges) == 2
        assert find_page_for_position(250, 300, ranges) == 3

    def test_vi_tri_vuot_qua_moi_trang_tra_ve_trang_cuoi(self):
        ranges = {1: (0, 100), 2: (100, 250)}
        assert find_page_for_position(5000, 5100, ranges) == 2
