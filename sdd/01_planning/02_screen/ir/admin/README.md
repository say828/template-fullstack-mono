# Admin Screen IR

- canonical source: `sdd/01_planning/02_screen/ir/admin/admin_screen_spec.pdf`
- builder: `python3 sdd/99_toolchain/01_automation/build_template_screen_ir.py`
- validator: `python3 sdd/99_toolchain/01_automation/validate_template_screen_ir.py`
- canonical artifacts: `<SCREEN_CODE>/ui_grid.csv`, `<SCREEN_CODE>/ui_spec.md`, `<SCREEN_CODE>/ui_img.png`, `<SCREEN_CODE>/ui_context.json`
- variant rule: desktop-only screens use `ui_grid.csv`; if one screen code carries both desktop and mobile variants, split into `ui_grid_desktop.csv` and `ui_grid_mobile.csv` and record the chosen variant in `ui_context.json`
- package shape: per-screen folder under each service root with service-level `registry.json` index
- row rule: each csv row is a horizontal screen slice and each file keeps a 24-column semantic matrix
