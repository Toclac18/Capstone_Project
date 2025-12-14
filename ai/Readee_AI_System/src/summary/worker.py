import asyncio
from typing import Dict, Any, List

from .generation import (
    preclean,
    count_tokens,
    _compute_budget_for_level,
    build_partials,
    generate_with_budget,
    generate_triple_one_shot,
)
from .settings import SAFE_INPUT_TOKENS


def _bullets_to_paragraphs(text: str) -> str:
    lines_raw = text.splitlines()
    cleaned_lines: List[str] = []
    for line in lines_raw:
        s = line.strip()
        if not s:
            continue
        if s.startswith("- "):
            s = s[2:]
        elif s.startswith("* "):
            s = s[2:]
        elif s.startswith("• "):
            s = s[2:]
        cleaned_lines.append(s)

    if not cleaned_lines:
        return ""

    if len(cleaned_lines) == 1:
        return cleaned_lines[0]

    mid = max(1, len(cleaned_lines) // 2)
    para1 = " ".join(cleaned_lines[:mid])
    para2 = " ".join(cleaned_lines[mid:])
    if para2.strip():
        return para1.strip() + "\n\n" + para2.strip()
    else:
        return para1.strip()


class AsyncSummarizer:
    def __init__(self, model, tokenizer, max_gpu_concurrency: int = 1):
        self.model = model
        self.tokenizer = tokenizer
        self.sem = asyncio.Semaphore(max_gpu_concurrency)

    async def _run_in_thread(self, fn, *args, **kwargs):
        loop = asyncio.get_running_loop()
        return await loop.run_in_executor(None, lambda: fn(*args, **kwargs))

    def _summarize_triple_sync(self, text: str, speed: bool = False) -> Dict[str, Any]:
        import torch
        import logging
        logger = logging.getLogger(__name__)
        
        tok = self.tokenizer
        cleaned = preclean(text)
        n_in = count_tokens(tok, cleaned)

        SMALL_DIRECT_THRESHOLD = 12_000
        HUGE_THRESHOLD = SAFE_INPUT_TOKENS * 10

        use_map_reduce = n_in > SMALL_DIRECT_THRESHOLD
        auto_speed = n_in > HUGE_THRESHOLD

        base_text = cleaned
        if use_map_reduce:
            partial_speed = speed or auto_speed
            base_text, n_in = build_partials(
                tok, self.model, cleaned, speed=partial_speed
            )
            # Clear cache sau map-reduce để giải phóng memory
            if torch.cuda.is_available():
                device = next(self.model.parameters()).device
                before_allocated = torch.cuda.memory_allocated(device.index) / 1024**3
                before_reserved = torch.cuda.memory_reserved(device.index) / 1024**3
                torch.cuda.empty_cache()
                after_allocated = torch.cuda.memory_allocated(device.index) / 1024**3
                after_reserved = torch.cuda.memory_reserved(device.index) / 1024**3
                logger.info(
                    f"GPU cache cleared after map-reduce: "
                    f"allocated {before_allocated:.2f}→{after_allocated:.2f} GB, "
                    f"reserved {before_reserved:.2f}→{after_reserved:.2f} GB"
                )

        budgets = {
            level: _compute_budget_for_level(
                level, n_in, speed=(speed or auto_speed)
            )
            for level in ("short", "medium", "detailed")
        }

        try:
            results, runtime_ms = generate_triple_one_shot(
                tokenizer=tok,
                model=self.model,
                text=base_text,
                budgets=budgets,
            )
        except torch.cuda.OutOfMemoryError as e:
            # Clear cache và log memory info
            if torch.cuda.is_available():
                device = next(self.model.parameters()).device
                before_allocated = torch.cuda.memory_allocated(device.index) / 1024**3
                before_reserved = torch.cuda.memory_reserved(device.index) / 1024**3
                torch.cuda.empty_cache()
                after_allocated = torch.cuda.memory_allocated(device.index) / 1024**3
                after_reserved = torch.cuda.memory_reserved(device.index) / 1024**3
                logger.error(
                    f"CUDA OOM during summary generation. "
                    f"Before clear: allocated={before_allocated:.2f} GB, reserved={before_reserved:.2f} GB. "
                    f"After clear: allocated={after_allocated:.2f} GB, reserved={after_reserved:.2f} GB"
                )
            raise
        finally:
            # Luôn clear cache sau mỗi request để giải phóng memory
            if torch.cuda.is_available():
                device = next(self.model.parameters()).device
                before_allocated = torch.cuda.memory_allocated(device.index) / 1024**3
                before_reserved = torch.cuda.memory_reserved(device.index) / 1024**3
                torch.cuda.empty_cache()
                after_allocated = torch.cuda.memory_allocated(device.index) / 1024**3
                after_reserved = torch.cuda.memory_reserved(device.index) / 1024**3
                logger.info(
                    f"GPU cache cleared after summary: "
                    f"allocated {before_allocated:.2f}→{after_allocated:.2f} GB "
                    f"({before_allocated - after_allocated:.2f} GB freed), "
                    f"reserved {before_reserved:.2f}→{after_reserved:.2f} GB "
                    f"({before_reserved - after_reserved:.2f} GB freed)"
                )

        for level in ("short", "medium", "detailed"):
            if level not in results or results[level].get("text") is None:
                results[level] = {"text": "", "output_tokens": 0}

        short_text = results["short"]["text"] or ""
        medium_text = results["medium"]["text"] or ""
        detailed_text = results["detailed"]["text"] or ""

        if not detailed_text:
            source_for_detailed = medium_text or short_text
            derived = _bullets_to_paragraphs(source_for_detailed)
            results["detailed"]["text"] = derived
            detailed_text = derived

        for level in ("short", "medium", "detailed"):
            text_level = results[level]["text"] or ""
            real_tokens = len(tok.encode(text_level, add_special_tokens=False))
            results[level]["output_tokens"] = real_tokens

        for level in ("short", "medium", "detailed"):
            real_tokens = int(results[level].get("output_tokens") or 0)
            budget = int(budgets.get(level) or 0)
            if budget > 0:
                results[level]["output_tokens"] = min(real_tokens, budget)
            else:
                results[level]["output_tokens"] = real_tokens

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
        import torch
        import logging
        logger = logging.getLogger(__name__)
        
        tok = self.tokenizer
        cleaned = preclean(text)
        n_in = count_tokens(tok, cleaned)

        SMALL_DIRECT_THRESHOLD = 12_000
        HUGE_THRESHOLD = SAFE_INPUT_TOKENS * 10

        use_map_reduce = n_in > SMALL_DIRECT_THRESHOLD
        auto_speed = n_in > HUGE_THRESHOLD

        base_text = cleaned
        if use_map_reduce:
            base_text, n_in = build_partials(
                tok, self.model, cleaned, speed=(speed or auto_speed)
            )
            # Clear cache sau map-reduce
            if torch.cuda.is_available():
                device = next(self.model.parameters()).device
                before_allocated = torch.cuda.memory_allocated(device.index) / 1024**3
                before_reserved = torch.cuda.memory_reserved(device.index) / 1024**3
                torch.cuda.empty_cache()
                after_allocated = torch.cuda.memory_allocated(device.index) / 1024**3
                after_reserved = torch.cuda.memory_reserved(device.index) / 1024**3
                logger.info(
                    f"GPU cache cleared after map-reduce: "
                    f"allocated {before_allocated:.2f}→{after_allocated:.2f} GB, "
                    f"reserved {before_reserved:.2f}→{after_reserved:.2f} GB"
                )

        budget = _compute_budget_for_level(
            level, n_in, speed=(speed or auto_speed)
        )

        try:
            res = generate_with_budget(
                tokenizer=tok,
                model=self.model,
                level=level,
                text=base_text,
                n_in_tokens=n_in,
                speed=(speed or auto_speed),
            )
        except torch.cuda.OutOfMemoryError as e:
            # Clear cache và log memory info
            if torch.cuda.is_available():
                device = next(self.model.parameters()).device
                before_allocated = torch.cuda.memory_allocated(device.index) / 1024**3
                before_reserved = torch.cuda.memory_reserved(device.index) / 1024**3
                torch.cuda.empty_cache()
                after_allocated = torch.cuda.memory_allocated(device.index) / 1024**3
                after_reserved = torch.cuda.memory_reserved(device.index) / 1024**3
                logger.error(
                    f"CUDA OOM during single summary. "
                    f"Before clear: allocated={before_allocated:.2f} GB, reserved={before_reserved:.2f} GB. "
                    f"After clear: allocated={after_allocated:.2f} GB, reserved={after_reserved:.2f} GB"
                )
            raise
        finally:
            # Luôn clear cache sau mỗi request
            if torch.cuda.is_available():
                device = next(self.model.parameters()).device
                before_allocated = torch.cuda.memory_allocated(device.index) / 1024**3
                before_reserved = torch.cuda.memory_reserved(device.index) / 1024**3
                torch.cuda.empty_cache()
                after_allocated = torch.cuda.memory_allocated(device.index) / 1024**3
                after_reserved = torch.cuda.memory_reserved(device.index) / 1024**3
                logger.info(
                    f"GPU cache cleared after single summary: "
                    f"allocated {before_allocated:.2f}→{after_allocated:.2f} GB "
                    f"({before_allocated - after_allocated:.2f} GB freed), "
                    f"reserved {before_reserved:.2f}→{after_reserved:.2f} GB "
                    f"({before_reserved - after_reserved:.2f} GB freed)"
                )

        return {
            "input_tokens": n_in,
            "budget": budget,
            "result": res,
        }

    async def summarize_single(
        self, level: str, text: str, speed: bool = False
    ) -> Dict[str, Any]:
        async with self.sem:
            return await self._run_in_thread(
                self._summarize_single_sync, level, text, speed
            )


