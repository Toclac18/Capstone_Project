"""
Client gọi OCR_Service.

Chỉ còn một đường: OCR theo từng trang (`/ocr-page`), song song có giới hạn.
Ba hàm cũ gọi `/ocr-file` và `/ocr-file-parallel` đã bỏ — DocumentService
quyết định trang nào cần OCR nên không bao giờ gọi tới chúng.
"""
import asyncio
import os
from typing import Dict, List

import httpx

OCR_SERVICE_URL = os.getenv("OCR_SERVICE_URL", "http://127.0.0.1:9000")
OCR_TIMEOUT = float(os.getenv("OCR_TIMEOUT", "600"))


async def run_ocr_on_pages(
    file_path: str, page_numbers: List[int], max_workers: int = 4
) -> Dict[int, str]:
    """
    OCR nhiều trang cụ thể, song song tối đa `max_workers` trang.

    Args:
        file_path: Đường dẫn file PDF
        page_numbers: Danh sách số trang cần OCR (1-indexed)
        max_workers: Số trang chạy đồng thời

    Returns:
        Dict map page_number -> text của trang đó
    """
    if not page_numbers:
        return {}

    semaphore = asyncio.Semaphore(max(1, max_workers))

    async with httpx.AsyncClient(timeout=OCR_TIMEOUT) as client:

        async def ocr_single_page(page_num: int) -> tuple[int, str]:
            async with semaphore:
                resp = await client.get(
                    f"{OCR_SERVICE_URL}/ocr-page",
                    params={"path": file_path, "page_number": page_num},
                )
                resp.raise_for_status()
                return page_num, resp.json()["text"]

        results = await asyncio.gather(
            *(ocr_single_page(page_num) for page_num in page_numbers)
        )

    return dict(results)
