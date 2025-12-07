import requests
from typing import Dict, Any

OCR_SERVICE_URL = "http://127.0.0.1:9000"  # OCR_Service
OCR_TIMEOUT = 600


def run_ocr_on_file(file_path: str) -> Dict[str, Any]:
    """
    Gọi OCR_Service và trả về nguyên JSON (có field text_path).
    """
    resp = requests.get(
        f"{OCR_SERVICE_URL}/ocr-file",
        params={"path": file_path},
        timeout=OCR_TIMEOUT,
    )
    resp.raise_for_status()
    return resp.json()


