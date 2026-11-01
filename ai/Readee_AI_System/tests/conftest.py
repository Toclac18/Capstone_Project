"""
Cho phép test import `src.*` khi chạy pytest từ `ai/Readee_AI_System/`.

Không có package cài đặt (chưa có pyproject.toml), nên thêm thư mục gốc
project vào sys.path.
"""
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))
