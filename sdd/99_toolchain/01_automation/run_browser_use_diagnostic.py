#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path
from typing import Sequence

from browser_use_diagnostic_manifest import BROWSER_USE_DIAGNOSTICS, get_diagnostic_by_id


BROWSER_USE_VENV_PYTHON = Path(__file__).resolve().parents[1] / "02_exactness" / "browser_use" / ".venv" / "bin" / "python"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Run Browser Use diagnostics through the canonical SDD toolchain entrypoint.",
    )
    parser.add_argument("--list", action="store_true", help="List registered diagnostic ids and exit.")
    parser.add_argument("--suite", action="append", dest="suites", help="Diagnostic id from browser_use_diagnostic_manifest.py. Repeatable.")
    parser.add_argument("--base-url", help="Override target base URL.")
    parser.add_argument("--arg", action="append", dest="extra_args", default=[], help="Additional diagnostic arg. Repeatable.")
    parser.add_argument("--dry-run", action="store_true", help="Print command and exit without running.")
    return parser.parse_args()


def emit_suite_list() -> None:
    json.dump(BROWSER_USE_DIAGNOSTICS, sys.stdout, ensure_ascii=False, indent=2, default=str)
    sys.stdout.write("\n")


def build_command(script: str, *, base_url: str | None, extra_args: Sequence[str]) -> list[str]:
    python_bin = str(BROWSER_USE_VENV_PYTHON) if BROWSER_USE_VENV_PYTHON.exists() else sys.executable
    command = [python_bin, script]
    if base_url:
        command.extend(["--base-url", base_url])
    command.extend(extra_args)
    return command


def main() -> int:
    args = parse_args()
    if args.list:
        emit_suite_list()
        return 0

    if not args.suites:
        raise SystemExit("At least one --suite is required unless --list is used.")

    exit_code = 0
    for suite_id in args.suites:
        suite = get_diagnostic_by_id(suite_id)
        command = build_command(str(suite["script"]), base_url=args.base_url, extra_args=args.extra_args)
        if args.dry_run:
            print(json.dumps({"suite": suite_id, "command": command}, ensure_ascii=False))
            continue
        completed = subprocess.run(command, check=False)
        if completed.returncode != 0:
            exit_code = completed.returncode
    return exit_code


if __name__ == "__main__":
    raise SystemExit(main())
