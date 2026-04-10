#!/usr/bin/env python3
from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parents[3]
STATUS_PATH = ROOT / "sdd/03_verify/06_iac/service_status.md"
REPORT_PATH = ROOT / "sdd/03_verify/06_iac/service_status_check.md"


def main() -> int:
    if not STATUS_PATH.is_file():
        print(f"missing_service_status={STATUS_PATH}")
        return 1

    generated_at = datetime.now(timezone.utc).isoformat()
    REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
    lines = [
        "# Delivery Status Factory Report",
        "",
        f"- generated_at: {generated_at}",
        f"- source_status: `{STATUS_PATH.relative_to(ROOT)}`",
        "- result: present",
    ]
    REPORT_PATH.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(REPORT_PATH)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
