"""
Cho phép test import `src.*` (Readee_AI_System) và `app_ocr` (OCR_Service)
khi chạy pytest từ `ai/Readee_AI_System/`.

Không có package cài đặt (chưa có pyproject.toml), nên thêm thư mục vào
sys.path bằng tay.
"""
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
# OCR_Service là service riêng nhưng dùng chung bộ test này — nó chỉ có một
# file và không có setup pytest riêng.
OCR_SERVICE_SRC = PROJECT_ROOT.parent / "OCR_Service" / "src"

for path in (PROJECT_ROOT, OCR_SERVICE_SRC):
    if str(path) not in sys.path:
        sys.path.insert(0, str(path))
