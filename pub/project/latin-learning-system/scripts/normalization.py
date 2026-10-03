"""Profile-driven answer normalization (M4 tooling, standard library only)."""
from __future__ import annotations

import json
import unicodedata
from pathlib import Path
from typing import Any

PROJECT_ROOT = Path(__file__).resolve().parents[1]
PROFILE_PATH = PROJECT_ROOT / "standards" / "normalization-profiles.json"


def load_profiles(path: Path = PROFILE_PATH) -> dict[str, dict[str, Any]]:
    data = json.loads(path.read_text(encoding="utf-8"))
    return {profile["id"]: profile for profile in data["profiles"]}


def _remove_nonscored_punctuation(value: str) -> str:
    return "".join(ch for ch in value if not unicodedata.category(ch).startswith("P"))


def _fold_macrons(value: str) -> str:
    decomposed = unicodedata.normalize("NFD", value)
    return unicodedata.normalize(
        "NFC", "".join(ch for ch in decomposed if ch != "\u0304")
    )


def normalize(value: Any, profile_id: str, profiles: dict[str, dict[str, Any]] | None = None) -> Any:
    """Return a comparison value. Never persist this as canonical content."""
    profiles = profiles or load_profiles()
    if profile_id not in profiles:
        raise ValueError(f"unknown normalization profile: {profile_id}")
    profile = profiles[profile_id]
    if profile["input_kind"] == "structured":
        if not isinstance(value, dict):
            raise TypeError("structured-features requires an object")
        return _normalize_structured(value)
    if not isinstance(value, str):
        raise TypeError(f"{profile_id} requires text")

    result = value
    for step in profile["ordered_steps"]:
        if step == "unicode-nfc":
            result = unicodedata.normalize("NFC", result)
        elif step == "trim-outer-space":
            result = result.strip()
        elif step == "collapse-space":
            result = " ".join(result.split())
        elif step == "case-fold":
            result = result.casefold()
        elif step == "filter-nonscored-punctuation":
            result = _remove_nonscored_punctuation(result)
        elif step == "fold-macrons":
            result = _fold_macrons(result)
        elif step == "fold-i-j":
            result = result.replace("j", "i").replace("J", "I")
        elif step == "fold-u-v":
            result = result.replace("v", "u").replace("V", "U")
        elif step in {"preserve-macrons", "preserve-endings"}:
            pass
        else:
            raise ValueError(f"unsupported normalization step: {step}")
    return result


def _normalize_structured(value: Any) -> Any:
    if isinstance(value, dict):
        return {key: _normalize_structured(value[key]) for key in sorted(value)}
    if isinstance(value, list):
        return [_normalize_structured(item) for item in value]
    if isinstance(value, str):
        return unicodedata.normalize("NFC", value).strip().casefold()
    if isinstance(value, (bool, int, float)) or value is None:
        return value
    raise TypeError(f"unsupported structured value: {type(value).__name__}")


def comparison_key(value: Any, profile_id: str, profiles: dict[str, dict[str, Any]] | None = None) -> str:
    normalized = normalize(value, profile_id, profiles)
    if isinstance(normalized, str):
        return normalized
    return json.dumps(normalized, ensure_ascii=False, sort_keys=True, separators=(",", ":"))

