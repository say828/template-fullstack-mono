# screen ir schema

- scope: `sdd/01_planning/02_screen/ir/` 계층의 canonical artifact schema

## Package

```text
ir/<surface>/
  registry.json
  <surface>_screen_spec.pdf
  <SCREEN_CODE>/
    ui_grid.csv
    ui_spec.md
    ui_img.png
    ui_context.json
```

## ui_grid.csv

- canonical visual plane artifact
- 24-column semantic matrix
- each cell contains only UI semantic tokens
- desktop-only screen uses `ui_grid.csv`
- same screen code with both desktop/mobile variants uses `ui_grid_desktop.csv` and `ui_grid_mobile.csv`

## ui_spec.md

- human-readable companion for screen-spec requirement text
- no grid syntax or routing metadata
- summarize user goal, key blocks, interactions, and state expectations from the spec

## ui_img.png

- retained crop or surface evidence for the same screen package
- used to compare current runtime capture against the approved spec surface

## ui_context.json

- connection layer between `ui_grid*.csv`, `ui_spec.md`, `ui_img.png`, and runtime metadata
- recommended fields:
  - `surface`
  - `screen_code`
  - `screen_name`
  - `grid.columns`
  - `grid.variants`
  - `primary_route`
  - `access`
  - `runtime_entry`
  - `artifact_paths`
  - `requirement_sections`
  - `block_requirement_mapping`
  - `notes`

## registry.json

- surface-level inventory and index
- list of available screen codes, names, and package paths
- do not duplicate per-screen requirement mapping that already belongs in `ui_context.json`

## Extraction Pipeline

1. inventory: `screen_spec_manifest.py`
2. source crop: approved screen surface extraction
3. visual IR: `ui_grid*.csv` semantic matrix
4. requirement companion: `ui_spec.md`
5. runtime linkage and mapping: `ui_context.json`
