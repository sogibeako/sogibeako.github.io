"""Build the compact browser database from the Unicode 17.0 UCD text files."""

from __future__ import annotations

import json
import re
import sys
from collections import Counter
from pathlib import Path

CATEGORIES = [
    "Lu", "Ll", "Lt", "Lm", "Lo", "Mn", "Mc", "Me", "Nd", "Nl", "No",
    "Pc", "Pd", "Ps", "Pe", "Pi", "Pf", "Po", "Sm", "Sc", "Sk", "So",
    "Zs", "Zl", "Zp", "Cc", "Cf", "Cs", "Co", "Cn",
]


def parse_unicode_data(path: Path) -> list[list[int | str]]:
    result: list[list[int | str]] = []
    pending: tuple[int, str, str] | None = None
    for line in path.read_text(encoding="utf-8").splitlines():
        fields = line.split(";")
        cp, name, category = int(fields[0], 16), fields[1], fields[2]
        if name.endswith(", First>"):
            label = name[1:-8]
            pending = (cp, category, range_kind(label))
        elif name.endswith(", Last>") and pending:
            start, range_category, label = pending
            result.append([start, range_category, label, cp])
            pending = None
        else:
            result.append([cp, category, name])
    return result


def range_kind(label: str) -> str:
    if label.startswith("CJK Ideograph"):
        return "CJK Ideograph"
    if label.startswith("CJK Compatibility Ideograph"):
        return "CJK Compatibility Ideograph"
    if label.startswith("Tangut Ideograph"):
        return "Tangut Ideograph"
    if label.startswith("Khitan Small Script Character"):
        return "Khitan Small Script Character"
    if label.startswith("Nushu Character"):
        return "Nushu Character"
    if label.startswith("Hangul Syllable"):
        return "Hangul Syllable"
    return label


def parse_ranges(path: Path) -> list[list[int | str]]:
    result: list[list[int | str]] = []
    pattern = re.compile(r"^([0-9A-F]+)(?:\.\.([0-9A-F]+))?\s*;\s*([^#]+)")
    for line in path.read_text(encoding="utf-8").splitlines():
        match = pattern.match(line)
        if not match:
            continue
        start = int(match.group(1), 16)
        end = int(match.group(2) or match.group(1), 16)
        result.append([start, end, match.group(3).strip().replace("_", " ")])
    return result


def main() -> None:
    if len(sys.argv) != 5:
        raise SystemExit("usage: build_unicode_data.py UnicodeData.txt Blocks.txt Scripts.txt output.json")
    characters = parse_unicode_data(Path(sys.argv[1]))
    token_counts = Counter(token for row in characters for token in str(row[2]).split(" "))
    name_tokens = [token for token, _ in token_counts.most_common()]
    token_ids = {token: index for index, token in enumerate(name_tokens)}
    previous = 0
    compact_characters = []
    for row in characters:
        start, category, name, *range_end = row
        encoded_name = ".".join(base36(token_ids[token]) for token in str(name).split(" "))
        compact = [start - previous, CATEGORIES.index(category), encoded_name]
        if range_end:
            compact.append(range_end[0] - start)
        compact_characters.append(compact)
        previous = start
    character_chunks = [compact_characters[i:i + 8000] for i in range(0, len(compact_characters), 8000)]
    character_files = [f"unicode-characters-{index + 1}.json" for index in range(len(character_chunks))]
    data = {
        "version": "17.0.0",
        "categories": CATEGORIES,
        "nameFile": "unicode-names.json",
        "characterFiles": character_files,
        "blocks": parse_ranges(Path(sys.argv[2])),
        "scripts": parse_ranges(Path(sys.argv[3])),
    }
    output_path = Path(sys.argv[4])
    output_path.write_text(
        json.dumps(data, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )
    output_path.with_name("unicode-names.json").write_text(
        json.dumps("|".join(name_tokens), ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )
    output_path.with_name("unicode-characters.json").unlink(missing_ok=True)
    for filename, chunk in zip(character_files, character_chunks):
        output_path.with_name(filename).write_text(
            json.dumps(chunk, ensure_ascii=False, separators=(",", ":")),
            encoding="utf-8",
        )


def base36(value: int) -> str:
    digits = "0123456789abcdefghijklmnopqrstuvwxyz"
    if value == 0:
        return "0"
    result = ""
    while value:
        value, remainder = divmod(value, 36)
        result = digits[remainder] + result
    return result


if __name__ == "__main__":
    main()
