#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
from typing import Sequence

from playwright_exactness_manifest import PLAYWRIGHT_HARNESS_ROOT, PLAYWRIGHT_SUITES, get_suite_by_id


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Run retained Playwright exactness suites through the canonical SDD toolchain entrypoint.",
    )
    parser.add_argument("--list", action="store_true", help="List registered suite ids and exit.")
    parser.add_argument("--suite", action="append", dest="suites", help="Suite id from playwright_exactness_manifest.py. Repeatable.")
    parser.add_argument("--base-url", help="Override BASE_URL.")
    parser.add_argument("--api-base-url", help="Override API_BASE_URL.")
    parser.add_argument("--browser", help="Forward Playwright --browser option.")
    parser.add_argument("--grep", help="Forward Playwright -g/--grep option.")
    parser.add_argument("--reporter", default="list", help="Playwright reporter. Default: list")
    parser.add_argument("--dry-run", action="store_true", help="Print command and exit without running.")
    parser.add_argument("--arg", action="append", dest="extra_args", default=[], help="Additional Playwright CLI arg. Repeatable.")
    return parser.parse_args()


def emit_suite_list() -> None:
    json.dump(PLAYWRIGHT_SUITES, sys.stdout, ensure_ascii=False, indent=2)
    sys.stdout.write("\n")


def build_command(suite_ids: Sequence[str], *, grep: str | None, browser: str | None, reporter: str, extra_args: Sequence[str]) -> list[str]:
    command = ["npm", "test", "--"]
    for suite_id in suite_ids:
        suite = get_suite_by_id(suite_id)
        command.append(str(suite["spec"]))
    if grep:
        command.extend(["-g", grep])
    if browser:
        command.append(f"--browser={browser}")
    if reporter:
        command.append(f"--reporter={reporter}")
    command.extend(extra_args)
    return command


def main() -> int:
    args = parse_args()
    if args.list:
        emit_suite_list()
        return 0

    if not args.suites:
        raise SystemExit("At least one --suite is required unless --list is used.")

    command = build_command(
        args.suites,
        grep=args.grep,
        browser=args.browser,
        reporter=args.reporter,
        extra_args=args.extra_args,
    )

    env = os.environ.copy()
    if args.base_url:
        env["BASE_URL"] = args.base_url
    if args.api_base_url:
        env["API_BASE_URL"] = args.api_base_url

    if args.dry_run:
        print(f"cwd={PLAYWRIGHT_HARNESS_ROOT}")
        print("command=" + " ".join(command))
        if args.base_url:
            print(f"BASE_URL={args.base_url}")
        if args.api_base_url:
            print(f"API_BASE_URL={args.api_base_url}")
        return 0

    completed = subprocess.run(command, cwd=PLAYWRIGHT_HARNESS_ROOT, env=env, check=False)
    return completed.returncode


if __name__ == "__main__":
    raise SystemExit(main())
