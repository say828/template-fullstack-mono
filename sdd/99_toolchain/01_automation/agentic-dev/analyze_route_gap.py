#!/usr/bin/env python3
import json
import sys
from pathlib import Path


FAIL_STATUSES = {"missing", "stateful"}


def summarize(path: Path) -> int:
    data = json.loads(path.read_text(encoding="utf-8"))
    summary = data.get("summary", {})
    screens = data.get("screens", [])
    print(f"route_gap_file={path}")
    print(f"service={data.get('service', 'unknown')}")
    print(f"total={summary.get('total', 0)}")
    print(f"direct={summary.get('direct', 0)}")
    print(f"shared={summary.get('shared', 0)}")
    print(f"stateful={summary.get('stateful', 0)}")
    print(f"missing={summary.get('missing', 0)}")
    for row in screens:
        if isinstance(row, dict) and row.get("status") in FAIL_STATUSES:
            print(f"- {row.get('id', 'unknown')}: {row.get('status')}")
    return 0


def check_gate(path: Path) -> int:
    data = json.loads(path.read_text(encoding="utf-8"))
    summary = data.get("summary")
    screens = data.get("screens")
    if not isinstance(summary, dict):
        print("route_gap_gate=fail reason=missing_summary")
        return 2
    if not isinstance(screens, list):
        print("route_gap_gate=fail reason=missing_screens")
        return 2

    failing_rows = []
    for row in screens:
        if not isinstance(row, dict):
            failing_rows.append(("unknown", "invalid_row"))
            continue
        status = str(row.get("status", "")).strip().lower()
        identifier = row.get("id") or row.get("title") or "unknown"
        if status in FAIL_STATUSES:
            failing_rows.append((identifier, status))

    if failing_rows or int(summary.get("missing", 0) or 0) > 0 or int(summary.get("stateful", 0) or 0) > 0:
        print("route_gap_gate=fail")
        print(f"summary_missing={summary.get('missing', 0)}")
        print(f"summary_stateful={summary.get('stateful', 0)}")
        for identifier, status in failing_rows[:20]:
            print(f"- {identifier}: {status}")
        return 2

    print("route_gap_gate=pass")
    return 0


def main() -> int:
    if len(sys.argv) < 2:
        print("Usage: analyze_route_gap.py [--gate] <route-gap-json>", file=sys.stderr)
        return 1

    gate_mode = False
    args = sys.argv[1:]
    if args and args[0] == "--gate":
        gate_mode = True
        args = args[1:]
    if not args:
        print("Usage: analyze_route_gap.py [--gate] <route-gap-json>", file=sys.stderr)
        return 1

    path = Path(args[0])
    if not path.is_file():
        print(f"File not found: {path}", file=sys.stderr)
        return 1

    if gate_mode:
        return check_gate(path)
    return summarize(path)


if __name__ == "__main__":
    raise SystemExit(main())
