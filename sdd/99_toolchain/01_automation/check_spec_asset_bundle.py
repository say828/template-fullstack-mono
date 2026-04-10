#!/usr/bin/env python3
from __future__ import annotations

from datetime import datetime, timezone

from spec_asset_recipe_manifest import FACTORY_NOTE, FACTORY_STATUS, REPORT_PATH, ROOT


def main() -> int:
    REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
    generated_at = datetime.now(timezone.utc).isoformat()
    lines = [
        "# Spec Asset Factory Report",
        "",
        f"- generated_at: {generated_at}",
        f"- status: `{FACTORY_STATUS}`",
        "- asset_root: `retired`",
        "- materialized_asset_count: `n/a`",
        f"- note: {FACTORY_NOTE}",
        "",
        "## Current Rule",
        "",
    ]
    lines.append("- root `sdd/01_planning/02_screen/assets/` inventory is no longer used.")
    lines.append("- screen planning keeps guide rules in `sdd/01_planning/02_screen/guidelines/*.json` and screen image evidence in `ir/<service>/<SCREEN_CODE>/ui_img.png`.")
    lines.append("- reusable runtime assets remain in app repos or dedicated asset builders.")
    REPORT_PATH.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(REPORT_PATH)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
