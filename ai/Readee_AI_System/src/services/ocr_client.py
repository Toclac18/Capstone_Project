import requests
import httpx
import asyncio
from typing import Dict, Any

OCR_SERVICE_URL = "http://127.0.0.1:9000"  # OCR_Service
OCR_TIMEOUT = 600


def run_ocr_on_file(file_path: str) -> Dict[str, Any]:
    """
    Gọi OCR_Service và trả về nguyên JSON (có field text_path).
    Dùng endpoint cũ (tuần tự).
    """
    resp = requests.get(
        f"{OCR_SERVICE_URL}/ocr-file",
        params={"path": file_path},
        timeout=OCR_TIMEOUT,
    )
    resp.raise_for_status()
    return resp.json()


async def run_ocr_on_file_async(file_path: str) -> Dict[str, Any]:
    """
    Gọi OCR_Service async và trả về nguyên JSON (có field text_path).
    Dùng endpoint cũ (tuần tự).
    """
    async with httpx.AsyncClient(timeout=OCR_TIMEOUT) as client:
        resp = await client.get(
            f"{OCR_SERVICE_URL}/ocr-file",
            params={"path": file_path},
        )
        resp.raise_for_status()
        return resp.json()


async def run_ocr_on_file_parallel(file_path: str, max_workers: int = 4) -> Dict[str, Any]:
    """
    Gọi OCR_Service với parallel processing - OCR nhiều trang cùng lúc.
    Nhanh hơn khi PDF có nhiều trang.
    """
    async with httpx.AsyncClient(timeout=OCR_TIMEOUT) as client:
        resp = await client.get(
            f"{OCR_SERVICE_URL}/ocr-file-parallel",
            params={"path": file_path, "max_workers": max_workers},
        )
        resp.raise_for_status()
        return resp.json()


async def run_ocr_on_pages(file_path: str, page_numbers: list[int], max_workers: int = 4) -> Dict[int, str]:
    """
    OCR nhiều trang cụ thể song song.
    
    Args:
        file_path: Đường dẫn file PDF
        page_numbers: Danh sách số trang cần OCR (1-indexed)
        max_workers: Số worker song song
    
    Returns:
        Dict mapping page_number -> text của trang đó
    """
    async with httpx.AsyncClient(timeout=OCR_TIMEOUT) as client:
        semaphore = asyncio.Semaphore(max_workers)
        
        async def ocr_single_page(page_num: int) -> tuple[int, str]:
            async with semaphore:
                resp = await client.get(
                    f"{OCR_SERVICE_URL}/ocr-page",
                    params={"path": file_path, "page_number": page_num},
                )
                resp.raise_for_status()
                result = resp.json()
                return page_num, result["text"]
        
        # OCR tất cả các trang song song
        tasks = [ocr_single_page(page_num) for page_num in page_numbers]
        results = await asyncio.gather(*tasks)
        
        # Convert thành dict
        return {page_num: text for page_num, text in results}


