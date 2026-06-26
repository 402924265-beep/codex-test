from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any

from .config import (
    DEFAULT_4PLUS8_REFERENCE,
    CATEGORY_RULES,
    DEFAULT_25_ACTUAL,
    DEFAULT_26_ACTUAL,
    DEFAULT_CATEGORY,
    HIGH_AMOUNT_DIFF,
    HIGH_UNIT_DIFF,
    MONTH,
    MONTH_LABEL,
    PROJECT,
    SHEET_CANDIDATES_25,
    SHEET_CANDIDATES_26,
    STATUS_LABELS,
)
from .excel_io import SourceAccount, extract_4plus8_dw_categories, extract_renta_accounts


@dataclass
class ReconcileOptions:
    actual_25_path: Path = DEFAULT_25_ACTUAL
    actual_26_path: Path = DEFAULT_26_ACTUAL
    reference_4plus8_path: Path = DEFAULT_4PLUS8_REFERENCE
    month: int = MONTH


def reconcile_dw_january(options: ReconcileOptions | None = None) -> dict[str, Any]:
    options = options or ReconcileOptions()
    accounts_25, meta_25 = extract_renta_accounts(options.actual_25_path, SHEET_CANDIDATES_25, options.month)
    accounts_26, meta_26 = extract_renta_accounts(options.actual_26_path, SHEET_CANDIDATES_26, options.month)
    rows = reconcile_accounts(accounts_25, accounts_26)
    categories = summarize_categories(rows)
    summary = build_summary(rows, categories, meta_25, meta_26)
    reference_4plus8 = load_reference_4plus8(options.reference_4plus8_path, options.month)
    reference_checks = build_reference_checks(meta_26.get("summary_categories", []), reference_4plus8)
    if reference_4plus8:
        summary["reference_total_26_4plus8"] = reference_4plus8.get("total")
        summary["reference_fc_26_4plus8"] = reference_4plus8.get("fc_reference")
        summary["reference_total_diff_26_4plus8"] = (summary["total_amount_26"] or 0.0) - (reference_4plus8.get("total") or 0.0)
    return {
        "project": PROJECT,
        "month": options.month,
        "month_label": MONTH_LABEL,
        "metadata": {
            "actual_25": meta_25,
            "actual_26": meta_26,
        },
        "summary": summary,
        "categories": categories,
        "reference_4plus8": reference_4plus8,
        "reference_checks": reference_checks,
        "rows": rows,
    }


def load_reference_4plus8(path: Path, month: int) -> dict[str, Any] | None:
    if not path.exists():
        return None
    return extract_4plus8_dw_categories(path, month)


def build_reference_checks(sap_categories: list[dict[str, Any]], reference_4plus8: dict[str, Any] | None) -> list[dict[str, Any]]:
    if not reference_4plus8:
        return []
    reference_by_label = {item.get("label"): item for item in reference_4plus8.get("categories", [])}
    checks: list[dict[str, Any]] = []
    seen: set[str] = set()
    for item in sap_categories:
        label = item.get("label")
        reference = reference_by_label.get(label)
        seen.add(label)
        amount_sap = item.get("amount_26")
        amount_ref = reference.get("amount_26") if reference else None
        checks.append(
            {
                "label": label,
                "amount_sap_26": amount_sap,
                "amount_reference_26": amount_ref,
                "amount_diff": (amount_sap or 0.0) - (amount_ref or 0.0) if amount_ref is not None else None,
                "source_rows_sap": item.get("source_rows", []),
                "source_row_reference": reference.get("source_row") if reference else None,
            }
        )
    for label, reference in reference_by_label.items():
        if label in seen:
            continue
        checks.append(
            {
                "label": label,
                "amount_sap_26": None,
                "amount_reference_26": reference.get("amount_26"),
                "amount_diff": None,
                "source_rows_sap": [],
                "source_row_reference": reference.get("source_row"),
            }
        )
    return checks


def reconcile_accounts(accounts_25: dict[str, SourceAccount], accounts_26: dict[str, SourceAccount]) -> list[dict[str, Any]]:
    codes = sorted(set(accounts_25) | set(accounts_26), key=_code_sort_key)
    rows: list[dict[str, Any]] = []
    for code in codes:
        left = accounts_25.get(code)
        right = accounts_26.get(code)
        left_has_value = _has_current_month_value(left)
        right_has_value = _has_current_month_value(right)
        if left_has_value and right_has_value:
            status = "both"
        elif left_has_value:
            status = "only_25"
        elif right_has_value:
            status = "only_26"
        elif left and right:
            status = "both"
        elif left:
            status = "only_25"
        else:
            status = "only_26"
        amount_25 = left.amount if left else None
        unit_25 = left.unit if left else None
        amount_26 = right.amount if right else None
        unit_26 = right.unit if right else None
        display = right or left
        category = categorize(display)
        amount_diff = _diff(amount_26, amount_25)
        unit_diff = _diff(unit_26, unit_25)
        rows.append(
            {
                "code": code,
                "desc_en": display.desc_en if display else "",
                "desc_cn": display.desc_cn if display else "",
                "group": display.group if display else "",
                "category": category,
                "amount_25": amount_25,
                "unit_25": unit_25,
                "amount_26": amount_26,
                "unit_26": unit_26,
                "amount_diff": amount_diff,
                "unit_diff": unit_diff,
                "status": status,
                "status_label": STATUS_LABELS[status],
                "analysis": "",
                "source_25": _source_label(left),
                "source_26": _source_label(right),
                "is_summary": code in {"FIX", "VAR"},
                "is_high_impact": _is_high_impact(amount_diff, unit_diff),
            }
        )
    return rows


def categorize(account: SourceAccount | None) -> str:
    if account is None:
        return DEFAULT_CATEGORY
    haystack = " ".join([account.group, account.desc_en, account.desc_cn, account.code]).lower()
    for rule in CATEGORY_RULES:
        if any(keyword.lower() in haystack for keyword in rule["keywords"]):
            return rule["name"]
    return DEFAULT_CATEGORY


def summarize_categories(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    bucket: dict[str, dict[str, Any]] = {}
    for row in rows:
        if row["is_summary"]:
            continue
        category = row["category"]
        item = bucket.setdefault(
            category,
            {
                "category": category,
                "amount_25": 0.0,
                "amount_26": 0.0,
                "amount_diff": 0.0,
                "unit_25": 0.0,
                "unit_26": 0.0,
                "unit_diff": 0.0,
                "count": 0,
            },
        )
        item["amount_25"] += row["amount_25"] or 0.0
        item["amount_26"] += row["amount_26"] or 0.0
        item["amount_diff"] = item["amount_26"] - item["amount_25"]
        item["unit_25"] += row["unit_25"] or 0.0
        item["unit_26"] += row["unit_26"] or 0.0
        item["unit_diff"] = item["unit_26"] - item["unit_25"]
        item["count"] += 1
    return sorted(bucket.values(), key=lambda item: abs(item["amount_diff"]), reverse=True)


def build_summary(rows: list[dict[str, Any]], categories: list[dict[str, Any]], meta_25: dict[str, Any], meta_26: dict[str, Any]) -> dict[str, Any]:
    detail_rows = [row for row in rows if not row["is_summary"]]
    detail_rows_excluding_fc = [row for row in detail_rows if row["code"] != "__FC__"]
    fc_rows = [row for row in detail_rows if row["code"] == "__FC__"]
    total_25 = sum(row["amount_25"] or 0.0 for row in detail_rows)
    total_26 = sum(row["amount_26"] or 0.0 for row in detail_rows)
    total_25_excluding_fc = sum(row["amount_25"] or 0.0 for row in detail_rows_excluding_fc)
    total_26_excluding_fc = sum(row["amount_26"] or 0.0 for row in detail_rows_excluding_fc)
    fc_amount_25 = sum(row["amount_25"] or 0.0 for row in fc_rows)
    fc_amount_26 = sum(row["amount_26"] or 0.0 for row in fc_rows)
    volume_25 = meta_25.get("volume") or 0
    volume_26 = meta_26.get("volume") or 0
    return {
        "account_count_25": sum(1 for row in detail_rows if row["status"] in {"both", "only_25"}),
        "account_count_26": sum(1 for row in detail_rows if row["status"] in {"both", "only_26"}),
        "both_count": sum(1 for row in detail_rows if row["status"] == "both"),
        "only_25_count": sum(1 for row in detail_rows if row["status"] == "only_25"),
        "only_26_count": sum(1 for row in detail_rows if row["status"] == "only_26"),
        "total_amount_25": total_25,
        "total_amount_26": total_26,
        "total_amount_diff": total_26 - total_25,
        "total_amount_25_excluding_fc": total_25_excluding_fc,
        "total_amount_26_excluding_fc": total_26_excluding_fc,
        "total_amount_diff_excluding_fc": total_26_excluding_fc - total_25_excluding_fc,
        "fc_amount_25": fc_amount_25,
        "fc_amount_26": fc_amount_26,
        "fc_amount_diff": fc_amount_26 - fc_amount_25,
        "total_unit_25": (total_25 / volume_25 * 1000) if volume_25 else None,
        "total_unit_26": (total_26 / volume_26 * 1000) if volume_26 else None,
        "total_unit_diff": ((total_26 / volume_26 * 1000) - (total_25 / volume_25 * 1000)) if volume_25 and volume_26 else None,
        "total_unit_25_excluding_fc": (total_25_excluding_fc / volume_25 * 1000) if volume_25 else None,
        "total_unit_26_excluding_fc": (total_26_excluding_fc / volume_26 * 1000) if volume_26 else None,
        "total_unit_diff_excluding_fc": ((total_26_excluding_fc / volume_26 * 1000) - (total_25_excluding_fc / volume_25 * 1000)) if volume_25 and volume_26 else None,
        "top_amount": sorted(detail_rows, key=lambda row: abs(row["amount_diff"] or 0), reverse=True)[:10],
        "top_unit": sorted(detail_rows, key=lambda row: abs(row["unit_diff"] or 0), reverse=True)[:10],
        "category_count": len(categories),
    }


def _source_label(account: SourceAccount | None) -> str:
    if account is None:
        return ""
    suffix = "；同编码多行汇总" if account.duplicate_count > 1 else ""
    rows = ",".join(str(row) for row in account.rows[:8])
    if account.duplicate_count > 8:
        rows += ",..."
    return f"{account.source} rows {rows}{suffix}"


def _diff(right: float | None, left: float | None) -> float:
    return (right or 0.0) - (left or 0.0)


def _has_current_month_value(account: SourceAccount | None) -> bool:
    return account is not None and (account.amount is not None or account.unit is not None)


def _is_high_impact(amount_diff: float, unit_diff: float) -> bool:
    return abs(amount_diff or 0.0) >= HIGH_AMOUNT_DIFF or abs(unit_diff or 0.0) >= HIGH_UNIT_DIFF


def _code_sort_key(code: str):
    if code == "__FC__":
        return (2, code)
    if code.isdigit():
        return (0, int(code))
    return (1, code)
