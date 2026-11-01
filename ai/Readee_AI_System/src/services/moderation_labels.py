"""
Hậu xử lý dùng chung cho hai model kiểm duyệt (ảnh và text).

Cả hai đều là classifier 2 lớp và trả về cùng hình dạng kết quả, nên phần
đổi xác suất -> nhãn phải nằm một chỗ. Trước đây mỗi service tự chép, và hai
bản đã lệch nhau: `ImageModerationService.predict_batch` quên softmax nên
trả logit thô làm `confidence`.
"""
from typing import Any, Dict, List, Sequence

LABELS = ("non-toxic", "toxic")

# Softmax phải cho tổng xác suất ~1. Sai số FP16 -> float chỉ cỡ 1e-3, nên
# ngưỡng này rộng rãi mà vẫn bắt được trường hợp quên softmax (hàng logit thô
# cộng lại ra 3.7, -1.2, ... chứ không ra 1).
_PROB_SUM_TOLERANCE = 0.05


def labelled_results(probabilities: Sequence[Sequence[float]]) -> List[Dict[str, Any]]:
    """
    Đổi ma trận xác suất [n, 2] thành danh sách kết quả.

    Hàm thuần (không torch) để hai đường `predict` và `predict_batch` dùng
    chung một chỗ hậu xử lý — chúng từng lệch nhau: bản batch thiếu softmax
    nên trả logit thô làm `confidence`.

    Raise ValueError nếu một hàng không phải phân phối xác suất. Đó chính là
    dấu hiệu của việc quên softmax, và thà nổ còn hơn ghi `confidence: 4.21`
    vào DB rồi kẹp về 1.0 cho giống thật.
    """
    results: List[Dict[str, Any]] = []
    for index, row in enumerate(probabilities):
        if len(row) != len(LABELS):
            raise ValueError(
                f"Ảnh {index}: model trả {len(row)} lớp, cần {len(LABELS)}"
            )

        total = float(sum(row))
        if abs(total - 1.0) > _PROB_SUM_TOLERANCE:
            raise ValueError(
                f"Ảnh {index}: tổng xác suất = {total:.4f}, không phải 1. "
                f"Output của model chưa qua softmax? (giá trị: {list(row)})"
            )

        probs = [float(value) for value in row]
        predicted_class = max(range(len(probs)), key=probs.__getitem__)
        results.append(
            {
                "prediction": LABELS[predicted_class],
                "confidence": probs[predicted_class],
                "probabilities": dict(zip(LABELS, probs)),
                "is_toxic": predicted_class == 1,
            }
        )
    return results
