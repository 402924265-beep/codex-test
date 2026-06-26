from __future__ import annotations

import argparse
import contextlib
import socket
import threading
import time
import webbrowser
from http.server import ThreadingHTTPServer

from .config import APP_HOST, APP_PORT
from .server import ReconcileRequestHandler


def _port_available(host: str, port: int) -> bool:
    with contextlib.closing(socket.socket(socket.AF_INET, socket.SOCK_STREAM)) as sock:
        sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        try:
            sock.bind((host, port))
        except OSError:
            return False
    return True


def _pick_port(host: str, preferred_port: int) -> int:
    if preferred_port == 0 or _port_available(host, preferred_port):
        return preferred_port
    with contextlib.closing(socket.socket(socket.AF_INET, socket.SOCK_STREAM)) as sock:
        sock.bind((host, 0))
        return int(sock.getsockname()[1])


def run_desktop_app(host: str = APP_HOST, port: int = APP_PORT, *, open_browser: bool = True) -> None:
    actual_port = _pick_port(host, port)
    server = ThreadingHTTPServer((host, actual_port), ReconcileRequestHandler)
    actual_host, actual_port = server.server_address[:2]
    display_host = "127.0.0.1" if actual_host in {"", "0.0.0.0"} else actual_host
    url = f"http://{display_host}:{actual_port}/"

    print("DW reconciliation app is running.", flush=True)
    print(f"Open: {url}", flush=True)
    print("Close this window to stop the app.", flush=True)

    if open_browser:
        threading.Thread(target=_open_browser_after_start, args=(url,), daemon=True).start()

    server.serve_forever()


def _open_browser_after_start(url: str) -> None:
    time.sleep(0.5)
    webbrowser.open(url)


def main(argv: list[str] | None = None) -> None:
    parser = argparse.ArgumentParser(description="Run the DW reconciliation desktop app.")
    parser.add_argument("--host", default=APP_HOST)
    parser.add_argument("--port", type=int, default=APP_PORT)
    parser.add_argument("--no-browser", action="store_true", help="Start the server without opening a browser")
    args = parser.parse_args(argv)
    run_desktop_app(args.host, args.port, open_browser=not args.no_browser)


if __name__ == "__main__":
    main()
