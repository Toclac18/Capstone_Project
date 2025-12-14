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


