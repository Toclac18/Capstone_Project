"""
Chia full_text thành chunk cho text moderation, kèm số trang của mỗi chunk.

Module này cố ý **không import torch/transformers**: nó là logic thuần nên
test được mà không cần GPU hay model (xem `tests/test_text_chunker.py`).
"""
import re
from typing import Dict, List, Tuple

# Một "từ" = chuỗi ký tự không phải khoảng trắng. Dùng finditer thay vì
# str.split() để biết vị trí của từ trong text GỐC — xem ghi chú ở
# split_text_into_chunks.
_WORD_RE = re.compile(r"\S+")


def split_text_into_chunks(
    text: str,
    max_tokens: int = 100,
    page_ranges: Dict[int, Tuple[int, int]] | None = None,
) -> Tuple[List[str], List[int]]:
    """
    Tách text thành chunks và map về page numbers.
    Returns: (chunks, chunk_page_numbers)

    Vị trí của chunk được lấy từ text GỐC, không suy ra từ độ dài chunk đã
    ghép. `" ".join(words)` thu mọi chuỗi khoảng trắng về 1 ký tự, nên dòng
    trống và thụt lề làm độ dài chunk ngắn hơn đoạn gốc — sai lệch đó cộng
    dồn qua từng chunk và đẩy số trang lệch dần về phía trước.
    """
    max_chars = max_tokens * 4

    if len(text) <= max_chars:
        # Tìm page cho toàn bộ text
        page_num = find_page_for_position(0, len(text), page_ranges)
        return [text], [page_num]

    chunks: List[str] = []
    chunk_page_numbers: List[int] = []

    current_words: List[str] = []
    current_length = 0
    current_start_pos = 0  # offset trong `text` của từ đầu chunk
    current_end_pos = 0  # offset kết thúc của từ cuối đã thêm

    def flush() -> None:
        chunks.append(" ".join(current_words))
        chunk_page_numbers.append(
            find_page_for_position(current_start_pos, current_end_pos, page_ranges)
        )

    for match in _WORD_RE.finditer(text):
        word = match.group()
        # Độ dài từ + 1 khoảng trắng
        word_length = len(word) + 1

        # Nếu thêm từ này vượt quá max_chars và đã có từ trong chunk
        # -> Lưu chunk hiện tại, bắt đầu chunk mới
        if current_length + word_length > max_chars and current_words:
            flush()
            current_words = []
            current_length = 0

        if not current_words:
            current_start_pos = match.start()
        current_words.append(word)
        current_length += word_length
        current_end_pos = match.end()

    # Thêm chunk cuối cùng nếu còn
    if current_words:
        flush()

    return chunks, chunk_page_numbers


def find_page_for_position(
    start_pos: int,
    end_pos: int,
    page_ranges: Dict[int, Tuple[int, int]] | None,
) -> int:
    """
    Tìm page number cho một đoạn text dựa trên vị trí trong full_text.
    Returns page number (1-indexed), default = 1 nếu không tìm thấy.
    Tối ưu: tìm page chứa start_pos (thường là page đúng nhất).
    """
    if not page_ranges:
        return 1

    # Tối ưu: tìm page chứa start_pos (nhanh hơn)
    sorted_pages = sorted(page_ranges.items())
    for page_num, (page_start, page_end) in sorted_pages:
        # Nếu start_pos nằm trong range của page này
        if page_start <= start_pos < page_end:
            return page_num
        # Nếu start_pos < page_start và đã qua page đầu tiên -> thuộc page trước đó
        if start_pos < page_start and page_num > 1:
            return page_num - 1

    # Nếu không tìm thấy, kiểm tra overlap
    for page_num, (page_start, page_end) in sorted_pages:
        if start_pos < page_end and end_pos > page_start:
            return page_num

    # Default: trả về page cuối cùng hoặc 1
    return sorted_pages[-1][0] if sorted_pages else 1
