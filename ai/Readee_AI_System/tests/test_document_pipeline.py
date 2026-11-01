"""
Pipeline: chọn vi phạm, hình dạng bản ghi vi phạm, và fail-closed khi model
kiểm duyệt lỗi.

Dùng stub cho 2 service model (`predict_batch`) nên không cần GPU.
"""
import asyncio

import pytest

from tests.test_api_contract import _stub_ml_libs

_stub_ml_libs()

from src.services import document_pipeline as pipeline  # noqa: E402
from src.services.document_pipeline import (  # noqa: E402
    ModerationFailed,
    _build_violation,
    _first_violation,
)


def result(toxic: bool, confidence: float, prediction: str | None = None):
    return {
        "is_toxic": toxic,
        "confidence": confidence,
        "prediction": prediction or ("toxic" if toxic else "non-toxic"),
    }


class TestBuildViolation:
    def test_hop_dong_voi_backend(self):
        v = _build_violation("image", 3, result(True, 0.87), page=5)
        # Tên field là hợp đồng với AiModerationResponse.Violation ở BE
        assert v == {
            "type": "image",
            "index": 3,
            "prediction": "toxic",
            "confidence": 0.87,
            "confidence_percent": 87.0,
            "page": 5,
        }

    def test_khong_co_page_thi_bo_han_field(self):
        # BE lưu page vào DB; gửi page sai còn tệ hơn không gửi.
        v = _build_violation("image", 0, result(True, 0.9), page=None)
        assert "page" not in v

    def test_snippet_chi_co_o_vi_pham_text(self):
        assert "snippet" not in _build_violation("image", 0, result(True, 0.9), 1)
        v = _build_violation("text", 0, result(True, 0.9), 1, snippet="abc")
        assert v["snippet"] == "abc"

    @pytest.mark.parametrize(
        "raw,expected",
        [(1.4, 1.0), (-0.3, 0.0), (0.5, 0.5), (0.0, 0.0), (1.0, 1.0)],
    )
    def test_confidence_bi_kep_ve_0_1(self, raw, expected):
        v = _build_violation("image", 0, result(True, raw), None)
        assert v["confidence"] == expected
        assert 0.0 <= v["confidence_percent"] <= 100.0


class TestFirstViolation:
    def test_khong_co_gi_vuot_nguong_tra_ve_none(self):
        results = [result(False, 0.99), result(True, 0.4)]
        assert _first_violation("text", results, 0.5) is None

    def test_dung_o_vi_pham_dau_tien(self):
        results = [result(False, 0.9), result(True, 0.8), result(True, 0.95)]
        v = _first_violation("image", results, 0.5)
        assert v["index"] == 1

    def test_lay_dung_page_va_snippet_theo_index(self):
        results = [result(False, 0.9), result(True, 0.8)]
        v = _first_violation(
            "text", results, 0.5, pages=[1, 7], snippets=["sạch", "bẩn"]
        )
        assert (v["page"], v["snippet"]) == (7, "bẩn")

    def test_pages_ngan_hon_results_khong_vo(self):
        results = [result(True, 0.8)]
        assert "page" not in _first_violation("image", results, 0.5, pages=[])


class FakeService:
    def __init__(self, results=None, error=None):
        self.results = results or []
        self.error = error
        self.calls = 0

    def predict_batch(self, payload):
        self.calls += 1
        if self.error:
            raise self.error
        return self.results


class TestModerateFailClosed:
    """
    Trước đây `_moderate` dùng `gather(return_exceptions=True)` rồi chỉ log và
    `continue`. Model ảnh crash là document đi tiếp như thể không có ảnh vi
    phạm — "không kiểm được" bị tính thành "sạch". Giờ phải nổ.
    """

    @staticmethod
    def run(images, chunks, image_service, text_service, monkeypatch):
        monkeypatch.setattr(pipeline, "get_image_service", lambda: image_service)
        monkeypatch.setattr(pipeline, "get_text_service", lambda: text_service)
        return asyncio.run(pipeline._moderate(images, chunks))

    def test_model_anh_loi_thi_raise(self, monkeypatch):
        with pytest.raises(ModerationFailed):
            self.run(
                ["img"],
                ["text"],
                FakeService(error=RuntimeError("CUDA out of memory")),
                FakeService([result(False, 0.9)]),
                monkeypatch,
            )

    def test_model_text_loi_thi_raise(self, monkeypatch):
        with pytest.raises(ModerationFailed):
            self.run(
                ["img"],
                ["text"],
                FakeService([result(False, 0.9)]),
                FakeService(error=ValueError("tokenizer broken")),
                monkeypatch,
            )

    def test_ca_hai_chay_duoc_thi_tra_ve_ket_qua_va_timing_rieng(self, monkeypatch):
        img_results, txt_results, img_ms, text_ms = self.run(
            ["img"],
            ["text"],
            FakeService([result(True, 0.9)]),
            FakeService([result(False, 0.1)]),
            monkeypatch,
        )
        assert img_results == [result(True, 0.9)]
        assert txt_results == [result(False, 0.1)]
        # Mỗi nhánh tự đo: trước đây cả hai nhận cùng wall-time của gather.
        assert img_ms > 0 and text_ms > 0

    def test_khong_co_anh_thi_khong_goi_model_anh(self, monkeypatch):
        image_service = FakeService([result(True, 0.9)])
        img_results, txt_results, img_ms, _ = self.run(
            None, ["text"], image_service, FakeService([result(False, 0.1)]), monkeypatch
        )
        assert image_service.calls == 0
        assert img_results is None
        assert img_ms == 0.0

    def test_khong_co_gi_de_kiem_thi_khong_goi_model_nao(self, monkeypatch):
        image_service, text_service = FakeService(), FakeService()
        assert self.run(None, None, image_service, text_service, monkeypatch) == (
            None,
            None,
            0.0,
            0.0,
        )
        assert image_service.calls == text_service.calls == 0
