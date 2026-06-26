from __future__ import annotations

import unittest

from dw_reconcile_app.excel_io import SourceAccount
from dw_reconcile_app.reconcile import build_reference_checks, build_summary, reconcile_accounts, summarize_categories


class ReconcileTests(unittest.TestCase):
    def test_reconcile_actual_minus_same_period(self):
        rows = reconcile_accounts(
            {
                "6666010188": SourceAccount(
                    code="6666010188",
                    desc_en="Salary - Blue collar direct employees",
                    desc_cn="蓝领直接员工工资",
                    group="* CS_Direct Labour",
                    amount=362.36537,
                    unit=7.46068,
                )
            },
            {
                "6666010188": SourceAccount(
                    code="6666010188",
                    desc_en="Salary - Blue collar direct employees",
                    desc_cn="蓝领直接员工工资",
                    group="* CS_Direct Labour",
                    amount=357.71936,
                    unit=7.55367,
                )
            },
        )
        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0]["status"], "both")
        self.assertAlmostEqual(rows[0]["unit_diff"], 0.09299, places=5)
        self.assertAlmostEqual(rows[0]["amount_diff"], -4.64601, places=5)

    def test_reconcile_preserves_unmatched_accounts(self):
        rows = reconcile_accounts(
            {"6666021500": SourceAccount(code="6666021500", desc_en="Repairs cost", amount=10, unit=1)},
            {"6666021501": SourceAccount(code="6666021501", desc_en="Other repairs", amount=5, unit=0.5)},
        )
        statuses = {row["code"]: row["status"] for row in rows}
        self.assertEqual(statuses["6666021500"], "only_25")
        self.assertEqual(statuses["6666021501"], "only_26")

    def test_reconcile_treats_blank_current_month_as_missing_for_status(self):
        rows = reconcile_accounts(
            {"6666021500": SourceAccount(code="6666021500", desc_en="Repairs cost", amount=0.34316, unit=0.007)},
            {"6666021500": SourceAccount(code="6666021500", desc_en="Repairs cost", amount=None, unit=None, rows=[118, 234])},
        )
        self.assertEqual(rows[0]["status"], "only_25")
        self.assertAlmostEqual(rows[0]["amount_diff"], -0.34316)

    def test_category_summary_excludes_fix_var_summary_rows(self):
        rows = reconcile_accounts(
            {
                "FIX": SourceAccount(code="FIX", desc_en="* CS_Depreciation", amount=100, unit=10),
                "6666110101": SourceAccount(code="6666110101", desc_en="Depreciation of buildings", amount=30, unit=3),
            },
            {
                "FIX": SourceAccount(code="FIX", desc_en="* CS_Depreciation", amount=200, unit=20),
                "6666110101": SourceAccount(code="6666110101", desc_en="Depreciation of buildings", amount=40, unit=4),
            },
        )
        categories = summarize_categories(rows)
        self.assertEqual(categories[0]["category"], "折旧")
        self.assertEqual(categories[0]["amount_25"], 30)
        self.assertEqual(categories[0]["amount_26"], 40)

    def test_summary_reports_fc_adjustment_separately(self):
        rows = reconcile_accounts(
            {},
            {
                "6666110101": SourceAccount(code="6666110101", desc_en="Depreciation", amount=10, unit=1),
                "__FC__": SourceAccount(code="__FC__", desc_en="Functional Currency Impact", amount=2, unit=0.2),
            },
        )
        summary = build_summary(rows, [], {"volume": 1000}, {"volume": 1000})
        self.assertEqual(summary["total_amount_26"], 12)
        self.assertEqual(summary["total_amount_26_excluding_fc"], 10)
        self.assertEqual(summary["fc_amount_26"], 2)

    def test_build_reference_checks_matches_sap_and_4plus8_categories(self):
        checks = build_reference_checks(
            [{"label": "折旧（含FC）", "amount_26": 564.25}],
            {"categories": [{"label": "折旧（含FC）", "amount_26": 564.2}], "total": 1778.3, "fc_reference": 392.9},
        )

        self.assertEqual(checks[0]["label"], "折旧（含FC）")
        self.assertAlmostEqual(checks[0]["amount_diff"], 0.05)


if __name__ == "__main__":
    unittest.main()
