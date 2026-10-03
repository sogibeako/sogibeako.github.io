"""Deterministic, file:// compatible M4 demo build."""
from __future__ import annotations

import argparse
import hashlib
import html
import json
import re
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DIST = (ROOT / "dist").resolve()
SRC = ROOT / "drills" / "src"
MANIFEST_NAME = ".build-manifest.json"


def ensure_output(value: str) -> Path:
    output = (ROOT / value).resolve()
    if output != DIST and DIST not in output.parents:
        raise ValueError("output must resolve to dist/ or one of its descendants")
    return output


def safe_embedded_json(path: Path) -> str:
    value = json.loads(path.read_text(encoding="utf-8"))
    return safe_embedded_value(value)


def safe_embedded_value(value: object) -> str:
    text = json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    return text.replace("&", "\\u0026").replace("<", "\\u003c").replace(">", "\\u003e").replace("\u2028", "\\u2028").replace("\u2029", "\\u2029")


def inline_markdown(text: str) -> str:
    escaped = html.escape(text)
    return re.sub(r"`([^`]+)`", r"<code>\1</code>", escaped)


def render_markdown(source: str, section_id: str) -> str:
    lines = source.splitlines()
    output = [f'<article id="{section_id}">']
    paragraph: list[str] = []
    list_open = False
    table_rows: list[list[str]] = []

    def flush_paragraph() -> None:
        if paragraph:
            output.append("<p>" + inline_markdown(" ".join(paragraph)) + "</p>")
            paragraph.clear()

    def flush_list() -> None:
        nonlocal list_open
        if list_open:
            output.append("</ul>")
            list_open = False

    def flush_table() -> None:
        if not table_rows:
            return
        rows = list(table_rows); table_rows.clear()
        if len(rows) > 1 and all(set(cell.strip()) <= {"-", ":"} for cell in rows[1]):
            rows.pop(1)
        output.append("<table>")
        for row_index, row in enumerate(rows):
            tag = "th" if row_index == 0 else "td"
            output.append("<tr>" + "".join(f"<{tag}>" + inline_markdown(cell.strip()) + f"</{tag}>" for cell in row) + "</tr>")
        output.append("</table>")

    for line in lines:
        stripped = line.strip()
        if stripped.startswith("|") and stripped.endswith("|"):
            flush_paragraph(); flush_list(); table_rows.append(stripped.strip("|").split("|")); continue
        flush_table()
        if not stripped:
            flush_paragraph(); flush_list(); continue
        if stripped.startswith("#"):
            flush_paragraph(); flush_list(); level = min(len(stripped) - len(stripped.lstrip("#")), 3); title = stripped[level:].strip(); output.append(f"<h{level}>" + inline_markdown(title) + f"</h{level}>"); continue
        if stripped.startswith("- "):
            flush_paragraph()
            if not list_open: output.append("<ul>"); list_open = True
            output.append("<li>" + inline_markdown(stripped[2:]) + "</li>"); continue
        if stripped.startswith("> "):
            flush_paragraph(); flush_list(); output.append("<aside class=\"notice\"><p>" + inline_markdown(stripped[2:]) + "</p></aside>"); continue
        paragraph.append(stripped)
    flush_paragraph(); flush_list(); flush_table(); output.append('<p class="drill-only"><a class="button-link" href="drill.html">この小節を練習する</a></p></article>')
    return "\n".join(output)


def production_drill_data() -> dict[str, object]:
    source = json.loads((ROOT / "drills" / "data" / "unit-01.json").read_text(encoding="utf-8"))
    records = {item["id"]: item for item in source["exercises"]}
    units = []
    for section in source["sections"]:
        questions = []
        for qid in section["exercise_ids"]:
            item = records[qid]
            feedback = item["feedback"]
            correct = next((entry["message"] for entry in feedback if entry["condition"] in {"correct", "self-check"}), "確認しました。")
            incorrect = next((entry["message"] for entry in feedback if entry["condition"] == "incorrect"), next((entry["message"] for entry in feedback if entry["condition"].startswith("answer:")), "説明を確認してください。"))
            question = {"id":item["id"], "type":item["exercise_type"], "prompt":item["prompt"], "accepted_answers":item["accepted_answers"], "rejected_answers":item["rejected_answers"], "normalization_profile_id":item["normalization_profile_id"], "feedback":{"correct":correct,"incorrect":incorrect}}
            if item.get("choices"):
                question["choices"] = [{"id":choice["choice_id"],"text":choice["text"]} for choice in item["choices"]]
            if item["exercise_type"] == "self-assessed-pronunciation":
                question["checklist"] = item["stimulus"].get("checklist", [])
                question["model_note"] = item["stimulus"].get("model_note", "音声による自動判定は行いません。")
            questions.append(question)
        units.append({"id":section["id"],"title":section["title"],"questions":questions})
    return {"schema_version":source["schema_version"],"content_version":source["content_version"],"production_candidate":True,"notice":source["notice"],"storage_key":source["storage_key"],"units":units}


def validate(fail_on_warning: bool) -> None:
    command = [sys.executable, str(ROOT / "scripts" / "validate.py"), "all", "--format", "text"]
    if fail_on_warning:
        command.append("--fail-on-warning")
    result = subprocess.run(command, cwd=ROOT)
    if result.returncode:
        raise RuntimeError(f"validation stopped the build (exit {result.returncode})")


def clean_generated(output: Path) -> None:
    manifest_path = output / MANIFEST_NAME
    if not manifest_path.exists():
        return
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    for relative in manifest.get("generated_files", []):
        target = (output / relative).resolve()
        if output not in target.parents:
            raise ValueError(f"unsafe generated path in manifest: {relative}")
        if target.is_file():
            target.unlink()
    for directory in sorted((p for p in output.rglob("*") if p.is_dir()), reverse=True):
        if output in directory.parents and not any(directory.iterdir()):
            directory.rmdir()
    manifest_path.unlink(missing_ok=True)


def write_file(output: Path, relative: str, content: str) -> None:
    path = output / relative
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content.replace("\r\n", "\n"), encoding="utf-8", newline="\n")


def build(output: Path, clean: bool, fail_on_warning: bool) -> None:
    validate(fail_on_warning)
    output.mkdir(parents=True, exist_ok=True)
    if clean:
        clean_generated(output)
    template = (SRC / "index.html").read_text(encoding="utf-8")
    replacements = {
        "__NORMALIZATION_PROFILES__": safe_embedded_json(ROOT / "standards" / "normalization-profiles.json"),
        "__NORMALIZATION_VECTORS__": safe_embedded_json(ROOT / "tests" / "normalization-vectors.json"),
        "__DRILL_DATA__": safe_embedded_json(ROOT / "drills" / "data" / "demo.json"),
    }
    for marker, value in replacements.items():
        if template.count(marker) != 1:
            raise ValueError(f"template marker must occur exactly once: {marker}")
        template = template.replace(marker, value)
    app = (SRC / "normalization.js").read_text(encoding="utf-8") + "\n" + (SRC / "app.js").read_text(encoding="utf-8")
    unit_template = (SRC / "unit.html").read_text(encoding="utf-8")
    unit_replacements = {"__NORMALIZATION_PROFILES__":safe_embedded_json(ROOT / "standards" / "normalization-profiles.json"),"__NORMALIZATION_VECTORS__":safe_embedded_json(ROOT / "tests" / "normalization-vectors.json"),"__DRILL_DATA__":safe_embedded_value(production_drill_data())}
    for marker, value in unit_replacements.items():
        if unit_template.count(marker) != 1: raise ValueError(f"unit template marker must occur exactly once: {marker}")
        unit_template = unit_template.replace(marker, value)
    articles = "\n".join(render_markdown((ROOT / "lessons" / "unit-01" / name).read_text(encoding="utf-8"), section_id) for name, section_id in (("01a.md","unit-01a"),("01b.md","unit-01b"),("01c.md","unit-01c")))
    textbook = f'''<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>第1単元 ラテン語の文字と音</title><link rel="stylesheet" href="../assets/styles.css"></head><body><a class="skip-link" href="#unit-01a">本文へ移動</a><header><h1>第1単元 ラテン語の文字と音</h1><p>人間レビュー候補（編集承認・専門家確認前）</p><nav aria-label="小節"><ul><li><a href="#unit-01a">1A</a></li><li><a href="#unit-01b">1B</a></li><li><a href="#unit-01c">1C</a></li><li><a href="drill.html">練習ドリル</a></li></ul></nav></header><main>{articles}<section id="unit-check"><h2>第1単元の確認</h2><p>1A～1Cの累積問題は練習ドリルの「第1単元 累積確認」にあります。</p><a class="button-link" href="drill.html">単元確認へ進む</a></section></main></body></html>'''
    outputs = {"index.html":template, "assets/app.js":app, "assets/styles.css":(SRC/"styles.css").read_text(encoding="utf-8"), "unit-01/index.html":textbook, "unit-01/drill.html":unit_template}
    for relative, content in outputs.items():
        write_file(output, relative, content)
    manifest = {"schema_version":"1.0.0", "generated_files":sorted(outputs), "sha256":{name:hashlib.sha256((output/name).read_bytes()).hexdigest() for name in sorted(outputs)}}
    write_file(output, MANIFEST_NAME, json.dumps(manifest, ensure_ascii=False, indent=2, sort_keys=True) + "\n")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Build the static M4 drill demo")
    parser.add_argument("--clean", action="store_true", help="remove only files listed in dist/.build-manifest.json")
    parser.add_argument("--output", default="dist")
    parser.add_argument("--fail-on-warning", action="store_true")
    args = parser.parse_args(argv)
    try:
        build(ensure_output(args.output), args.clean, args.fail_on_warning)
        print(f"Built deterministic static files in {ensure_output(args.output).relative_to(ROOT)}")
        return 0
    except (OSError, ValueError, RuntimeError, json.JSONDecodeError) as exc:
        print(f"BUILD_ERROR: {exc}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
