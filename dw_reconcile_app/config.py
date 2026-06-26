from __future__ import annotations

import os
from pathlib import Path


APP_HOST = "127.0.0.1"
APP_PORT = 8765

ROOT = Path(__file__).resolve().parents[1]


def _default_data_dir() -> Path:
    override = os.environ.get("DW_RECONCILE_DATA_DIR")
    if override:
        return Path(override)
    local_app_data = os.environ.get("LOCALAPPDATA")
    if local_app_data:
        return Path(local_app_data) / "DWReconcile"
    return ROOT / "outputs"


DATA_DIR = _default_data_dir()
TMP_DIR = DATA_DIR / "dw_reconcile_tmp"
CACHE_DIR = DATA_DIR / "dw_reconcile_cache"
DEFAULT_PAYLOAD_CACHE = CACHE_DIR / "dw_january_default_payload.json"
DEFAULT_EXPORT_CACHE = CACHE_DIR / "洗碗机1月科目差异分析_带数.xlsx"

DEFAULT_25_ACTUAL = Path(r"E:\桌面\李想\财务报表\2025 monthly Renta DW _ NOV_ACT.xlsx")
DEFAULT_26_ACTUAL = Path(r"E:\桌面\李想\财务报表\2026 MFG Variance Reporting_ DW_04.2026 v1.xlsx")
DEFAULT_TEMPLATE = Path(r"E:\桌面\李想\三张表\Candy洗碗机三张表-5.26.xlsx")
DEFAULT_4PLUS8_REFERENCE = Path(r"E:\桌面\李想\财务报表\4+8【最新】制造费用累计-大厨电（每月更新）-2026(3).xlsx")

PROJECT = "洗碗机"
MONTH = 1
MONTH_LABEL = "1月"

SHEET_CANDIDATES_25 = ["Renta DW _2025 ", "Renta DW _2025"]
SHEET_CANDIDATES_26 = ["Renta DW _2026", "Renta DW _2026 ", "SAP_ACT_EUR", "SAP Actual extraction"]

STATUS_LABELS = {
    "both": "两边都有",
    "only_25": "25有26无",
    "only_26": "26有25无",
}

CATEGORY_RULES = [
    {
        "name": "折旧",
        "keywords": [
            "cs_depreciation",
            "depreciation",
            "amortization",
            "functional currency impact",
            "currency impact",
        ],
    },
    {
        "name": "固定人工",
        "keywords": [
            "indirect labour",
            "indirect labor",
            "fixed labour",
            "fixed labor",
            "white collar",
            "salary-white",
            "cs_indirect",
            "cs_fixed labour",
            "cs_fixed labor",
        ],
    },
    {
        "name": "固定费用",
        "keywords": [
            "semifixed",
            "fixed utilities",
            "fixed cost",
            "g&a",
            "association dues",
            "it global",
            "it expense",
            "overhead",
            "cs_overhead",
            "园区",
        ],
    },
    {
        "name": "直接人工",
        "keywords": [
            "cs_direct labour",
            "cs_direct labor",
            "direct labour",
            "direct labor",
            "blue collar direct",
        ],
    },
    {
        "name": "变动费用",
        "keywords": [
            "variable",
            "scrap",
            "production consumable",
            "inventory adj",
            "obsolete",
            "asset sales",
            "cs_scrap",
            "cs_variable",
        ],
    },
]

DEFAULT_CATEGORY = "其他制造费"

HIGH_UNIT_DIFF = 0.1
HIGH_AMOUNT_DIFF = 10.0
