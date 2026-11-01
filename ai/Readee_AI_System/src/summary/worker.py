import asyncio
import logging
from typing import Any, Dict, List

import torch

from ..config import SAFE_INPUT_TOKENS
from .generation import (
    _compute_budget_for_level,
    build_partials,
    count_tokens,
    generate_triple_one_shot,
    generate_with_budget,
    preclean,
)

logger = logging.getLogger(__name__)

LEVELS = ("short", "medium", "detailed")

# Dưới mốc này thì nhồi cả tài liệu vào một prompt; trên thì map-reduce.
SMALL_DIRECT_THRESHOLD = 12_000
# Trên mốc này tự bật speed mode, không chờ caller yêu cầu.
HUGE_THRESHOLD = SAFE_INPUT_TOKENS * 10


def _clear_gpu_cache(model, context: str, level=logging.INFO) -> None:
    """
    Trả cache allocator của PyTorch về driver và log mức thay đổi.

    Bốn chỗ trong file này từng chép nguyên 13 dòng đo-clear-đo-log giống
    nhau, chỉ khác câu log.
    """
    if not torch.cuda.is_available():
        return

    device = next(model.parameters()).device
    before_allocated = torch.cuda.memory_allocated(device.index) / 1024**3
    before_reserved = torch.cuda.memory_reserved(device.index) / 1024**3
    torch.cuda.empty_cache()
    after_allocated = torch.cuda.memory_allocated(device.index) / 1024**3
    after_reserved = torch.cuda.memory_reserved(device.index) / 1024**3

    logger.log(
        level,
        f"GPU cache {context}: "
        f"allocated {before_allocated:.2f}→{after_allocated:.2f} GB "
        f"({before_allocated - after_allocated:.2f} GB freed), "
        f"reserved {before_reserved:.2f}→{after_reserved:.2f} GB "
        f"({before_reserved - after_reserved:.2f} GB freed)",
    )


def _bullets_to_paragraphs(text: str) -> str:
    """Bỏ dấu đầu dòng rồi gộp thành 2 đoạn — dùng khi model không sinh được
    bản detailed và phải dẫn xuất từ bản medium/short."""
    cleaned_lines: List[str] = []
    for line in text.splitlines():
        stripped = line.strip()
        if not stripped:
            continue
        if stripped[:2] in ("- ", "* ", "• "):
            stripped = stripped[2:]
        cleaned_lines.append(stripped)

    if not cleaned_lines:
        return ""
    if len(cleaned_lines) == 1:
        return cleaned_lines[0]

    mid = max(1, len(cleaned_lines) // 2)
    para1 = " ".join(cleaned_lines[:mid]).strip()
    para2 = " ".join(cleaned_lines[mid:]).strip()
    return f"{para1}\n\n{para2}" if para2 else para1


class AsyncSummarizer:
    def __init__(self, model, tokenizer, max_gpu_concurrency: int = 1):
        self.model = model
        self.tokenizer = tokenizer
        self.sem = asyncio.Semaphore(max_gpu_concurrency)

    async def _run_in_thread(self, fn, *args, **kwargs):
        loop = asyncio.get_running_loop()
        return await loop.run_in_executor(None, lambda: fn(*args, **kwargs))

    def _prepare_input(self, text: str, speed: bool) -> tuple[str, int, bool]:
        """
        Tiền xử lý + map-reduce nếu text quá dài.

        Trả (base_text, n_in_tokens, effective_speed).
        """
        cleaned = preclean(text)
        n_in = count_tokens(self.tokenizer, cleaned)
        auto_speed = n_in > HUGE_THRESHOLD

        if n_in <= SMALL_DIRECT_THRESHOLD:
            return cleaned, n_in, speed or auto_speed

        base_text, n_in = build_partials(
            self.tokenizer, self.model, cleaned, speed=speed or auto_speed
        )
        _clear_gpu_cache(self.model, "cleared after map-reduce")
        return base_text, n_in, speed or auto_speed

    def _summarize_triple_sync(self, text: str, speed: bool = False) -> Dict[str, Any]:
        base_text, n_in, effective_speed = self._prepare_input(text, speed)

        budgets = {
            level: _compute_budget_for_level(level, n_in, speed=effective_speed)
            for level in LEVELS
        }

        try:
            results, runtime_ms = generate_triple_one_shot(
                tokenizer=self.tokenizer,
                model=self.model,
                text=base_text,
                budgets=budgets,
            )
        except torch.cuda.OutOfMemoryError:
            _clear_gpu_cache(
                self.model, "cleared after CUDA OOM (triple)", logging.ERROR
            )
            raise
        finally:
            # Luôn clear sau mỗi request: model Llama ở lại GPU cùng 2 model
            # kiểm duyệt, nên cache không trả lại là lần sau OOM.
            _clear_gpu_cache(self.model, "cleared after summary")

        for level in LEVELS:
            if level not in results or results[level].get("text") is None:
                results[level] = {"text": "", "output_tokens": 0}

        # Model đôi khi không sinh phần ===DETAILED===; dẫn xuất từ medium/short
        # thay vì trả rỗng.
        if not results["detailed"]["text"]:
            source = results["medium"]["text"] or results["short"]["text"] or ""
            results["detailed"]["text"] = _bullets_to_paragraphs(source)

        # Đếm token thật rồi kẹp theo budget, để con số báo cáo không vượt
        # ngân sách đã công bố.
        for level in LEVELS:
            text_level = results[level]["text"] or ""
            real_tokens = count_tokens(self.tokenizer, text_level)
            budget = int(budgets.get(level) or 0)
            results[level]["output_tokens"] = (
                min(real_tokens, budget) if budget > 0 else real_tokens
            )

        return {
            "input_tokens": n_in,
            "budgets": budgets,
            "runtime_ms_total": runtime_ms,
            "results": results,
        }

    async def summarize_triple(self, text: str, speed: bool = False) -> Dict[str, Any]:
        async with self.sem:
            return await self._run_in_thread(
                self._summarize_triple_sync, text, speed
            )

    def _summarize_single_sync(
        self, level: str, text: str, speed: bool = False
    ) -> Dict[str, Any]:
        base_text, n_in, effective_speed = self._prepare_input(text, speed)
        budget = _compute_budget_for_level(level, n_in, speed=effective_speed)

        try:
            result = generate_with_budget(
                tokenizer=self.tokenizer,
                model=self.model,
                level=level,
                text=base_text,
                n_in_tokens=n_in,
                speed=effective_speed,
            )
        except torch.cuda.OutOfMemoryError:
            _clear_gpu_cache(
                self.model, "cleared after CUDA OOM (single)", logging.ERROR
            )
            raise
        finally:
            _clear_gpu_cache(self.model, "cleared after single summary")

        return {
            "input_tokens": n_in,
            "budget": budget,
            "result": result,
        }

    async def summarize_single(
        self, level: str, text: str, speed: bool = False
    ) -> Dict[str, Any]:
        async with self.sem:
            return await self._run_in_thread(
                self._summarize_single_sync, level, text, speed
            )
