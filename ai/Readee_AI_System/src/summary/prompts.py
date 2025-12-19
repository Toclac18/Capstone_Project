from ..config import BASE_DIR
import yaml

CFG = yaml.safe_load(
    (BASE_DIR / "src" / "common" / "config.yaml").read_text(encoding="utf-8")
)


def system_prompt() -> str:
    return CFG["prompts"]["system"]


def instruction_for(level: str) -> str:
    return CFG["prompts"]["instructions"][level]


