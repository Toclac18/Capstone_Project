import json
from typing import Any, Dict, List

from .settings import HIST_PATH


def load_history() -> List[Dict[str, Any]]:
    if not HIST_PATH.exists():
        return []
    try:
        data = json.loads(HIST_PATH.read_text(encoding="utf-8"))
        if isinstance(data, list):
            return data
        return []
    except Exception:
        return []


def append_history(entry: Dict[str, Any]) -> None:
    hist = load_history()
    hist.append(entry)
    try:
        HIST_PATH.write_text(
            json.dumps(hist, ensure_ascii=False, indent=2), encoding="utf-8"
        )
    except Exception:
        # Không để lỗi history làm hỏng API
        pass


