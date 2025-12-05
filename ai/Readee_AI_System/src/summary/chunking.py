from typing import List

from .settings import SAFE_INPUT_TOKENS


def split_ids(
    ids: List[int],
    chunk_tokens: int | None = None,
    overlap: int = 48,
) -> list[list[int]]:
    if chunk_tokens is None:
        chunk_tokens = SAFE_INPUT_TOKENS
    chunk_tokens = max(64, int(chunk_tokens))
    overlap = max(0, min(overlap, chunk_tokens // 2))

    n = len(ids)
    if n <= chunk_tokens:
        return [ids[:]]

    chunks: list[list[int]] = []
    start = 0
    while start < n:
        end = min(start + chunk_tokens, n)
        chunks.append(ids[start:end])
        if end == n:
            break
        start = end - overlap
    return chunks


