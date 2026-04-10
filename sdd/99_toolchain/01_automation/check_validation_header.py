#!/usr/bin/env python3
"""
Validate the presence (and optional freshness) of the Template validation header.

By default this script checks that the target markdown file contains both
"Status:" and "Last updated:" header lines within the first ~60 lines.

It is designed to be run in CI on pull_request events and locally by
contributors prior to opening a PR. The check is intentionally lenient by
default (presence-only). Stricter enforcement can be enabled via flags.

Defaults:
- Target file: .codex/skills/otro/validation/validation.md
- Required fields: Status, Last updated
- No staleness check unless --max-age-days is provided

Exit codes:
 0  OK (headers present and constraints satisfied)
 1  File not found
 2  Missing Status header
 3  Missing Last updated header
 4  Last updated is older than --max-age-days
 5  Status header missing trailing (Txxxxxx) while --require-task-token is set

Examples:
  # Presence-only validation (default target file)
  python sdd/99_toolchain/01_automation/check_validation_header.py

  # Enforce freshness within 2 days and require task token in Status
  python sdd/99_toolchain/01_automation/check_validation_header.py --max-age-days 2 --require-task-token

  # Validate a different file path
  python sdd/99_toolchain/01_automation/check_validation_header.py --file sdd/03_verify/10_test/my_validation.md
"""
from __future__ import annotations

import argparse
import os
import re
from datetime import datetime, timezone
from typing import Tuple

HEADER_STATUS_RE = re.compile(r"^Status:\s*(?P<value>.*)$")
HEADER_UPDATED_RE = re.compile(r"^Last updated:\s*(?P<value>.*)$")
TASK_TOKEN_RE = re.compile(r"\(T\d+\)")
DATE_RE = re.compile(r"^(?P<date>\d{4}-\d{2}-\d{2})(?:\s*\([^)]*\))?$")

DEFAULT_FILE = (
    ".codex/skills/otro/validation/validation.md"
)


class CheckError(Exception):
    def __init__(self, code: int, message: str):
        super().__init__(message)
        self.code = code


def _parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Validate Template validation header")
    p.add_argument("--file", default=DEFAULT_FILE, help="Path to validation.md file")
    p.add_argument(
        "--max-age-days",
        type=int,
        default=None,
        help="Fail if Last updated is older than N days (optional)",
    )
    p.add_argument(
        "--require-task-token",
        action="store_true",
        help="Require trailing (Txxxxxx) token in Status line",
    )
    return p.parse_args()


def _read_header_lines(path: str) -> Tuple[str | None, str | None]:
    with open(path, "r", encoding="utf-8") as f:
        lines = f.readlines()
    status_line = updated_line = None
    for i, line in enumerate(lines[: min(60, len(lines))]):
        if status_line is None and HEADER_STATUS_RE.match(line):
            status_line = line.rstrip("\n")
        if updated_line is None and HEADER_UPDATED_RE.match(line):
            updated_line = line.rstrip("\n")
        if status_line and updated_line:
            break
    return status_line, updated_line


def _parse_last_updated(updated_line: str) -> datetime:
    m = HEADER_UPDATED_RE.match(updated_line)
    assert m
    value = m.group("value").strip()
    dm = DATE_RE.match(value)
    if not dm:
        # Fallback: try to parse first 10 chars as YYYY-MM-DD
        value = value[:10]
        dm = DATE_RE.match(value)
    if not dm:
        raise CheckError(3, f"Unrecognized Last updated format: '{updated_line}'")
    date_str = dm.group("date")
    try:
        dt = datetime.strptime(date_str, "%Y-%m-%d").replace(tzinfo=timezone.utc)
    except ValueError as e:
        raise CheckError(3, f"Invalid Last updated date: {date_str}") from e
    return dt


def _validate(path: str, max_age_days: int | None, require_task_token: bool) -> None:
    if not os.path.exists(path):
        raise CheckError(1, f"Validation file not found: {path}")

    status_line, updated_line = _read_header_lines(path)
    if not status_line:
        raise CheckError(2, "Missing 'Status:' header line")
    if not updated_line:
        raise CheckError(3, "Missing 'Last updated:' header line")

    # Optional: require trailing (Txxxxxx)
    if require_task_token:
        m = HEADER_STATUS_RE.match(status_line)
        assert m
        status_value = m.group("value").strip()
        if not TASK_TOKEN_RE.search(status_value):
            raise CheckError(5, "Status header missing trailing (Txxxxxx) token")

    # Optional: staleness check
    if max_age_days is not None:
        last_dt = _parse_last_updated(updated_line)
        now = datetime.now(timezone.utc)
        age_days = (now - last_dt).days
        if age_days > max_age_days:
            raise CheckError(
                4,
                f"Last updated {age_days} days ago (> {max_age_days} days)",
            )


def main() -> int:
    args = _parse_args()
    try:
        _validate(args.file, args.max_age_days, args.require_task_token)
    except CheckError as e:
        print(f"validation-header: FAIL - {e}")
        return e.code
    except Exception as e:  # unexpected
        print(f"validation-header: ERROR - {e}")
        return 99
    else:
        print("validation-header: OK")
        return 0


if __name__ == "__main__":
    raise SystemExit(main())
