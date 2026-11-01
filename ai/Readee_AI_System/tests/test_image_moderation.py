"""
Hậu xử lý của model gán nhãn ảnh.

`labelled_results` là hàm thuần nên test được không cần torch/GPU/checkpoint.
"""
import pytest

from tests.test_api_contract import _stub_ml_libs

_stub_ml_libs()

from src.services.image_moderation_service import (  # noqa: E402
    LABELS,
    labelled_results,
)


class TestLabelledResults:
    def test_nhan_va_confidence_theo_lop_thang(self):
        results = labelled_results([[0.1, 0.9], [0.75, 0.25]])
        assert results[0] == {
            "prediction": "toxic",
            "confidence": 0.9,
            "probabilities": {"non-toxic": 0.1, "toxic": 0.9},
            "is_toxic": True,
        }
        assert results[1]["prediction"] == "non-toxic"
        assert results[1]["is_toxic"] is False
        assert results[1]["confidence"] == 0.75

    def test_confidence_luon_trong_0_1(self):
        results = labelled_results([[0.5, 0.5], [0.999, 0.001], [0.02, 0.98]])
        assert all(0.0 <= r["confidence"] <= 1.0 for r in results)

    def test_list_rong_tra_ve_list_rong(self):
        assert labelled_results([]) == []

    def test_giu_dung_thu_tu_dau_vao(self):
        rows = [[0.9, 0.1], [0.1, 0.9], [0.6, 0.4]]
        assert [r["is_toxic"] for r in labelled_results(rows)] == [False, True, False]

    def test_lop_dung_ten_non_toxic_truoc_toxic(self):
        # Thứ tự lớp là hợp đồng với checkpoint: index 1 = toxic.
        assert LABELS == ("non-toxic", "toxic")
        assert labelled_results([[0.0, 1.0]])[0]["prediction"] == "toxic"


class TestQuenSoftmax:
    """
    Regression: `predict_batch` từng dùng thẳng output model làm xác suất,
    không gọi softmax — `confidence` là logit thô. Pipeline kẹp nó về [0, 1]
    nên nhìn vẫn như xác suất, nhưng:
      - so sánh `confidence >= IMAGE_THRESHOLD (0.5)` thành so logit với 0.5
      - `confidence_percent` lưu vào DB là số vô nghĩa

    `labelled_results` giờ từ chối hàng không phải phân phối xác suất, nên
    quên softmax là nổ chứ không âm thầm.
    """

    @pytest.mark.parametrize(
        "logits",
        [
            [[3.2, -1.7]],  # tổng 1.5
            [[-0.4, -0.9]],  # tổng âm
            [[5.0, 4.0]],  # tổng 9
            [[0.9, 0.9]],  # tổng 1.8 — gần 1 nhưng vẫn ngoài ngưỡng
        ],
    )
    def test_logit_tho_bi_tu_choi(self, logits):
        with pytest.raises(ValueError, match="softmax"):
            labelled_results(logits)

    def test_sai_so_fp16_nho_thi_van_chap_nhan(self):
        # softmax FP16 -> float lệch cỡ 1e-3, không được coi là lỗi.
        labelled_results([[0.4985, 0.5005]])

    def test_sai_so_lon_tren_mot_hang_giua_batch_cung_bi_bat(self):
        with pytest.raises(ValueError, match="Ảnh 2"):
            labelled_results([[0.3, 0.7], [0.6, 0.4], [2.5, -1.0]])

    def test_so_lop_khac_2_bi_tu_choi(self):
        with pytest.raises(ValueError, match="cần 2"):
            labelled_results([[0.2, 0.3, 0.5]])
