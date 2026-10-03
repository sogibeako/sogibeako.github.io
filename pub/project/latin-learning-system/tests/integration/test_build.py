import hashlib
import json
import sys
import tempfile
import unittest
from unittest import mock
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "scripts"))
import build  # noqa: E402


class BuildTests(unittest.TestCase):
    def test_output_escape_rejected(self):
        with self.assertRaises(ValueError): build.ensure_output("../outside")

    def test_safe_embed(self):
        embedded = build.safe_embedded_json(ROOT / "drills/data/demo.json")
        self.assertNotIn("</script>", embedded.lower())
        self.assertIn("\\u003c/script", embedded.lower())

    def test_manifest_is_deterministic(self):
        with tempfile.TemporaryDirectory(dir=ROOT / "dist") as temporary:
            output = Path(temporary)
            with mock.patch.object(build, "validate", return_value=None):
                build.build(output, clean=False, fail_on_warning=False)
                manifest = json.loads((output / build.MANIFEST_NAME).read_text(encoding="utf-8"))
                before = {p: hashlib.sha256((output / p).read_bytes()).hexdigest() for p in manifest["generated_files"]}
                build.build(output, clean=True, fail_on_warning=False)
                after = {p: hashlib.sha256((output / p).read_bytes()).hexdigest() for p in manifest["generated_files"]}
            self.assertEqual(before, after)
            self.assertIn("unit-01/index.html", manifest["generated_files"])
            self.assertIn("unit-01/drill.html", manifest["generated_files"])

    def test_production_drill_is_derived_from_records(self):
        source = json.loads((ROOT / "drills/data/unit-01.json").read_text(encoding="utf-8"))
        built = build.production_drill_data()
        self.assertEqual(sum(len(unit["questions"]) for unit in built["units"]), len(source["exercises"]))
        self.assertTrue(built["production_candidate"])

    def test_textbook_and_drill_link_each_other(self):
        with tempfile.TemporaryDirectory(dir=ROOT / "dist") as temporary:
            output = Path(temporary)
            with mock.patch.object(build, "validate", return_value=None):
                build.build(output, clean=False, fail_on_warning=False)
            textbook = (output / "unit-01/index.html").read_text(encoding="utf-8")
            drill = (output / "unit-01/drill.html").read_text(encoding="utf-8")
            self.assertIn('href="drill.html"', textbook)
            self.assertIn('href="index.html"', drill)

    def test_clean_preserves_unmanaged_file(self):
        with tempfile.TemporaryDirectory(dir=ROOT / "dist") as temporary:
            output = Path(temporary)
            marker = output / "m4-unmanaged-test.txt"
            marker.write_text("preserve", encoding="utf-8")
            with mock.patch.object(build, "validate", return_value=None):
                build.build(output, clean=False, fail_on_warning=False)
                build.clean_generated(output)
            self.assertTrue(marker.exists())

    def test_validation_failure_stops_before_output(self):
        output = ROOT / "dist" / "m4-validation-stop-test"
        self.assertFalse(output.exists())
        with mock.patch.object(build, "validate", side_effect=RuntimeError("fixture validation failure")):
            with self.assertRaises(RuntimeError):
                build.build(output, clean=False, fail_on_warning=False)
        self.assertFalse(output.exists())

    def test_clean_rejects_manifest_escape(self):
        with tempfile.TemporaryDirectory(dir=ROOT / "dist") as temporary:
            output = Path(temporary)
            outside = output.parent / "m4-clean-outside.txt"
            outside.write_text("preserve", encoding="utf-8")
            try:
                (output / build.MANIFEST_NAME).write_text(json.dumps({"generated_files":["../m4-clean-outside.txt"]}), encoding="utf-8")
                with self.assertRaises(ValueError): build.clean_generated(output)
                self.assertEqual(outside.read_text(encoding="utf-8"), "preserve")
            finally:
                outside.unlink(missing_ok=True)


if __name__ == "__main__": unittest.main()
