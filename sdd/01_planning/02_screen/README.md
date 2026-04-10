# Screen Planning

## Naming

- canonical artifact: `{surface}_screen_spec.pdf`
- screen code format: `{SURFACE}-S{NNN}`

## Rule

- screen spec은 surface 기준 산출물이다.
- route, UI block, CTA, interaction, transition은 screen spec 또는 screen-local companion에 남긴다.
- reusable asset planning은 `assets/`, reusable guide는 `guidelines/`, per-screen package는 `ir/` 아래에 둔다.
- data 상세는 `04_data`, 구조 경계는 `03_architecture`에서 다룬다.
- screen spec에서 파생되는 재사용 자산은 가능한 한 generator로 재생성 가능해야 한다.

## Toolchain

- asset recipe builder: [`spec_asset_builder.py`](../../99_toolchain/01_automation/spec_asset_builder.py)
- compatibility wrapper: [`build_asset_recipes.py`](../../99_toolchain/01_automation/build_asset_recipes.py)
- screen guide builder: [`screen_design_guide_builder.py`](../../99_toolchain/01_automation/screen_design_guide_builder.py)
- example recipe manifest: [`asset_recipe_manifest.example.py`](../../99_toolchain/03_templates/asset_recipe_manifest.example.py)

## UI IR Note

- screen-local planning이 필요하면 `ir/` package를 canonical agent input으로 준비한다.
- per-screen canonical artifact는 `<SCREEN_CODE>/ui_grid.csv`, `ui_spec.md`, `ui_img.png`, `ui_context.json` 조합이다.
- desktop-only 화면은 `ui_grid.csv` 하나를 canonical로 두고, 같은 screen code에 desktop/mobile이 같이 존재할 때만 `ui_grid_desktop.csv`, `ui_grid_mobile.csv`로 분리한다.
- `ui_grid*.csv`는 24-column semantic matrix를 유지하고, route/access/api 같은 기능 메타는 `ui_context.json` 쪽에 둔다.
