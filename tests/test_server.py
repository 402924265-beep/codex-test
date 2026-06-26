from __future__ import annotations

import unittest

from pathlib import Path

from dw_reconcile_app.config import DEFAULT_25_ACTUAL, DEFAULT_26_ACTUAL, DEFAULT_4PLUS8_REFERENCE
from dw_reconcile_app.server import _is_default_request, build_config_payload, merge_analysis


class ServerTests(unittest.TestCase):
    def test_config_payload_exposes_defaults(self):
        payload = build_config_payload()

        self.assertEqual(payload["project"], "洗碗机")
        self.assertEqual(payload["monthLabel"], "1月")
        self.assertTrue(payload["defaultActual25Path"].endswith("2025 monthly Renta DW _ NOV_ACT.xlsx"))
        self.assertTrue(payload["defaultActual26Path"].endswith("2026 MFG Variance Reporting_ DW_04.2026 v1.xlsx"))
        self.assertTrue(payload["defaultReference4plus8Path"].endswith("4+8【最新】制造费用累计-大厨电（每月更新）-2026(3).xlsx"))

    def test_default_request_requires_all_default_paths(self):
        self.assertTrue(_is_default_request(DEFAULT_25_ACTUAL, DEFAULT_26_ACTUAL, DEFAULT_4PLUS8_REFERENCE))
        self.assertFalse(_is_default_request(Path(r"C:\other\25.xlsx"), DEFAULT_26_ACTUAL, DEFAULT_4PLUS8_REFERENCE))
        self.assertFalse(_is_default_request(DEFAULT_25_ACTUAL, Path(r"C:\other\26.xlsx"), DEFAULT_4PLUS8_REFERENCE))
        self.assertFalse(_is_default_request(DEFAULT_25_ACTUAL, DEFAULT_26_ACTUAL, Path(r"C:\other\4plus8.xlsx")))

    def test_merge_analysis_updates_rows_by_code(self):
        payload = {
            "rows": [
                {"code": "6666010188", "analysis": ""},
                {"code": "6666021500", "analysis": ""},
            ],
            "analysisByCode": {"6666021500": "26年1月无发生额"},
        }

        merge_analysis(payload)

        self.assertEqual(payload["rows"][0]["analysis"], "")
        self.assertEqual(payload["rows"][1]["analysis"], "26年1月无发生额")


if __name__ == "__main__":
    unittest.main()
