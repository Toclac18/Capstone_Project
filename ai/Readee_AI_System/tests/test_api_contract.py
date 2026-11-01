"""
Chốt bảng route của AI service.

Backend gọi đúng các đường dẫn này (xem
`be/.../AiDocumentModerationAndSummarizationServiceImpl.java`), nên đổi hay
thiếu route là làm vỡ tích hợp mà không test nào khác bắt được — ví dụ quên
`include_router` sau khi tách file.

Test stub các lib ML nặng (torch, transformers, torchvision, PIL, fitz, docx)
để import được `src.app` mà không cần GPU, không nạp model: CI không cài
nổi `requirements.txt` đầy đủ.
"""
import sys
import types

import pytest


class _Stub:
    """Đối tượng nhận mọi thuộc tính / lời gọi, trả về chính kiểu của nó."""

    def __init__(self, *args, **kwargs):
        pass

    def __getattr__(self, name):
        return _Stub()

    def __call__(self, *args, **kwargs):
        return _Stub()


def _register(name: str, **attrs) -> types.ModuleType:
    module = types.ModuleType(name)
    for key, value in attrs.items():
        setattr(module, key, value)
    sys.modules[name] = module
    return module


def _stub_ml_libs() -> None:
    cuda = _Stub()
    cuda.is_available = lambda: False

    _register(
        "torch",
        cuda=cuda,
        device=_Stub,
        float16=_Stub(),
        no_grad=_Stub,
        inference_mode=_Stub,
        set_grad_enabled=lambda *a: None,
        backends=_Stub(),
        stack=_Stub(),
        argmax=_Stub(),
        load=_Stub(),
        ones_like=_Stub(),
        __version__="stub",
    )
    _register("torch.nn", Module=_Stub, Linear=_Stub, functional=_Stub())
    _register("torch.nn.functional", softmax=_Stub())
    _register("torchvision", models=_Stub(), transforms=_Stub())
    _register(
        "torchvision.transforms",
        Compose=_Stub,
        Resize=_Stub,
        ToTensor=_Stub,
        Normalize=_Stub,
    )
    _register("torchvision.models", mobilenet_v3_large=_Stub)
    _register(
        "transformers",
        AutoTokenizer=_Stub,
        AutoModelForSequenceClassification=_Stub,
        AutoModelForCausalLM=_Stub,
        BitsAndBytesConfig=_Stub,
    )
    _register("huggingface_hub", login=lambda **k: None, HfFolder=_Stub)
    _register("PIL", Image=_Stub())
    _register("PIL.Image", Image=_Stub, open=_Stub, Resampling=_Stub())
    _register("fitz", open=_Stub)
    _register("docx", Document=_Stub)


EXPECTED_ROUTES = {
    ("GET", "/health"),
    ("POST", "/api/v1/process-document"),
    ("GET", "/api/v1/process-document/{job_id}/status"),
    ("GET", "/api/v1/process-document/{job_id}/result"),
    ("GET", "/api/v1/process-document/queue-info"),
    ("GET", "/api/v1/process-document/debug/list-jobs"),
    ("POST", "/api/v1/summarize-text"),
    ("POST", "/api/v1/summarize-text-file"),
}


@pytest.fixture(scope="module")
def app():
    _stub_ml_libs()
    from src.app import app as fastapi_app

    return fastapi_app


def _routes(app) -> set[tuple[str, str]]:
    found = set()
    for route in app.routes:
        methods = getattr(route, "methods", None)
        if not methods:
            continue
        for method in methods:
            if method in ("GET", "POST", "PUT", "PATCH", "DELETE"):
                found.add((method, route.path))
    return found


def test_khong_thieu_route_nao(app):
    assert EXPECTED_ROUTES <= _routes(app)


def test_khong_them_route_la(app):
    # /docs, /redoc, /openapi.json là của FastAPI, không tính.
    fastapi_builtin = {
        ("GET", "/docs"),
        ("GET", "/docs/oauth2-redirect"),
        ("GET", "/redoc"),
        ("GET", "/openapi.json"),
    }
    assert _routes(app) - fastapi_builtin == EXPECTED_ROUTES
