from __future__ import annotations

from pathlib import Path


ROOT = Path(__file__).resolve().parents[3]
REPORT_PATH = ROOT / "sdd/03_verify/10_test/spec_asset_factory_latest.md"
FACTORY_STATUS = "retired"
FACTORY_NOTE = "root sdd/01_planning/02_screen/assets inventory was removed; screen planning keeps guide rules in guidelines/*.json and screen image evidence in ir/<service>/<SCREEN_CODE>/ui_img.png."
