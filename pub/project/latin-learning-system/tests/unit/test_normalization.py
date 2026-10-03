import json
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "scripts"))
from normalization import comparison_key, load_profiles  # noqa: E402


class NormalizationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.profiles = load_profiles()
        cls.vectors = json.loads((ROOT / "tests" / "normalization-vectors.json").read_text(encoding="utf-8"))

    def test_shared_vectors(self):
        for case in self.vectors["cases"]:
            expected = case["expected"] if isinstance(case["expected"], str) else json.dumps(case["expected"], ensure_ascii=False, sort_keys=True, separators=(",", ":"))
            self.assertEqual(comparison_key(case["input"], case["profile"], self.profiles), expected, case["id"])

    def test_expected_inequalities(self):
        for case in self.vectors["inequality_cases"]:
            self.assertNotEqual(comparison_key(case["left"], case["profile"], self.profiles), comparison_key(case["right"], case["profile"], self.profiles), case["id"])


if __name__ == "__main__": unittest.main()
