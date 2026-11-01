from ..config import CFG


def system_prompt() -> str:
    return CFG["prompts"]["system"]


def instruction_for(level: str) -> str:
    return CFG["prompts"]["instructions"][level]
