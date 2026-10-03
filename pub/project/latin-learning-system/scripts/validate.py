"""M4 validation CLI. No third-party Python packages are required."""
from __future__ import annotations

import argparse
from datetime import datetime
import json
import shutil
import subprocess
import sys
import tempfile
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any, Iterable

from normalization import comparison_key, load_profiles

ROOT = Path(__file__).resolve().parents[1]
SCHEMAS = ROOT / "schemas"
FIXTURES = ROOT / "tests" / "fixtures"
COMMANDS = ("all", "schema", "references", "dag", "curriculum", "exercises", "reviews", "normalization", "fixtures")


@dataclass
class Diagnostic:
    severity: str
    code: str
    message: str
    file: str = ""
    record_id: str = ""
    field_path: str = ""
    related_id: str = ""
    suggested_action: str = ""


def diag(code: str, message: str, *, severity: str = "error", file: Path | str = "", record_id: str = "", field_path: str = "", related_id: str = "", action: str = "") -> Diagnostic:
    try:
        shown = str(Path(file).resolve().relative_to(ROOT)) if file else ""
    except ValueError:
        shown = str(file)
    return Diagnostic(severity, code, message, shown.replace("\\", "/"), record_id, field_path, related_id, action)


def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def project_data() -> dict[str, Any]:
    skills = read_json(ROOT / "curriculum" / "latin-skill-map.yml")
    curriculum = read_json(ROOT / "curriculum" / "curriculum-map.yml")
    bibliography = read_json(ROOT / "sources" / "bibliography.json")
    units = {p.parent.name: read_json(p) for p in sorted((ROOT / "lessons").glob("unit-*/unit-spec.yml"))}
    vocab = {}
    for path in sorted((ROOT / "vocabulary").glob("**/*.json")) + [FIXTURES / "valid" / "vocabulary.json"]:
        if path.name == "README.md":
            continue
        try:
            item = read_json(path)
            vocab[item.get("id") or item.get("lemma_id")] = item
        except (json.JSONDecodeError, AttributeError):
            pass
    profiles = read_json(ROOT / "standards" / "normalization-profiles.json")
    schemas = {read_json(path).get("$id"): path for path in sorted(SCHEMAS.glob("*.schema.json"))}
    return {
        "skill_map": skills,
        "curriculum": curriculum,
        "bibliography": bibliography,
        "unit_specs": units,
        "vocabulary": vocab,
        "normalization_profiles": {profile["id"]: profile for profile in profiles["profiles"]},
        "schemas": schemas,
    }


def find_pwsh() -> str | None:
    return shutil.which("pwsh")


def schema_validate(path: Path, schema_name: str) -> tuple[bool, str]:
    pwsh = find_pwsh()
    if not pwsh:
        raise RuntimeError("PowerShell 7 Test-Json is unavailable")
    command = (
        "$ErrorActionPreference='Stop';"
        f"$d=Get-Content -Raw -LiteralPath '{str(path.resolve()).replace("'", "''")}';"
        f"$ok=$d | Test-Json -SchemaFile '{schema_name}' -ErrorAction SilentlyContinue -ErrorVariable e;"
        "if($ok){'VALID'}else{'INVALID';$e|ForEach-Object{$_.Exception.Message}}"
    )
    result = subprocess.run([pwsh, "-NoProfile", "-Command", command], cwd=SCHEMAS, text=True, encoding="utf-8", errors="replace", capture_output=True)
    output = (result.stdout + "\n" + result.stderr).strip()
    return output.startswith("VALID") and result.returncode == 0, output


def schema_validate_value(value: Any, schema_name: str) -> tuple[bool, str]:
    """Validate an embedded record without making the bundle another source of truth."""
    with tempfile.NamedTemporaryFile(mode="w", suffix=".json", encoding="utf-8", delete=False, dir=ROOT / "tests") as handle:
        json.dump(value, handle, ensure_ascii=False)
        temporary = Path(handle.name)
    try:
        return schema_validate(temporary, schema_name)
    finally:
        temporary.unlink(missing_ok=True)


def check_schema(paths: Iterable[Path] | None = None) -> list[Diagnostic]:
    out: list[Diagnostic] = []
    schema_files = sorted(SCHEMAS.glob("*.schema.json"))
    ids: dict[str, Path] = {}
    for path in schema_files:
        try:
            value = read_json(path)
        except json.JSONDecodeError as exc:
            out.append(diag("SCHEMA_JSON_INVALID", str(exc), file=path))
            continue
        schema_id = value.get("$id")
        if not schema_id:
            out.append(diag("SCHEMA_ID_MISSING", "$id is required", file=path, field_path="$id"))
        elif schema_id in ids:
            out.append(diag("SCHEMA_ID_DUPLICATE", f"duplicate $id: {schema_id}", file=path, related_id=schema_id))
        else:
            ids[schema_id] = path
        if value.get("$schema") != "http://json-schema.org/draft-07/schema#":
            out.append(diag("SCHEMA_DRAFT_UNEXPECTED", "Schema must use Draft-07", file=path, field_path="$schema"))
        for ref in collect_refs(value):
            if ref.startswith("#"):
                target, pointer = value, ref[1:]
            else:
                name, _, pointer = ref.partition("#")
                target_path = SCHEMAS / name
                if not target_path.exists():
                    out.append(diag("SCHEMA_REF_UNRESOLVED", f"missing schema file: {name}", file=path, related_id=ref))
                    continue
                target = read_json(target_path)
            if pointer and not resolve_pointer(target, pointer):
                out.append(diag("SCHEMA_REF_UNRESOLVED", f"unresolved JSON Pointer: {ref}", file=path, related_id=ref))
    if paths:
        for path in paths:
            try:
                read_json(path)
            except json.JSONDecodeError as exc:
                out.append(diag("DATA_JSON_INVALID", str(exc), file=path))
    m2_targets = [
        (ROOT / "curriculum" / "latin-skill-map.yml", "skill-map.schema.json"),
        (ROOT / "curriculum" / "curriculum-map.yml", "curriculum-map.schema.json"),
        *[(path, "unit-spec.schema.json") for path in sorted((ROOT / "lessons").glob("unit-*/unit-spec.yml"))],
    ]
    for path, schema_name in m2_targets:
        try:
            valid, details = schema_validate(path, schema_name)
        except RuntimeError as exc:
            out.append(diag("ENV_SCHEMA_VALIDATOR_UNAVAILABLE", str(exc), file=path))
            break
        if not valid:
            out.append(diag("SCHEMA_VALIDATION_FAILED", details[-600:], file=path, related_id=schema_name))
    production_targets = [
        *[(path, "lesson.schema.json") for path in sorted((ROOT / "lessons" / "unit-01" / "metadata").glob("*.json"))],
        *[(path, "example.schema.json") for path in sorted((ROOT / "lessons" / "unit-01" / "examples").glob("*.json"))],
        *[(path, "vocabulary.schema.json") for path in sorted((ROOT / "vocabulary" / "unit-01").glob("*.json"))],
    ]
    for path, schema_name in production_targets:
        valid, details = schema_validate(path, schema_name)
        if not valid:
            out.append(diag("SCHEMA_VALIDATION_FAILED", details[-600:], file=path, related_id=schema_name))
    production_bundle = ROOT / "drills" / "data" / "unit-01.json"
    if production_bundle.exists():
        for item in read_json(production_bundle).get("exercises", []):
            valid, details = schema_validate_value(item, "exercise.schema.json")
            if not valid:
                out.append(diag("SCHEMA_VALIDATION_FAILED", details[-600:], file=production_bundle, record_id=item.get("id", ""), related_id="exercise.schema.json"))
    manifest = read_json(FIXTURES / "manifest.json")
    valid_by_schema = {
        case["schema"]: FIXTURES / case["path"]
        for case in manifest["cases"]
        if case["layer"] == "json-schema" and case["expected"] == "valid"
    }
    for path in schema_files:
        schema_name = path.name
        fixture = valid_by_schema.get(schema_name)
        if fixture is None:
            out.append(diag("SCHEMA_COMPILE_PROBE_MISSING", "no valid fixture compiles this schema", file=path, related_id=schema_name))
            continue
        valid, details = schema_validate(fixture, schema_name)
        if not valid:
            out.append(diag("SCHEMA_COMPILE_FAILED", details[-600:], file=path, related_id=fixture.name))
    return out


def collect_refs(value: Any) -> list[str]:
    if isinstance(value, dict):
        return ([value["$ref"]] if isinstance(value.get("$ref"), str) else []) + sum((collect_refs(v) for v in value.values()), [])
    if isinstance(value, list):
        return sum((collect_refs(v) for v in value), [])
    return []


def resolve_pointer(value: Any, pointer: str) -> bool:
    current = value
    for part in pointer.lstrip("/").split("/") if pointer else []:
        part = part.replace("~1", "/").replace("~0", "~")
        if not isinstance(current, dict) or part not in current:
            return False
        current = current[part]
    return True


def indexes(data: dict[str, Any]) -> tuple[dict[str, Any], dict[str, Any], set[str], dict[str, Any]]:
    skills = {s["id"]: s for s in data["skill_map"]["skills"]}
    curriculum = data["curriculum"]
    units = {u["unit_id"]: u for u in curriculum["units"] + curriculum["subunits"]}
    bibliography = data["bibliography"]
    records = bibliography.get("records", bibliography.get("sources", []))
    source_ids = {r.get("id") or r.get("bibliography_id") for r in records}
    return skills, units, source_ids, data["vocabulary"]


def _skill_refs(item: dict[str, Any], field: str) -> list[str]:
    values = item.get(field, [])
    if field == "skills":
        return [value.get("skill_id", "") if isinstance(value, dict) else value for value in values]
    return values


def _typed_registry(data: dict[str, Any]) -> dict[str, str]:
    skills, units, source_ids, vocab = indexes(data)
    registry: dict[str, str] = {}
    for kind, values in (
        ("skill", skills), ("unit", units), ("source", source_ids),
        ("vocabulary", vocab), ("normalization-profile", data["normalization_profiles"]),
        ("schema", data["schemas"]),
    ):
        for value in values:
            if value in registry and registry[value] != kind:
                registry[value] = "ambiguous"
            else:
                registry[value] = kind
    return registry


def check_references(data: dict[str, Any], record: Any | None = None, file: Path | str = "") -> list[Diagnostic]:
    out: list[Diagnostic] = []
    skills, units, source_ids, vocab = indexes(data)
    registry = _typed_registry(data)
    if record is not None:
        records = [(record, file)]
    else:
        records = [(s, ROOT / "curriculum" / "latin-skill-map.yml") for s in skills.values()]
        records += [(u, ROOT / "curriculum" / "curriculum-map.yml") for u in data["curriculum"]["units"] + data["curriculum"]["subunits"]]
        for spec_name, spec in data["unit_specs"].items():
            records += [(subunit, ROOT / "lessons" / spec_name / "unit-spec.yml") for subunit in spec["subunits"]]
        records += [(value, ROOT / "vocabulary" / "*.json") for value in vocab.values() if not str(value.get("id", "")).startswith("lex-fixture-")]
    for item, item_file in records:
        rid = item.get("id", item.get("unit_id", item.get("subunit_id", ""))) if isinstance(item, dict) else ""
        for field in ("skills", "prerequisites", "prerequisite_skills", "required_reading_skills", "new_skills", "review_skills", "requires", "recommended_before", "co_requisites"):
            refs = _skill_refs(item, field)
            if len(refs) != len(set(refs)):
                out.append(diag("REF_DUPLICATE", f"duplicate skill reference in {field}", file=item_file, record_id=rid, field_path=field))
            for ref in refs:
                if ref not in skills:
                    code = "REF_WRONG_TARGET_TYPE" if ref in registry else "REF_UNKNOWN_SKILL"
                    out.append(diag(code, f"skill reference resolves as {registry.get(ref, 'missing')}: {ref}", file=item_file, record_id=rid, field_path=field, related_id=ref, action="Add the skill or correct the reference."))
        declared_vocabulary = list(item.get("vocabulary", []))
        token_vocabulary = [token["lemma_id"] for token in item.get("tokens", []) if isinstance(token, dict) and token.get("lemma_id")]
        if len(declared_vocabulary) != len(set(declared_vocabulary)):
            out.append(diag("REF_DUPLICATE", "duplicate declared vocabulary reference", file=item_file, record_id=rid, field_path="vocabulary"))
        vocabulary_refs = sorted(set(declared_vocabulary + token_vocabulary))
        for ref in vocabulary_refs:
            if ref not in vocab:
                code = "REF_WRONG_TARGET_TYPE" if ref in registry else "REF_UNKNOWN_VOCABULARY"
                out.append(diag(code, f"vocabulary reference resolves as {registry.get(ref, 'missing')}: {ref}", file=item_file, record_id=rid, field_path="vocabulary", related_id=ref))
        for ref in item.get("source_refs", []):
            source_id = ref.get("bibliography_id") if isinstance(ref, dict) else ref
            if source_id and source_id not in source_ids and not str(source_id).startswith(("design:", "principle:")):
                code = "REF_WRONG_TARGET_TYPE" if source_id in registry else "REF_UNKNOWN_SOURCE"
                out.append(diag(code, f"source reference resolves as {registry.get(source_id, 'missing')}: {source_id}", file=item_file, record_id=rid, field_path="source_refs", related_id=str(source_id)))
        for ref in item.get("evidence_refs", []):
            if str(ref).startswith("src-") and ref not in source_ids:
                out.append(diag("REF_UNKNOWN_SOURCE", f"unknown evidence source: {ref}", file=item_file, record_id=rid, field_path="evidence_refs", related_id=ref))
        unit_refs = []
        for field_name in ("unit_id", "parent_unit", "introduced_in", "available_from"):
            if item.get(field_name): unit_refs.append((field_name, item[field_name]))
        unit_refs += [("next_units", ref) for ref in item.get("next_units", [])]
        for field_name, unit_id in unit_refs:
            if unit_id not in units:
                code = "REF_WRONG_TARGET_TYPE" if unit_id in registry else "REF_UNKNOWN_UNIT"
                out.append(diag(code, f"unit reference resolves as {registry.get(unit_id, 'missing')}: {unit_id}", file=item_file, record_id=rid, field_path=field_name, related_id=unit_id))
        profile_id = item.get("normalization_profile_id")
        if profile_id and profile_id not in data["normalization_profiles"]:
            code = "REF_WRONG_TARGET_TYPE" if profile_id in registry else "REF_UNKNOWN_NORMALIZATION_PROFILE"
            out.append(diag(code, f"normalization profile resolves as {registry.get(profile_id, 'missing')}: {profile_id}", file=item_file, record_id=rid, field_path="normalization_profile_id", related_id=profile_id))
        for feedback_index, feedback in enumerate(item.get("feedback", [])):
            for ref in feedback.get("review_skills", []):
                if ref not in skills:
                    out.append(diag("REF_UNKNOWN_SKILL", f"unknown feedback skill: {ref}", file=item_file, record_id=rid, field_path=f"feedback[{feedback_index}].review_skills", related_id=ref))
    return out


def check_dag(data: dict[str, Any], skill_map: dict[str, Any] | None = None, file: Path | str = "curriculum/latin-skill-map.yml") -> list[Diagnostic]:
    out: list[Diagnostic] = []
    source = skill_map or data["skill_map"]
    skills = {s["id"]: s for s in source["skills"]}
    for sid, skill in skills.items():
        for relation in ("requires", "recommended_before", "co_requisites"):
            refs = skill.get(relation, [])
            for ref in refs:
                if ref == sid:
                    out.append(diag("DAG_SELF_REFERENCE", f"{relation} self-reference", file=file, record_id=sid, field_path=relation, related_id=ref))
                elif ref not in skills:
                    out.append(diag("DAG_UNKNOWN_SKILL", f"unknown {relation} target: {ref}", file=file, record_id=sid, field_path=relation, related_id=ref))
            if len(refs) != len(set(refs)):
                out.append(diag("DAG_DUPLICATE_EDGE", f"duplicate {relation} edge", file=file, record_id=sid, field_path=relation))
        for ref in skill.get("co_requisites", []):
            if ref in skills and sid not in skills[ref].get("co_requisites", []):
                out.append(diag("DAG_COREQUISITE_ASYMMETRIC", f"co-requisite is not symmetric with {ref}", file=file, record_id=sid, field_path="co_requisites", related_id=ref))
        for ref in set(skill.get("requires", [])) & set(skill.get("recommended_before", [])):
            out.append(diag("DAG_RELATION_CONFLICT", f"same target is both required and recommended: {ref}", severity="warning", file=file, record_id=sid, related_id=ref))
        for ref in skill.get("requires", []):
            if skill.get("level") != "boundary" and skills.get(ref, {}).get("level") == "boundary":
                out.append(diag("DAG_STRONG_DEPENDENCY_ON_BOUNDARY", f"non-boundary skill strongly depends on future boundary: {ref}", file=file, record_id=sid, field_path="requires", related_id=ref))
        degree = len(skill.get("requires", [])) + sum(sid in other.get("requires", []) for other in skills.values())
        if degree == 0:
            out.append(diag("DAG_ISOLATED_SKILL", "skill has no requires edge in either direction", severity="warning", file=file, record_id=sid))
    state: dict[str, int] = {}
    stack: list[str] = []
    def visit(node: str) -> None:
        state[node] = 1; stack.append(node)
        for nxt in skills[node].get("requires", []):
            if nxt not in skills: continue
            if state.get(nxt, 0) == 0: visit(nxt)
            elif state.get(nxt) == 1:
                cycle = stack[stack.index(nxt):] + [nxt]
                out.append(diag("DAG_REQUIRES_CYCLE", "requires cycle: " + " -> ".join(cycle), file=file, record_id=node, related_id=nxt))
        stack.pop(); state[node] = 2
    for sid in skills:
        if not state.get(sid): visit(sid)
    return out


def unit_order(curriculum: dict[str, Any]) -> dict[str, int]:
    return {u["unit_id"]: i for i, u in enumerate(curriculum["subunits"])}


def check_curriculum(data: dict[str, Any], curriculum: dict[str, Any] | None = None, unit_specs: dict[str, Any] | None = None, file: Path | str = "curriculum/curriculum-map.yml") -> list[Diagnostic]:
    out: list[Diagnostic] = []
    canonical_run = curriculum is None and unit_specs is None
    c = curriculum or data["curriculum"]
    specs = unit_specs if unit_specs is not None else data["unit_specs"]
    skill_index = {s["id"]: s for s in data["skill_map"]["skills"]}
    order = unit_order(c); canonical_order = unit_order(data["curriculum"]); subunits = {u["unit_id"]: u for u in c["subunits"]}
    introduced: dict[str, str] = {}
    for u in c["subunits"]:
        uid = u["unit_id"]
        phase_rank = {"introduce":0,"guided-practice":1,"independent-practice":2,"review":2,"cumulative-use":3,"assess":4}
        for treatment in u.get("skill_treatments", []):
            phases = treatment.get("learning_phases", [])
            ranks = [phase_rank.get(phase, -1) for phase in phases]
            if -1 in ranks or ranks != sorted(ranks):
                out.append(diag("CURRICULUM_LEARNING_PHASE_ORDER", f"invalid learning phase order: {phases}", file=file, record_id=uid, field_path="skill_treatments"))
        for sid in u["new_skills"]:
            if sid in introduced:
                out.append(diag("CURRICULUM_DUPLICATE_INTRODUCTION", f"skill introduced again; first at {introduced[sid]}", file=file, record_id=uid, field_path="new_skills", related_id=sid))
            introduced[sid] = uid
            declared = skill_index.get(sid, {}).get("introduced_in")
            if declared != uid:
                out.append(diag("CURRICULUM_INTRODUCTION_MISMATCH", f"skill map introduced_in is {declared}", file=file, record_id=uid, field_path="new_skills", related_id=sid))
        for sid in u["prerequisites"]:
            intro = skill_index.get(sid, {}).get("introduced_in")
            if intro in order and order[intro] >= order[uid]:
                out.append(diag("CURRICULUM_SKILL_BEFORE_PREREQUISITE", f"prerequisite is not introduced earlier: {sid}", file=file, record_id=uid, field_path="prerequisites", related_id=sid))
        for sid in u["review_skills"]:
            intro = skill_index.get(sid, {}).get("introduced_in")
            active_order = order if intro in order and uid in order else canonical_order
            if intro in active_order and uid in active_order and active_order[intro] >= active_order[uid]:
                out.append(diag("CURRICULUM_REVIEW_BEFORE_INTRO", f"review occurs before/at introduction: {sid}", file=file, record_id=uid, field_path="review_skills", related_id=sid))
        for nxt in u["next_units"]:
            if nxt not in order:
                out.append(diag("CURRICULUM_UNKNOWN_NEXT_UNIT", f"next unit does not exist: {nxt}", file=file, record_id=uid, field_path="next_units", related_id=nxt))
            elif order[nxt] <= order[uid]:
                out.append(diag("CURRICULUM_NEXT_UNIT_ORDER", f"next unit is not later: {nxt}", file=file, record_id=uid, field_path="next_units", related_id=nxt))
        count = len(u["new_skills"]); limit = u["provisional_new_skill_limit"]
        if count > limit:
            out.append(diag("LOAD_SKILL_LIMIT_EXCEEDED", f"{count} new skills exceeds provisional limit {limit}", file=file, record_id=uid, field_path="new_skills"))
        if count >= 7:
            out.append(diag("LOAD_M3_SKILL_ERROR_THRESHOLD", f"{count} new skills reaches the M3 error threshold", file=file, record_id=uid, field_path="new_skills"))
        elif count == 6:
            code = "LOAD_2B_SIX_SKILLS" if uid == "unit-02b" else "LOAD_SIX_SKILLS_WARNING"
            out.append(diag(code, "six new skills require explicit human approval", severity="warning", file=file, record_id=uid, field_path="new_skills"))
        named_warnings = {
            "unit-03a":("LOAD_3A_CASE_NUMBER", "simultaneous nominative/accusative and singular/plural load requires human review"),
            "unit-03b":("LOAD_CONJUGATION_CLASSES", "number of conjugation classes requires human review"),
            "unit-04c":("LOAD_4C_ADJECTIVE_AGREEMENT", "adjective forms and agreement require human review"),
            "unit-05a":("LOAD_CONJUGATION_CLASSES", "number of conjugation classes requires human review"),
        }
        if uid in named_warnings:
            code, message = named_warnings[uid]
            out.append(diag(code, message, severity="warning", file=file, record_id=uid, field_path="new_skills"))
        if uid == "unit-05c":
            out.append(diag("LOAD_5C_DICTIONARY_INTRO", "first dictionary-use introduction requires human review", severity="warning", file=file, record_id=uid))
        if u["provisional_new_lexeme_limit"] == 10:
            out.append(diag("LOAD_5C_TEN_LEXEMES", "provisional new-lexeme maximum 10 requires M6 observation", severity="warning", file=file, record_id=uid, field_path="provisional_new_lexeme_limit"))
    for parent in c["units"]:
        actual = [u["unit_id"] for u in c["subunits"] if u["parent_unit"] == parent["unit_id"]]
        if actual != parent["subunit_ids"]:
            out.append(diag("CURRICULUM_PARENT_SUBUNIT_MISMATCH", "parent subunit list differs from subunits", file=file, record_id=parent["unit_id"], field_path="subunit_ids"))
    for schedule in c.get("review_schedule", []):
        intro = schedule.get("introduced_at")
        for field_name in ("guided_at", "next_reuse", "spaced_review", "cumulative_use", "exit_assessment"):
            target = schedule.get(field_name)
            if target is not None and target not in order:
                out.append(diag("CURRICULUM_REVIEW_UNKNOWN_UNIT", f"review target does not exist: {target}", file=file, record_id=schedule.get("cohort", ""), field_path=field_name, related_id=target))
            elif target is not None and intro in order and order[target] < order[intro]:
                out.append(diag("CURRICULUM_REVIEW_BEFORE_INTRO", f"{field_name} precedes introduction", file=file, record_id=schedule.get("cohort", ""), field_path=field_name, related_id=target))
    if "unit-05c" in subunits:
        cutoff = order.get("unit-05b", -1)
        for sid in ["reading.cumulative.short-prose"]:
            for req in transitive_requires(skill_index, sid):
                intro = skill_index.get(req, {}).get("introduced_in")
                if intro in order and order[intro] > cutoff:
                    out.append(diag("CURRICULUM_CUMULATIVE_READING_UNLEARNED", f"5C dependency is not introduced by 5B: {req}", file=file, record_id="unit-05c", related_id=req))
    for spec_name, spec in specs.items():
        parent_id = spec["unit_id"]
        for su in spec["subunits"]:
            uid = su["subunit_id"]
            mapped = subunits.get(uid)
            if not mapped:
                out.append(diag("UNIT_SPEC_UNKNOWN_SUBUNIT", f"subunit absent from curriculum map: {uid}", file=ROOT/"lessons"/spec_name/"unit-spec.yml", record_id=uid))
                continue
            comparisons = {"new_skills":"new_skills", "review_skills":"review_skills", "prerequisite_skills":"prerequisites"}
            for sf, cf in comparisons.items():
                if su[sf] != mapped[cf]:
                    out.append(diag("UNIT_SPEC_CURRICULUM_MISMATCH", f"{sf} differs from curriculum {cf}", file=ROOT/"lessons"/spec_name/"unit-spec.yml", record_id=uid, field_path=sf))
            if mapped["parent_unit"] != parent_id:
                out.append(diag("UNIT_SPEC_PARENT_MISMATCH", "parent unit differs", file=ROOT/"lessons"/spec_name/"unit-spec.yml", record_id=uid, related_id=parent_id))
    if canonical_run:
        out += check_preview_model(data)
    return out


def transitive_requires(skills: dict[str, Any], skill_id: str) -> set[str]:
    found: set[str] = set()
    def walk(sid: str) -> None:
        for req in skills.get(sid, {}).get("requires", []):
            if req not in found: found.add(req); walk(req)
    walk(skill_id); return found


def check_preview_model(data: dict[str, Any], skill_map: dict[str, Any] | None = None, file: Path | str = "curriculum/latin-skill-map.yml") -> list[Diagnostic]:
    out: list[Diagnostic] = []
    source = skill_map if skill_map is not None else data["skill_map"]
    skills = {skill["id"]: skill for skill in source["skills"]}
    preview_id = "syntax.predicate-adjective.preview"
    formal_ids = {"morph.adjective.declension12.basic", "morph.agreement.gender-number-case", "syntax.adjective-noun.agreement"}
    if preview_id not in skills:
        return [diag("PREVIEW_SKILL_MISSING", "2C predicate-adjective preview skill is missing", file=file, related_id=preview_id)]
    if skills[preview_id].get("introduced_in") != "unit-02c":
        out.append(diag("PREVIEW_INTRODUCTION_MISMATCH", "preview skill must be introduced in unit-02c", file=file, record_id=preview_id, field_path="introduced_in"))
    for formal_id in formal_ids:
        if formal_id in skills and skills[formal_id].get("introduced_in") != "unit-04c":
            out.append(diag("PREVIEW_FORMAL_INTRODUCTION_EARLY", f"formal adjective skill must remain at unit-04c: {formal_id}", file=file, record_id=formal_id, field_path="introduced_in"))
    dependents = [skill["id"] for skill in skills.values() if preview_id in skill.get("requires", [])]
    if dependents:
        out.append(diag("PREVIEW_REQUIRED_BY_STRONG_GRAPH", f"preview cannot be a strong prerequisite: {dependents}", file=file, record_id=preview_id, field_path="requires"))
    return out


def check_preview_example(item: dict[str, Any], file: Path | str = "") -> list[Diagnostic]:
    out: list[Diagnostic] = []
    if item.get("treatment") != "preview":
        return out
    rid = item.get("id", "")
    constraints = item.get("preview_constraints", {})
    for field in ("counts_as_acquired", "requires_form_generation", "requires_full_rule"):
        if constraints.get(field) is not False:
            out.append(diag("PREVIEW_CONSTRAINT_VIOLATION", f"preview constraint must be false: {field}", file=file, record_id=rid, field_path=f"preview_constraints.{field}"))
    skill_treatments = {entry.get("skill_id"):entry.get("treatment") for entry in item.get("skills", []) if isinstance(entry, dict)}
    preview_id = "syntax.predicate-adjective.preview"
    if skill_treatments.get(preview_id) != "preview":
        out.append(diag("PREVIEW_NOT_EXPLICIT", "2C preview must explicitly mark the preview skill", file=file, record_id=rid, field_path="skills", related_id=preview_id))
    formal = {"morph.adjective.declension12.basic", "morph.agreement.gender-number-case", "syntax.adjective-noun.agreement"}
    mixed = sorted(formal & set(skill_treatments))
    if mixed:
        out.append(diag("PREVIEW_FORMAL_SKILL_MIXED", f"preview includes formal unit-04 skill(s): {mixed}", file=file, record_id=rid, field_path="skills", related_id=mixed[0]))
    if not any(element.get("reason") == "preview" for element in item.get("unanalyzed_elements", [])):
        out.append(diag("PREVIEW_UNANALYZED_MARKER_MISSING", "preview requires an explicitly unanalyzed element", file=file, record_id=rid, field_path="unanalyzed_elements"))
    return out


def check_exercise(data: dict[str, Any], item: dict[str, Any], file: Path | str = "") -> list[Diagnostic]:
    out = check_references(data, item, file)
    skills, units, _, vocab = indexes(data); order = unit_order(data["curriculum"]); uid = item.get("unit_id", "")
    if uid in order:
        available = {sid for sid, skill in skills.items() if skill.get("introduced_in") in order and order[skill["introduced_in"]] <= order[uid]}
        for sid in item.get("skills", []):
            if sid in skills and sid not in available:
                out.append(diag("SKILL_USED_BEFORE_INTRODUCED", f"skill unavailable in {uid}: {sid}", file=file, record_id=item.get("id", ""), field_path="skills", related_id=sid))
            for req in transitive_requires(skills, sid):
                if req not in available:
                    out.append(diag("SKILL_REQUIRED_PREREQUISITE_UNAVAILABLE", f"transitive prerequisite unavailable: {req}", file=file, record_id=item.get("id", ""), field_path="skills", related_id=req))
        for lex in item.get("vocabulary", []):
            if lex in vocab:
                available_from = vocab[lex].get("available_from")
                if available_from in order and order[available_from] > order[uid]:
                    out.append(diag("VOCAB_USED_BEFORE_AVAILABLE", f"vocabulary unavailable until {available_from}: {lex}", file=file, record_id=item.get("id", ""), field_path="vocabulary", related_id=lex))
    profile = item.get("normalization_profile_id")
    try:
        accepted_list = [comparison_key(x, profile) for x in item.get("accepted_answers", [])]
        rejected_list = [comparison_key(x, profile) for x in item.get("rejected_answers", [])]
        accepted = set(accepted_list)
        rejected = set(rejected_list)
        if len(accepted_list) != len(accepted):
            out.append(diag("ANSWER_ACCEPTED_DUPLICATE_NORMALIZED", "multiple accepted answers normalize to the same comparison form", severity="warning", file=file, record_id=item.get("id", ""), field_path="accepted_answers"))
        collision = accepted & rejected
        if collision:
            out.append(diag("ANSWER_NORMALIZATION_COLLISION", f"accepted/rejected comparison forms collide: {sorted(collision)!r}", file=file, record_id=item.get("id", ""), field_path="accepted_answers"))
    except (ValueError, TypeError) as exc:
        out.append(diag("NORMALIZATION_INPUT_INVALID", str(exc), file=file, record_id=item.get("id", ""), field_path="normalization_profile_id"))
    if item.get("automatic_scoring") and item.get("exercise_type") in {"self-assessed-translation", "self-assessed-composition", "self-assessed-pronunciation"}:
        out.append(diag("EXERCISE_AUTOSCORING_UNSUPPORTED", "self-assessed response cannot be automatically scored", file=file, record_id=item.get("id", "")))
    if item.get("exercise_type") == "selected-response":
        choices = item.get("choices", [])
        choice_ids = [choice.get("choice_id") for choice in choices]
        if len(choice_ids) != len(set(choice_ids)):
            out.append(diag("EXERCISE_CHOICE_ID_DUPLICATE", "choice IDs must be unique", file=file, record_id=item.get("id", ""), field_path="choices"))
        correct_count = sum(choice.get("is_correct") is True for choice in choices)
        if item.get("answer_mode") == "single-choice" and correct_count != 1:
            out.append(diag("EXERCISE_SINGLE_CHOICE_CORRECT_COUNT", f"single-choice requires exactly one correct choice, got {correct_count}", file=file, record_id=item.get("id", ""), field_path="choices"))
    return out


def iter_review_records(bundle: dict[str, Any]) -> Iterable[dict[str, Any]]:
    for key in ("source_checked", "editorial_approved", "expert_reviewed", "automated_validation"):
        yield from bundle.get(key, [])


def evaluate_reviews(bundle: dict[str, Any], current_version: str, file: Path | str = "", record_id: str = "", data: dict[str, Any] | None = None, include_status: bool = False) -> tuple[list[dict[str, str]], list[Diagnostic]]:
    out: list[Diagnostic] = []
    evaluations: list[dict[str, str]] = []
    records = list(iter_review_records(bundle))
    by_id = {review.get("id", ""): review for review in records}
    superseded_targets = {review.get("supersedes") for review in records if review.get("supersedes")}
    seen: set[str] = set()
    for review in records:
        rid = review.get("id", "")
        invalid = False
        if rid in seen:
            out.append(diag("REVIEW_DUPLICATE_ID", f"duplicate review id: {rid}", file=file, record_id=record_id, related_id=rid))
            invalid = True
        seen.add(rid)
        try:
            reviewed_at = datetime.fromisoformat(str(review.get("reviewed_at", "")).replace("Z", "+00:00"))
            if reviewed_at.tzinfo is None:
                raise ValueError("timezone missing")
        except ValueError:
            out.append(diag("REVIEW_DATETIME_INVALID", "reviewed_at must be ISO 8601 with timezone", file=file, record_id=record_id or rid, field_path="reviewed_at", related_id=rid))
            invalid = True
        if not review.get("scope"):
            out.append(diag("REVIEW_SCOPE_EMPTY", "review scope must identify at least one target", file=file, record_id=record_id or rid, field_path="scope", related_id=rid))
            invalid = True
        if review.get("active") and review.get("reviewed_content_version") != current_version:
            out.append(diag("REVIEW_STALE_CONTENT_VERSION", f"active review covers {review.get('reviewed_content_version')}, current is {current_version}", file=file, record_id=record_id or rid, field_path="reviewed_content_version", related_id=rid, action="Keep history but mark inactive/stale and re-review the current content."))
        if review.get("kind") == "expert-reviewed" and review.get("result") == "pass" and review.get("reviewer_type") != "human-expert":
            out.append(diag("REVIEW_EXPERT_REQUIRES_HUMAN", "expert-reviewed pass requires a human expert", file=file, record_id=record_id or rid, related_id=rid))
            invalid = True
        if review.get("kind") == "source-checked" and review.get("result") == "pass" and not review.get("evidence_refs"):
            out.append(diag("REVIEW_SOURCE_EVIDENCE_MISSING", "source-checked pass requires evidence", file=file, record_id=record_id or rid, related_id=rid))
            invalid = True
        if data is not None and review.get("kind") == "source-checked" and review.get("result") == "pass":
            _, _, source_ids, _ = indexes(data)
            for evidence_ref in review.get("evidence_refs", []):
                if str(evidence_ref).startswith("src-") and evidence_ref not in source_ids:
                    out.append(diag("REVIEW_SOURCE_EVIDENCE_UNKNOWN", f"unknown source evidence: {evidence_ref}", file=file, record_id=record_id or rid, field_path="evidence_refs", related_id=evidence_ref))
                    invalid = True
        if review.get("kind") == "automated-validation" and review.get("reviewer_type") != "automated-validator":
            out.append(diag("REVIEW_AUTOMATION_TYPE_INVALID", "automated validation requires automated-validator", file=file, record_id=record_id or rid, related_id=rid))
            invalid = True
        if review.get("active") and review.get("result") != "pass":
            out.append(diag("REVIEW_NONPASS_ACTIVE", "only a passing review may be active", file=file, record_id=record_id or rid, field_path="active", related_id=rid))
            invalid = True
        supersedes = review.get("supersedes")
        if supersedes:
            if supersedes == rid:
                out.append(diag("REVIEW_SUPERSEDES_SELF", "review cannot supersede itself", file=file, record_id=record_id or rid, field_path="supersedes", related_id=rid))
                invalid = True
            elif supersedes not in by_id:
                out.append(diag("REVIEW_SUPERSEDES_UNKNOWN", f"unknown superseded review: {supersedes}", file=file, record_id=record_id or rid, field_path="supersedes", related_id=supersedes))
                invalid = True
            elif by_id[supersedes].get("kind") != review.get("kind"):
                out.append(diag("REVIEW_SUPERSEDES_KIND_MISMATCH", "a review may supersede only the same review kind", file=file, record_id=record_id or rid, field_path="supersedes", related_id=supersedes))
                invalid = True
        if rid in superseded_targets and review.get("active"):
            out.append(diag("REVIEW_SUPERSEDED_ACTIVE", "a superseded review cannot remain active", file=file, record_id=record_id or rid, field_path="active", related_id=rid))
            invalid = True
        if invalid:
            status = "invalid"
        elif rid in superseded_targets:
            status = "superseded"
        elif review.get("reviewed_content_version") != current_version:
            status = "stale"
        elif review.get("active") and review.get("result") == "pass":
            status = "current"
        else:
            status = "superseded" if not review.get("active") else "invalid"
        evaluations.append({"review_id":rid, "status":status})
        if include_status:
            out.append(diag(f"REVIEW_STATUS_{status.upper()}", f"review status: {status}", severity="info", file=file, record_id=record_id or rid, related_id=rid))
    return evaluations, out


def check_reviews(bundle: dict[str, Any], current_version: str, file: Path | str = "", record_id: str = "", data: dict[str, Any] | None = None, include_status: bool = False) -> list[Diagnostic]:
    return evaluate_reviews(bundle, current_version, file, record_id, data, include_status)[1]


def check_project_reviews(data: dict[str, Any]) -> list[Diagnostic]:
    out: list[Diagnostic] = []
    roots = [ROOT / "vocabulary", ROOT / "drills" / "data", ROOT / "lessons"]
    for root in roots:
        for path in sorted(list(root.glob("**/*.json")) + list(root.glob("**/*.yml"))):
            try:
                value = read_json(path)
            except json.JSONDecodeError:
                continue
            records = value if isinstance(value, list) else [value]
            if isinstance(value, dict):
                records += [item for key in ("exercises", "examples", "records") for item in value.get(key, []) if isinstance(item, dict)]
            for item in records:
                if isinstance(item, dict) and isinstance(item.get("review"), dict) and item.get("content_version"):
                    out += check_reviews(item["review"], item["content_version"], path, item.get("id", ""), data, include_status=True)
    return out


def check_normalization() -> list[Diagnostic]:
    out: list[Diagnostic] = []
    try:
        profiles = load_profiles()
        if len(profiles) != 5:
            out.append(diag("NORMALIZATION_PROFILE_COUNT", "expected five canonical profiles", file=ROOT/"standards"/"normalization-profiles.json"))
        vectors = read_json(ROOT / "tests" / "normalization-vectors.json")
        for case in vectors["cases"]:
            actual = comparison_key(case["input"], case["profile"], profiles)
            expected = case["expected"] if isinstance(case["expected"], str) else json.dumps(case["expected"], ensure_ascii=False, sort_keys=True, separators=(",", ":"))
            if actual != expected:
                out.append(diag("NORMALIZATION_VECTOR_MISMATCH", f"{case['id']}: expected {expected!r}, got {actual!r}", file=ROOT/"tests"/"normalization-vectors.json", record_id=case["id"]))
        for case in vectors.get("inequality_cases", []):
            left = comparison_key(case["left"], case["profile"], profiles)
            right = comparison_key(case["right"], case["profile"], profiles)
            if left == right:
                out.append(diag("NORMALIZATION_FALSE_EQUAL", f"{case['id']}: values that must differ normalized equally", file=ROOT/"tests"/"normalization-vectors.json", record_id=case["id"]))
    except (OSError, ValueError, TypeError, KeyError, json.JSONDecodeError) as exc:
        out.append(diag("NORMALIZATION_CONFIGURATION_INVALID", str(exc), file=ROOT/"standards"/"normalization-profiles.json"))
    return out


def check_demo_data(data: dict[str, Any], content: dict[str, Any], file: Path | str) -> list[Diagnostic]:
    out: list[Diagnostic] = []
    if content.get("demo_only") is not True:
        out.append(diag("DEMO_MARKER_MISSING", "M4 drill data must be explicitly marked demo_only", file=file, field_path="demo_only"))
    unit_ids = [unit.get("id") for unit in content.get("units", [])]
    if len(unit_ids) != len(set(unit_ids)):
        out.append(diag("DEMO_UNIT_ID_DUPLICATE", "demo unit IDs must be unique", file=file, field_path="units"))
    question_ids: set[str] = set()
    supported = {"selected-response", "short-input", "feature-identification"}
    for unit in content.get("units", []):
        for question in unit.get("questions", []):
            qid = question.get("id", "")
            if qid in question_ids:
                out.append(diag("DEMO_QUESTION_ID_DUPLICATE", f"duplicate question ID: {qid}", file=file, record_id=qid))
            question_ids.add(qid)
            if question.get("type") not in supported:
                out.append(diag("DEMO_QUESTION_TYPE_UNSUPPORTED", f"unsupported demo type: {question.get('type')}", file=file, record_id=qid, field_path="type"))
            profile_id = question.get("normalization_profile_id")
            if profile_id not in data["normalization_profiles"]:
                out.append(diag("REF_UNKNOWN_NORMALIZATION_PROFILE", f"unknown normalization profile: {profile_id}", file=file, record_id=qid, field_path="normalization_profile_id", related_id=str(profile_id)))
                continue
            try:
                accepted = {comparison_key(value, profile_id) for value in question.get("accepted_answers", [])}
                rejected = {comparison_key(value, profile_id) for value in question.get("rejected_answers", [])}
                if accepted & rejected:
                    out.append(diag("ANSWER_NORMALIZATION_COLLISION", "demo accepted/rejected sets collide", file=file, record_id=qid, field_path="accepted_answers"))
            except (TypeError, ValueError) as exc:
                out.append(diag("NORMALIZATION_INPUT_INVALID", str(exc), file=file, record_id=qid))
    return out


def check_unit01_content(data: dict[str, Any]) -> list[Diagnostic]:
    out: list[Diagnostic] = []
    bundle_path = ROOT / "drills" / "data" / "unit-01.json"
    coverage_path = ROOT / "lessons" / "unit-01" / "coverage.json"
    terms_path = ROOT / "lessons" / "unit-01" / "terms.json"
    if not all(path.exists() for path in (bundle_path, coverage_path, terms_path)):
        return [diag("M5_REQUIRED_ARTIFACT_MISSING", "unit-01 bundle, coverage, and terms are required", file=ROOT / "lessons" / "unit-01")]
    bundle = read_json(bundle_path)
    exercises = {item.get("id"): item for item in bundle.get("exercises", [])}
    exercise_ids = list(exercises)
    if len(exercise_ids) != len(bundle.get("exercises", [])):
        out.append(diag("M5_EXERCISE_ID_DUPLICATE", "unit-01 exercise IDs must be unique", file=bundle_path))
    listed = [qid for section in bundle.get("sections", []) for qid in section.get("exercise_ids", [])]
    if len(listed) != len(set(listed)):
        out.append(diag("M5_EXERCISE_LIST_DUPLICATE", "exercise may occur in only one drill section", file=bundle_path, field_path="sections"))
    for qid in listed:
        if qid not in exercises:
            out.append(diag("M5_EXERCISE_LIST_UNKNOWN", f"unknown exercise in section: {qid}", file=bundle_path, related_id=str(qid)))
    for qid in set(exercises) - set(listed):
        out.append(diag("M5_EXERCISE_UNLISTED", f"exercise is not reachable from a section: {qid}", file=bundle_path, related_id=str(qid)))
    examples = {read_json(path)["id"]: read_json(path) for path in sorted((ROOT / "lessons" / "unit-01" / "examples").glob("*.json"))}
    lessons = {read_json(path)["id"]: read_json(path) for path in sorted((ROOT / "lessons" / "unit-01" / "metadata").glob("*.json"))}
    coverage = read_json(coverage_path).get("coverage", [])
    expected_skills = {skill for lesson in lessons.values() for skill in lesson.get("skills", []) if data["skill_map"] and next((s for s in data["skill_map"]["skills"] if s["id"] == skill and s.get("introduced_in") in {"unit-01a", "unit-01b", "unit-01c"}), None)}
    covered_skills = {row.get("skill_id") for row in coverage}
    if covered_skills != expected_skills:
        out.append(diag("M5_COVERAGE_SKILL_MISMATCH", f"missing={sorted(expected_skills-covered_skills)}, extra={sorted(covered_skills-expected_skills)}", file=coverage_path))
    for row in coverage:
        for field in ("explanation", "example", "guided", "independent", "later_review"):
            if not row.get(field):
                out.append(diag("M5_COVERAGE_STAGE_MISSING", f"coverage stage missing: {field}", file=coverage_path, record_id=row.get("skill_id", ""), field_path=field))
        if row.get("example") not in examples:
            out.append(diag("M5_COVERAGE_EXAMPLE_UNKNOWN", f"unknown example: {row.get('example')}", file=coverage_path, record_id=row.get("skill_id", ""), field_path="example"))
        for field in ("guided", "independent"):
            if row.get(field) not in exercises:
                out.append(diag("M5_COVERAGE_EXERCISE_UNKNOWN", f"unknown exercise: {row.get(field)}", file=coverage_path, record_id=row.get("skill_id", ""), field_path=field))
    term_skill_refs = [sid for term in read_json(terms_path).get("terms", []) for sid in term.get("skills", [])]
    known_skills = {item["id"] for item in data["skill_map"]["skills"]}
    for sid in term_skill_refs:
        if sid not in known_skills:
            out.append(diag("REF_UNKNOWN_SKILL", f"unknown term skill: {sid}", file=terms_path, related_id=sid))
    for item in exercises.values():
        if item.get("scoring_target") == "macron" and item.get("normalization_profile_id") != "macron-sensitive":
            out.append(diag("M5_MACRON_PROFILE_MISMATCH", "macron-scored exercise must be macron-sensitive", file=bundle_path, record_id=item.get("id", "")))
        if item.get("exercise_type") == "self-assessed-pronunciation" and item.get("automatic_scoring") is not False:
            out.append(diag("M5_PRONUNCIATION_AUTOSCORED", "pronunciation self-assessment cannot be auto-scored", file=bundle_path, record_id=item.get("id", "")))
        if item.get("unit_id") == "unit-01c" and any(sid.startswith(("morph.noun.", "morph.verb.")) for sid in item.get("skills", [])):
            out.append(diag("M5_UNTAUGHT_MORPHOLOGY_TARGET", "1C may not test later noun/verb paradigms", file=bundle_path, record_id=item.get("id", "")))
    out.append(diag("M5_EDITORIAL_REVIEW_PENDING", "unit-01 candidate awaits human editorial review and semantic uniqueness review", severity="warning", file=ROOT / "lessons" / "unit-01" / "review-notes.md"))
    out.append(diag("M5_VOCABULARY_SOURCE_REVIEW_PENDING", "individual vocabulary morphology has not been checked against dictionary entries", severity="warning", file=ROOT / "vocabulary" / "unit-01"))
    return out


def fixture_diagnostics(data: dict[str, Any], case: dict[str, Any], path: Path) -> list[Diagnostic]:
    record = read_json(path)
    checks = case.get("checks", [])
    out: list[Diagnostic] = []
    if "references" in checks: out += check_references(data, record, path)
    if "exercises" in checks: out += check_exercise(data, record, path)
    if "reviews" in checks: out += check_reviews(record, case.get("current_content_version", record.get("content_version", "")), path, record.get("id", ""), data)
    if "dag" in checks: out += check_dag(data, record, path)
    if "curriculum" in checks: out += check_curriculum(data, record, {}, path)
    if "unit-spec" in checks: out += check_curriculum(data, unit_specs={"fixture": record})
    if "preview" in checks: out += check_preview_example(record, path)
    if "preview-graph" in checks: out += check_preview_model(data, record, path)
    return out


def check_fixtures(data: dict[str, Any]) -> list[Diagnostic]:
    out: list[Diagnostic] = []
    manifest = read_json(FIXTURES / "manifest.json")
    case_ids = [case.get("id") for case in manifest["cases"]]
    case_paths = [case.get("path") for case in manifest["cases"]]
    if len(case_ids) != len(set(case_ids)):
        out.append(diag("FIXTURE_ID_DUPLICATE", "fixture manifest IDs must be unique", file=FIXTURES/"manifest.json", field_path="cases"))
    if len(case_paths) != len(set(case_paths)):
        out.append(diag("FIXTURE_PATH_DUPLICATE", "fixture manifest paths must be unique", file=FIXTURES/"manifest.json", field_path="cases"))
    for case in manifest["cases"]:
        path = FIXTURES / case["path"]
        if case["schema"] not in data["schemas"]:
            out.append(diag("REF_UNKNOWN_SCHEMA", f"unknown Schema ID: {case['schema']}", file=FIXTURES/"manifest.json", record_id=case.get("id", ""), field_path="schema", related_id=case["schema"]))
            continue
        if not path.exists():
            out.append(diag("FIXTURE_FILE_MISSING", "fixture file does not exist", file=path, record_id=case.get("id", "")))
            continue
        try:
            schema_ok, details = schema_validate(path, case["schema"])
        except RuntimeError as exc:
            return [diag("ENV_SCHEMA_VALIDATOR_UNAVAILABLE", str(exc), file=path)]
        layer = case["layer"]
        expected_schema = case.get("schema_expected", "invalid" if layer == "json-schema-invalid" else "valid")
        if schema_ok != (expected_schema == "valid"):
            out.append(diag("FIXTURE_SCHEMA_EXPECTATION_MISMATCH", f"expected schema {expected_schema}, got {'valid' if schema_ok else 'invalid'}: {details[-400:]}", file=path, record_id=case.get("id", case["path"])))
            continue
        if layer == "semantic-invalid" and schema_ok:
            actual = fixture_diagnostics(data, case, path)
            actual_codes = {d.code for d in actual if d.severity == "error"}
            expected_codes = set(case.get("expected_error_codes", []))
            missing = expected_codes - actual_codes
            unexpected = actual_codes - expected_codes
            if missing or unexpected:
                out.append(diag("FIXTURE_SEMANTIC_EXPECTATION_MISMATCH", f"missing={sorted(missing)}, unexpected={sorted(unexpected)}", file=path, record_id=case.get("id", case["path"])))
        elif layer == "json-schema" and not schema_ok:
            out.append(diag("FIXTURE_VALID_REJECTED", details[-400:], file=path))
    return out


def select_checks(command: str, data: dict[str, Any]) -> list[Diagnostic]:
    if command == "schema":
        files = list((ROOT/"curriculum").glob("*.yml")) + list((ROOT/"lessons").glob("unit-*/unit-spec.yml")) + list((ROOT/"sources").glob("*.json")) + list((ROOT/"standards").glob("*.json"))
        return check_schema(files)
    if command == "references": return check_references(data)
    if command == "dag": return check_dag(data)
    if command == "curriculum": return check_curriculum(data)
    if command == "exercises":
        out: list[Diagnostic] = []
        for p in list((ROOT/"drills"/"data").glob("**/*.json")):
            content = read_json(p)
            for item in content.get("exercises", []): out += check_exercise(data, item, p)
            for item in content.get("examples", []): out += check_references(data, item, p) + check_preview_example(item, p)
            if content.get("demo_only") is True: out += check_demo_data(data, content, p)
        for p in sorted((ROOT/"lessons"/"unit-01"/"examples").glob("*.json")):
            item = read_json(p)
            out += check_references(data, item, p) + check_preview_example(item, p)
        out += check_unit01_content(data)
        return out
    if command == "reviews": return check_project_reviews(data)
    if command == "normalization": return check_normalization()
    if command == "fixtures": return check_fixtures(data)
    out: list[Diagnostic] = []
    for part in COMMANDS[1:]: out += select_checks(part, data)
    return out


def format_output(diagnostics: list[Diagnostic], output_format: str) -> None:
    if output_format == "json":
        print(json.dumps({"diagnostics":[asdict(d) for d in diagnostics],"summary":summary(diagnostics)}, ensure_ascii=False, indent=2))
        return
    for d in diagnostics:
        loc = ":".join(x for x in (d.file, d.record_id, d.field_path) if x)
        print(f"{d.severity.upper()} {d.code} {loc} - {d.message}")
        if d.suggested_action: print(f"  action: {d.suggested_action}")
    s = summary(diagnostics)
    print(f"Validation complete: {s['errors']} error(s), {s['warnings']} warning(s).")


def summary(ds: list[Diagnostic]) -> dict[str, int]:
    return {"errors":sum(d.severity == "error" for d in ds), "warnings":sum(d.severity == "warning" for d in ds)}


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Validate Latin learning system data")
    parser.add_argument("command", choices=COMMANDS)
    parser.add_argument("--format", choices=("text", "json"), default="text")
    parser.add_argument("--path", type=Path, help="reserved target filter; must stay inside the project")
    parser.add_argument("--strict", action="store_true", help="enable all currently defined checks")
    parser.add_argument("--fail-on-warning", action="store_true")
    args = parser.parse_args(argv)
    try:
        if args.path:
            resolved = (ROOT / args.path).resolve()
            if ROOT not in resolved.parents and resolved != ROOT:
                parser.error("--path must resolve inside the project")
        diagnostics = select_checks(args.command, project_data())
        format_output(diagnostics, args.format)
        s = summary(diagnostics)
        return 1 if s["errors"] or (args.fail_on_warning and s["warnings"]) else 0
    except SystemExit:
        raise
    except (OSError, json.JSONDecodeError, RuntimeError, KeyError, TypeError, ValueError) as exc:
        d = diag("ENV_OR_CONFIGURATION_ERROR", str(exc))
        format_output([d], args.format)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
