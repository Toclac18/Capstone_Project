import re
from typing import List

def split_text(text: str, max_words: int = 800) -> List[str]:
    """
    Chia nhỏ văn bản theo số lượng từ.
    max_words: số từ tối đa trong 1 chunk.
    """
    words = text.split()
    chunks = []
    for i in range(0, len(words), max_words):
        chunk = " ".join(words[i:i+max_words])
        chunks.append(chunk)
    return chunks

def clean_text(text: str) -> str:
    """
    Tiền xử lý: xóa khoảng trắng thừa, xuống dòng thừa.
    """
    text = re.sub(r"\s+", " ", text)
    return text.strip()
