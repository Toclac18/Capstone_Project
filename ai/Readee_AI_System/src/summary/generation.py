import re
import time
from typing import Dict, Tuple, Any

import torch

from .settings import SAFE_INPUT_TOKENS, PER_CHUNK_BUDGET, CFG
from .prompts import system_prompt, instruction_for
from .chunking import split_ids
from .model import model_device

_ws_re = re.compile(r"\s+", re.MULTILINE)


def preclean(text: str) -> str:
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    text = _ws_re.sub(" ", text)
    return text.strip()


def count_tokens(tokenizer, text: str) -> int:
    return len(tokenizer.encode(text, add_special_tokens=False))


def _compute_budget_for_level(level: str, n_in: int, speed: bool = False) -> int:
    try:
        spec = CFG["dynamic_budget"][level]
    except KeyError as exc:
        raise ValueError(f"Unknown summary level '{level}'") from exc

    min_tokens = int(spec["min_tokens"])
    max_tokens = int(spec["max_tokens"])
    min_pct = float(spec["min_pct"])
    max_pct = float(spec["max_pct"])

    if n_in < 64:
        return max(16, min(n_in, min_tokens))

    if n_in <= SAFE_INPUT_TOKENS:
        pct = max_pct
    elif n_in >= SAFE_INPUT_TOKENS * 8:
        pct = min_pct
    else:
        ratio = (n_in - SAFE_INPUT_TOKENS) / float(SAFE_INPUT_TOKENS * 7)
        pct = max_pct - (max_pct - min_pct) * ratio

    raw = int(n_in * pct)
    dynamic_min = max(32, min(min_tokens, n_in // 3))
    budget = max(dynamic_min, min(max_tokens, raw))

    if speed:
        budget = max(32, int(budget * 0.7))

    return budget


def _chat_input_ids(tokenizer, model, messages) -> torch.Tensor:
    device = model_device(model)
    input_ids = tokenizer.apply_chat_template(
        messages,
        add_generation_prompt=True,
        return_tensors="pt",
    )
    return input_ids.to(device)


def build_single_prompt_ids(tokenizer, model, level: str, text: str) -> torch.Tensor:
    sys_p = system_prompt()
    instr = instruction_for(level)
    user_content = f"{instr}\n\nText:\n{text}"
    messages = [
        {"role": "system", "content": sys_p},
        {"role": "user", "content": user_content},
    ]
    return _chat_input_ids(tokenizer, model, messages)


def build_triple_prompt_ids(tokenizer, model, text: str) -> torch.Tensor:
    sys_p = system_prompt()
    user_instr = (
        "You are a summarization assistant. Given the document below, produce three summaries:\n\n"
        "[1] SHORT SUMMARY: 3–5 bullet points, only the most essential facts.\n"
        '    - Use bullet points that start with "- ".\n'
        "    - This must be the shortest summary.\n\n"
        "[2] MEDIUM SUMMARY: 6–9 bullet points, with more structure and detail than the short summary.\n"
        '    - Use bullet points that start with "- ".\n'
        "    - Include more context and secondary details than the short summary.\n\n"
        "[3] DETAILED SUMMARY: 1–2 compact paragraphs that are longer and more detailed than the medium summary.\n"
        "    - Use normal sentences in paragraphs.\n"
        "    - Absolutely do NOT use bullet points in the detailed summary.\n"
        "    - The detailed summary MUST be the longest of the three.\n\n"
        "Global rules:\n"
        "- Each summary must be different and reflect a different level of detail.\n"
        "- Do NOT copy or reuse the same sentences between summaries.\n"
        "- You may reuse important names or terms, but the sentences themselves must be different.\n\n"
        "Output format (exactly):\n"
        "===SHORT===\n"
        "...short summary here...\n"
        "===MEDIUM===\n"
        "...medium summary here...\n"
        "===DETAILED===\n"
        "...detailed summary here...\n\n"
        "Document:\n"
        f"{text}"
    )
    messages = [
        {"role": "system", "content": sys_p},
        {"role": "user", "content": user_instr},
    ]
    return _chat_input_ids(tokenizer, model, messages)


def generate_with_budget(
    tokenizer,
    model,
    level: str,
    text: str,
    n_in_tokens: int,
    speed: bool = False,
) -> Dict[str, Any]:
    max_new_tokens = _compute_budget_for_level(level, n_in_tokens, speed=speed)
    input_ids = build_single_prompt_ids(tokenizer, model, level, text)

    start = time.perf_counter()
    with torch.inference_mode():
        # Tạo attention_mask để tránh warning
        attention_mask = torch.ones_like(input_ids)
        
        outputs = model.generate(
            input_ids=input_ids,
            attention_mask=attention_mask,
            max_new_tokens=max_new_tokens,
            do_sample=False,  # Greedy decoding (nhanh nhất)
            pad_token_id=tokenizer.eos_token_id,
            eos_token_id=tokenizer.eos_token_id,
            use_cache=True,
            # Không set temperature và top_p khi do_sample=False để tránh warning
        )
    elapsed_ms = int((time.perf_counter() - start) * 1000)

    gen_ids = outputs[0, input_ids.shape[1] :]
    gen_text = tokenizer.decode(gen_ids, skip_special_tokens=True).strip()

    return {
        "text": gen_text,
        "output_tokens": int(gen_ids.shape[0]),
        "runtime_ms": elapsed_ms,
        "max_new_tokens": max_new_tokens,
    }


def generate_triple_one_shot(
    tokenizer,
    model,
    text: str,
    budgets: Dict[str, int],
) -> Tuple[Dict[str, Dict[str, Any]], int]:
    max_new_tokens = int(sum(budgets.values()) + 32)

    input_ids = build_triple_prompt_ids(tokenizer, model, text)

    start = time.perf_counter()
    with torch.inference_mode():
        # Tạo attention_mask để tránh warning
        attention_mask = torch.ones_like(input_ids)
        
        outputs = model.generate(
            input_ids=input_ids,
            attention_mask=attention_mask,
            max_new_tokens=max_new_tokens,
            do_sample=False,  # Greedy decoding (nhanh nhất)
            pad_token_id=tokenizer.eos_token_id,
            eos_token_id=tokenizer.eos_token_id,
            use_cache=True,
            # Không set temperature và top_p khi do_sample=False để tránh warning
        )
    elapsed_ms = int((time.perf_counter() - start) * 1000)

    gen_ids = outputs[0, input_ids.shape[1] :]
    full_text = tokenizer.decode(gen_ids, skip_special_tokens=True)

    def _extract_section(marker_start: str, marker_end: str | None) -> str:
        start_idx = full_text.find(marker_start)
        if start_idx == -1:
            return ""
        start_idx += len(marker_start)
        if marker_end is None:
            segment = full_text[start_idx:]
        else:
            end_idx = full_text.find(marker_end, start_idx)
            if end_idx == -1:
                segment = full_text[start_idx:]
            else:
                segment = full_text[start_idx:end_idx]
        return segment.strip()

    short_text = _extract_section("===SHORT===", "===MEDIUM===")
    medium_text = _extract_section("===MEDIUM===", "===DETAILED===")
    detailed_text = _extract_section("===DETAILED===", None)

    results = {
        "short": {
            "text": short_text,
            "output_tokens": len(
                tokenizer.encode(short_text, add_special_tokens=False)
            ),
        },
        "medium": {
            "text": medium_text,
            "output_tokens": len(
                tokenizer.encode(medium_text, add_special_tokens=False)
            ),
        },
        "detailed": {
            "text": detailed_text,
            "output_tokens": len(
                tokenizer.encode(detailed_text, add_special_tokens=False)
            ),
        },
    }
    return results, elapsed_ms


def build_partials(
    tokenizer,
    model,
    text: str,
    speed: bool = False,
) -> Tuple[str, int]:
    ids = tokenizer.encode(text, add_special_tokens=False)
    chunks = split_ids(ids, SAFE_INPUT_TOKENS, overlap=48)
    num_chunks = len(chunks)

    base = min(PER_CHUNK_BUDGET, 160)
    if num_chunks <= 4:
        per_chunk = base
    elif num_chunks <= 12:
        per_chunk = int(base * 0.75)
    else:
        per_chunk = int(base * 0.5)
    if speed:
        per_chunk = int(per_chunk * 0.7)
    per_chunk = max(48, per_chunk)

    partial_texts = []
    for chunk_ids in chunks:
        chunk_text = tokenizer.decode(chunk_ids, skip_special_tokens=True)
        n_in = len(chunk_ids)
        res = generate_with_budget(
            tokenizer=tokenizer,
            model=model,
            level="short",
            text=chunk_text,
            n_in_tokens=n_in,
            speed=True,
        )
        partial_texts.append(res["text"])

    combined = "\n\n".join(partial_texts)
    combined_tokens = count_tokens(tokenizer, combined)
    return combined, combined_tokens


