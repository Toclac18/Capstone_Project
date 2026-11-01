"""
Mọi annotation trong `src/` phải resolve được với bộ stub của test.

Vì sao cần test này: từ Python 3.14 (PEP 649) annotation được evaluate lười,
còn Python ≤ 3.13 evaluate NGAY lúc `def`. Nên một annotation như
`torch.Tensor` mà stub không có sẽ:

- im lặng trên máy dev chạy 3.14,
- làm vỡ import trên CI chạy 3.11.

Đúng chuyện đã xảy ra: `ImageModerationService.preprocess_image` khai
`-> torch.Tensor`, stub không có `Tensor`, 96 test pass ở máy và 3 file lỗi
collection trên CI.

`typing.get_type_hints` buộc resolve, nên test này thấy lỗi đó ở MỌI phiên
bản Python.
"""
import importlib
import inspect
import typing
from pathlib import Path

import pytest

from tests.test_api_contract import _stub_ml_libs

_stub_ml_libs()

SRC_DIR = Path(__file__).resolve().parents[1] / "src"


def _module_names() -> list[str]:
    """
    Mọi file .py dưới `src/`, đổi thành tên module.

    Dò theo file chứ không dùng `pkgutil.walk_packages`: `src/api/` và
    `src/services/` không có `__init__.py` (chạy được nhờ namespace package)
    nên walk_packages không xuống tới chúng — đúng hai thư mục cần kiểm nhất.
    """
    names = []
    for path in sorted(SRC_DIR.rglob("*.py")):
        parts = path.relative_to(SRC_DIR).with_suffix("").parts
        if parts[-1] == "__init__":
            parts = parts[:-1]
            if not parts:
                continue
        names.append(".".join(("src",) + parts))
    return names


MODULE_NAMES = _module_names()


def test_tim_thay_du_module():
    # Nếu cách dò module vỡ (đổi layout, thiếu __init__), test này báo ngay
    # chứ không để cả file lặng lẽ không kiểm gì.
    assert len(MODULE_NAMES) >= 15, MODULE_NAMES
    assert "src.services.image_moderation_service" in MODULE_NAMES
    assert "src.api.document_router" in MODULE_NAMES


@pytest.mark.parametrize("module_name", MODULE_NAMES)
def test_annotation_trong_module_resolve_duoc(module_name):
    module = importlib.import_module(module_name)

    failures: list[str] = []

    def check(obj, label: str) -> None:
        try:
            typing.get_type_hints(obj)
        except Exception as e:  # noqa: BLE001 - gom lỗi để báo một lượt
            failures.append(f"{label}: {type(e).__name__}: {e}")

    for name, obj in vars(module).items():
        if name.startswith("__"):
            continue
        if inspect.isfunction(obj) and obj.__module__ == module_name:
            check(obj, f"{module_name}.{name}")
        elif inspect.isclass(obj) and obj.__module__ == module_name:
            check(obj, f"{module_name}.{name}")
            for attr_name, attr in vars(obj).items():
                if inspect.isfunction(attr):
                    check(attr, f"{module_name}.{name}.{attr_name}")

    assert failures == []
