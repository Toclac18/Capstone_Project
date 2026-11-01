"""
Hậu xử lý dùng chung của hai model kiểm duyệt, và phần chia lô của model ảnh.

`labelled_results` là hàm thuần nên test được không cần torch/GPU/checkpoint.
"""
import pytest

from tests.test_api_contract import _stub_ml_libs

_stub_ml_libs()

from src.services.image_moderation_service import (  # noqa: E402
    ImageModerationService,
)
from src.services.moderation_labels import LABELS, labelled_results  # noqa: E402


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


class ChiaLoService(ImageModerationService):
    """
    Bỏ qua __init__ (nạp checkpoint) và thay `_probabilities` bằng hàm ghi lại
    kích thước từng lô. Chỉ còn kiểm đúng phần chia lô + ghép kết quả.
    """

    def __init__(self):  # noqa: D107  (cố ý không gọi super)
        self.batch_sizes: list[int] = []

    def preprocess_image(self, image):
        return image

    def _probabilities(self, batch_tensor):
        self.batch_sizes.append(len(batch_tensor))
        return [[0.8, 0.2] for _ in batch_tensor]


class FakeTorchCat:
    """`torch.cat(list, dim=0)` trong predict_batch — ở đây chỉ cần nối list."""

    @staticmethod
    def cat(tensors, dim=0):
        return list(tensors)


class TestChiaLoAnh:
    """
    Regression: trước đây cả danh sách ảnh được stack vào MỘT tensor. PDF 400
    ảnh = 400x3x224x224 (~230MB FP16 chỉ riêng input) trên GPU đang giữ model
    Llama của summary.
    """

    @pytest.fixture
    def service(self, monkeypatch):
        import src.services.image_moderation_service as module

        monkeypatch.setattr(module, "torch", FakeTorchCat)
        return ChiaLoService()

    def test_chia_dung_kich_thuoc_lo(self, service):
        service.predict_batch([f"img{i}" for i in range(70)], batch_size=32)
        assert service.batch_sizes == [32, 32, 6]

    def test_so_ket_qua_bang_so_anh(self, service):
        results = service.predict_batch([f"img{i}" for i in range(70)], batch_size=32)
        assert len(results) == 70
        assert all(r["prediction"] == "non-toxic" for r in results)

    def test_it_anh_hon_mot_lo_thi_chi_mot_luot(self, service):
        service.predict_batch(["a", "b", "c"], batch_size=32)
        assert service.batch_sizes == [3]

    def test_list_rong_khong_goi_model(self, service):
        assert service.predict_batch([]) == []
        assert service.batch_sizes == []

    @pytest.mark.parametrize("batch_size", [0, -1, 1, 5, 1000, None])
    def test_moi_batch_size_deu_xu_ly_du_anh_va_khong_lap_vo_han(
        self, service, batch_size
    ):
        # 0 và None rơi về IMAGE_BATCH_SIZE, số âm bị kẹp lên 1.
        images = [f"img{i}" for i in range(13)]
        results = service.predict_batch(images, batch_size=batch_size)
        assert len(results) == 13
        assert sum(service.batch_sizes) == 13
        assert all(size >= 1 for size in service.batch_sizes)


def test_hai_service_dung_chung_mot_ham_hau_xu_ly():
    """
    Lỗi thiếu softmax xảy ra được vì mỗi service tự chép phần hậu xử lý. Test
    này chốt việc cả hai trỏ về cùng một hàm, nên không lệch lại được.
    """
    from src.services import (
        image_moderation_service,
        moderation_labels,
        text_moderation_service,
    )

    assert (
        image_moderation_service.labelled_results
        is moderation_labels.labelled_results
    )
    assert (
        text_moderation_service.labelled_results
        is moderation_labels.labelled_results
    )
