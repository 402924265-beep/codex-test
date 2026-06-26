from __future__ import annotations

import argparse
import json
import mimetypes
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any
from urllib.parse import unquote, urlparse

from .config import APP_HOST, APP_PORT, DEFAULT_25_ACTUAL, DEFAULT_26_ACTUAL, DEFAULT_4PLUS8_REFERENCE, DEFAULT_PAYLOAD_CACHE, MONTH_LABEL, PROJECT
from .exporter import build_export_workbook
from .reconcile import ReconcileOptions, reconcile_dw_january


STATIC_DIR = Path(__file__).with_name("static")


def build_config_payload() -> dict[str, Any]:
    return {
        "project": PROJECT,
        "monthLabel": MONTH_LABEL,
        "defaultActual25Path": str(DEFAULT_25_ACTUAL),
        "defaultActual26Path": str(DEFAULT_26_ACTUAL),
        "defaultReference4plus8Path": str(DEFAULT_4PLUS8_REFERENCE),
    }


def merge_analysis(payload: dict[str, Any]) -> None:
    analysis_by_code = payload.get("analysisByCode") or {}
    for row in payload.get("rows", []):
        code = str(row.get("code") or "")
        if code in analysis_by_code:
            row["analysis"] = analysis_by_code[code]


class ReconcileRequestHandler(BaseHTTPRequestHandler):
    server_version = "DWReconcile/0.1"

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path == "/api/config":
            self._send_json(build_config_payload())
            return
        self._serve_static(parsed.path)

    def do_POST(self) -> None:
        parsed = urlparse(self.path)
        try:
            if parsed.path == "/api/reconcile":
                self._handle_reconcile()
                return
            if parsed.path == "/api/export":
                self._handle_export()
                return
            self._send_json({"error": "接口不存在"}, status=HTTPStatus.NOT_FOUND)
        except Exception as exc:
            self._send_json({"error": str(exc)}, status=HTTPStatus.BAD_REQUEST)

    def log_message(self, format: str, *args: Any) -> None:
        return

    def _handle_reconcile(self) -> None:
        body = self._read_json()
        actual_25 = Path(body.get("actual25Path") or DEFAULT_25_ACTUAL)
        actual_26 = Path(body.get("actual26Path") or DEFAULT_26_ACTUAL)
        reference_4plus8 = Path(body.get("reference4plus8Path") or DEFAULT_4PLUS8_REFERENCE)
        if _is_default_request(actual_25, actual_26, reference_4plus8):
            cached = load_default_payload_cache()
            if cached is not None:
                self._send_json(cached)
                return
        result = reconcile_dw_january(
            ReconcileOptions(
                actual_25_path=actual_25,
                actual_26_path=actual_26,
                reference_4plus8_path=reference_4plus8,
            )
        )
        self._send_json(result)

    def _handle_export(self) -> None:
        payload = self._read_json()
        merge_analysis(payload)
        content = build_export_workbook(payload)
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
        self.send_header("Content-Disposition", 'attachment; filename="dw_january_reconciliation.xlsx"')
        self.send_header("Content-Length", str(len(content)))
        self.end_headers()
        self.wfile.write(content)

    def _read_json(self) -> dict[str, Any]:
        length = int(self.headers.get("Content-Length") or "0")
        if length <= 0:
            return {}
        raw = self.rfile.read(length)
        return json.loads(raw.decode("utf-8"))

    def _send_json(self, payload: dict[str, Any], *, status: HTTPStatus = HTTPStatus.OK) -> None:
        content = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(content)))
        self.end_headers()
        self.wfile.write(content)

    def _serve_static(self, request_path: str) -> None:
        relative = "index.html" if request_path in {"", "/"} else unquote(request_path).lstrip("/")
        target = (STATIC_DIR / relative).resolve()
        if not _is_relative_to(target, STATIC_DIR.resolve()) or not target.is_file():
            self._send_json({"error": "文件不存在"}, status=HTTPStatus.NOT_FOUND)
            return
        content = target.read_bytes()
        mime_type = mimetypes.guess_type(str(target))[0] or "application/octet-stream"
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", f"{mime_type}; charset=utf-8" if mime_type.startswith("text/") else mime_type)
        self.send_header("Content-Length", str(len(content)))
        self.end_headers()
        self.wfile.write(content)


def _is_relative_to(path: Path, parent: Path) -> bool:
    try:
        path.relative_to(parent)
        return True
    except ValueError:
        return False


def load_default_payload_cache() -> dict[str, Any] | None:
    if not DEFAULT_PAYLOAD_CACHE.exists():
        return None
    return json.loads(DEFAULT_PAYLOAD_CACHE.read_text(encoding="utf-8"))


def _is_default_request(actual_25: Path, actual_26: Path, reference_4plus8: Path) -> bool:
    return (
        _same_path(actual_25, DEFAULT_25_ACTUAL)
        and _same_path(actual_26, DEFAULT_26_ACTUAL)
        and _same_path(reference_4plus8, DEFAULT_4PLUS8_REFERENCE)
    )


def _same_path(left: Path, right: Path) -> bool:
    try:
        return left.resolve() == right.resolve()
    except OSError:
        return str(left).casefold() == str(right).casefold()


def run(host: str = APP_HOST, port: int = APP_PORT) -> None:
    server = ThreadingHTTPServer((host, port), ReconcileRequestHandler)
    display_host = "127.0.0.1" if host in {"", "0.0.0.0"} else host
    print(f"DW reconciliation app running at http://{display_host}:{port}", flush=True)
    server.serve_forever()


def main(argv: list[str] | None = None) -> None:
    parser = argparse.ArgumentParser(description="Run the DW reconciliation web app.")
    parser.add_argument("--host", default=APP_HOST)
    parser.add_argument("--port", type=int, default=APP_PORT)
    args = parser.parse_args(argv)
    run(args.host, args.port)


if __name__ == "__main__":
    main()
