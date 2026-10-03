import json
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "scripts"))
import validate  # noqa: E402


class ValidationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls): cls.data = validate.project_data()

    def test_canonical_dag(self):
        self.assertFalse([d for d in validate.check_dag(self.data) if d.severity == "error"])

    def test_canonical_curriculum(self):
        self.assertFalse([d for d in validate.check_curriculum(self.data) if d.severity == "error"])

    def test_canonical_references(self):
        self.assertFalse([d for d in validate.check_references(self.data) if d.severity == "error"])

    def test_preview_model(self):
        self.assertEqual(validate.check_preview_model(self.data), [])

    def test_preview_graph_negative_fixture(self):
        path = ROOT / "tests/fixtures/invalid/preview-required-strong-graph-semantic.json"
        diagnostics = validate.check_preview_model(self.data, validate.read_json(path), path)
        self.assertEqual({d.code for d in diagnostics}, {"PREVIEW_REQUIRED_BY_STRONG_GRAPH"})

    def test_cycle_fixture(self):
        record = validate.read_json(ROOT / "tests/fixtures/invalid/requires-cycle-semantic.json")
        self.assertIn("DAG_REQUIRES_CYCLE", {d.code for d in validate.check_dag(self.data, record)})

    def test_collision_fixture(self):
        path = ROOT / "tests/fixtures/invalid/normalization-collision-semantic.json"
        self.assertIn("ANSWER_NORMALIZATION_COLLISION", {d.code for d in validate.check_exercise(self.data, validate.read_json(path), path)})

    def test_stale_review_fixture(self):
        path = ROOT / "tests/fixtures/invalid/stale-review-semantic.json"
        evaluations, diagnostics = validate.evaluate_reviews(validate.read_json(path), "0.2.0", path)
        self.assertIn("REVIEW_STALE_CONTENT_VERSION", {d.code for d in diagnostics})
        self.assertEqual(evaluations[0]["status"], "stale")

    def test_review_statuses(self):
        base = {"kind":"editorial-approved","result":"pass","reviewer_type":"human-editor","reviewer_display_name":"fixture","reviewed_at":"2026-08-25T00:00:00+09:00","scope":["all"],"notes":"fixture","evidence_refs":[]}
        old = dict(base, id="review-old", reviewed_content_version="0.1.0", active=False)
        current = dict(base, id="review-current", reviewed_content_version="0.2.0", active=True, supersedes="review-old")
        bundle = {"draft_status":"ready-for-review","source_checked":[],"editorial_approved":[old,current],"expert_reviewed":[],"automated_validation":[]}
        evaluations, diagnostics = validate.evaluate_reviews(bundle, "0.2.0")
        self.assertFalse([d for d in diagnostics if d.severity == "error"])
        self.assertEqual({e["review_id"]:e["status"] for e in evaluations}, {"review-old":"superseded","review-current":"current"})

    def test_invalid_expert_review_status(self):
        review = {"id":"review-bad","kind":"expert-reviewed","result":"pass","reviewer_type":"codex","reviewer_display_name":"Codex","reviewed_at":"2026-08-25T00:00:00+09:00","reviewed_content_version":"0.2.0","scope":["all"],"notes":"fixture","evidence_refs":[],"active":True}
        bundle = {"draft_status":"ready-for-review","source_checked":[],"editorial_approved":[],"expert_reviewed":[review],"automated_validation":[]}
        evaluations, diagnostics = validate.evaluate_reviews(bundle, "0.2.0")
        self.assertEqual(evaluations[0]["status"], "invalid")
        self.assertIn("REVIEW_EXPERT_REQUIRES_HUMAN", {d.code for d in diagnostics})

    def test_wrong_reference_type(self):
        record = {"id":"q-fixture-type","skills":["unit-01a"]}
        self.assertIn("REF_WRONG_TARGET_TYPE", {d.code for d in validate.check_references(self.data, record)})

    def test_preview_semantic_fixture(self):
        path = ROOT / "tests/fixtures/invalid/preview-formal-skill-semantic.json"
        self.assertEqual({d.code for d in validate.check_preview_example(validate.read_json(path), path)}, {"PREVIEW_FORMAL_SKILL_MIXED"})

    def test_named_load_warnings(self):
        codes = {(d.record_id,d.code) for d in validate.check_curriculum(self.data) if d.severity == "warning"}
        self.assertIn(("unit-02b","LOAD_2B_SIX_SKILLS"), codes)
        self.assertIn(("unit-03a","LOAD_3A_CASE_NUMBER"), codes)
        self.assertIn(("unit-04c","LOAD_4C_ADJECTIVE_AGREEMENT"), codes)
        self.assertIn(("unit-05c","LOAD_5C_DICTIONARY_INTRO"), codes)
        self.assertIn(("unit-05c","LOAD_5C_TEN_LEXEMES"), codes)

    def test_demo_data(self):
        path = ROOT / "drills/data/demo.json"
        self.assertEqual(validate.check_demo_data(self.data, validate.read_json(path), path), [])

    def test_unit01_content(self):
        diagnostics = validate.check_unit01_content(self.data)
        self.assertFalse([d for d in diagnostics if d.severity == "error"])
        self.assertEqual({d.code for d in diagnostics if d.severity == "warning"}, {"M5_EDITORIAL_REVIEW_PENDING", "M5_VOCABULARY_SOURCE_REVIEW_PENDING"})

    def test_unit01_exercises(self):
        path = ROOT / "drills/data/unit-01.json"
        exercises = validate.read_json(path)["exercises"]
        self.assertEqual(len(exercises), 21)
        self.assertFalse([d for item in exercises for d in validate.check_exercise(self.data, item, path) if d.severity == "error"])
        pronunciation = [item for item in exercises if item["exercise_type"] == "self-assessed-pronunciation"]
        self.assertEqual(len(pronunciation), 2)
        self.assertTrue(all(item["automatic_scoring"] is False for item in pronunciation))

    def test_unit01_schema_records(self):
        self.assertFalse([d for d in validate.check_schema() if d.severity == "error"])

    def test_fixture_manifest(self):
        self.assertEqual(validate.check_fixtures(self.data), [])


if __name__ == "__main__": unittest.main()
