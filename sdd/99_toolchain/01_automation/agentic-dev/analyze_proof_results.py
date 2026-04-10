#!/usr/bin/env python3
import json
import sys
from pathlib import Path


VALID_OK_STATUSES = {"passed"}
VALID_FAIL_STATUSES = {"failed", "size_mismatch", "missing_reference", "capture_error"}


def collect_cases(node, bucket):
    if isinstance(node, dict):
        score = None
        identifier = None
        for key in ("diff_ratio", "score", "difference_ratio"):
            value = node.get(key)
            if isinstance(value, (int, float)):
                score = float(value)
                break
        for key in ("screen_code", "id", "name", "case", "route"):
            value = node.get(key)
            if isinstance(value, str) and value.strip():
                identifier = value.strip()
                break
        if score is not None:
            bucket.append((identifier or f"case_{len(bucket)+1}", score))
        for value in node.values():
            collect_cases(value, bucket)
    elif isinstance(node, list):
        for item in node:
            collect_cases(item, bucket)


def summarize(path: Path) -> int:
    data = json.loads(path.read_text(encoding="utf-8"))
    cases = []
    collect_cases(data, cases)
    unique = []
    seen = set()
    for identifier, score in sorted(cases, key=lambda item: item[1], reverse=True):
        key = (identifier, score)
        if key in seen:
            continue
        seen.add(key)
        unique.append((identifier, score))

    print(f"proof_file={path}")
    print(f"cases_found={len(unique)}")
    if not unique:
        print("No comparable cases with numeric diff_ratio/score found.")
        return 0
    failing = [item for item in unique if item[1] > 0]
    best = min(unique, key=lambda item: item[1])
    worst = max(unique, key=lambda item: item[1])
    print(f"failing_cases={len(failing)}")
    print(f"best_case={best[0]} score={best[1]:.8f}")
    print(f"worst_case={worst[0]} score={worst[1]:.8f}")
    for identifier, score in failing[:10]:
        print(f"- {identifier}: {score:.8f}")
    return 0


def check_gate(path: Path) -> int:
    data = json.loads(path.read_text(encoding="utf-8"))
    summary = data.get("summary")
    screens = data.get("screens")
    if not isinstance(summary, dict):
        print("proof_gate=fail reason=missing_summary")
        return 2
    if not isinstance(screens, list):
        print("proof_gate=fail reason=missing_screens")
        return 2

    failing_statuses = []
    for screen in screens:
        if not isinstance(screen, dict):
            failing_statuses.append(("unknown", "invalid_row"))
            continue
        status = screen.get("status")
        identifier = screen.get("id") or screen.get("route") or "unknown"
        if status in VALID_OK_STATUSES:
            continue
        if status in VALID_FAIL_STATUSES:
            failing_statuses.append((identifier, status))
        else:
            failing_statuses.append((identifier, f"unknown_status:{status}"))

    capture_error = int(summary.get("capture_error", 0) or 0)
    failed = int(summary.get("failed", 0) or 0)
    missing_reference = int(summary.get("missing_reference", 0) or 0)
    matched = bool(summary.get("matched", False))

    if failing_statuses or capture_error > 0 or failed > 0 or missing_reference > 0 or not matched:
        print("proof_gate=fail")
        print(f"summary_failed={failed}")
        print(f"summary_missing_reference={missing_reference}")
        print(f"summary_capture_error={capture_error}")
        print(f"summary_matched={matched}")
        for identifier, status in failing_statuses[:20]:
            print(f"- {identifier}: {status}")
        return 2

    print("proof_gate=pass")
    return 0


def main() -> int:
    if len(sys.argv) < 2:
        print("Usage: analyze_proof_results.py [--gate] <proof-json>", file=sys.stderr)
        return 1

    gate_mode = False
    args = sys.argv[1:]
    if args and args[0] == "--gate":
        gate_mode = True
        args = args[1:]
    if not args:
        print("Usage: analyze_proof_results.py [--gate] <proof-json>", file=sys.stderr)
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
