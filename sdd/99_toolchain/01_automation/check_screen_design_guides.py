#!/usr/bin/env python3
from __future__ import annotations

from datetime import datetime, timezone

from screen_design_guide_manifest import GUIDE_README, GUIDE_ROOT, REPORT_PATH, ROOT, SOURCE_ARTIFACTS


def main() -> int:
    missing = [path for path in SOURCE_ARTIFACTS if not path.exists()]
    if missing:
        for path in missing:
            print(f"missing_source={path}")
        return 1

    if not GUIDE_ROOT.is_dir():
        print(f"missing_guide_root={GUIDE_ROOT}")
        return 1

    if not GUIDE_README.is_file():
        print(f"missing_guide_readme={GUIDE_README}")
        return 1

    REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
    generated_at = datetime.now(timezone.utc).isoformat()
    lines = [
        "# Screen Design Guide Factory Report",
        "",
        f"- generated_at: {generated_at}",
        f"- guide_root: `{GUIDE_ROOT.relative_to(ROOT)}`",
        f"- guide_readme: `{GUIDE_README.relative_to(ROOT)}`",
        "",
        "## Source Bundle",
        "",
    ]
    for path in SOURCE_ARTIFACTS:
        lines.append(f"- `{path.relative_to(ROOT)}`")
    REPORT_PATH.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(REPORT_PATH)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
