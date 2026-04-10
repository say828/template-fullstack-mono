# Example Generated Assets

## Role

- 이 폴더는 `스펙에셋빌더` example manifest 실행 결과를 저장한다.
- template consumer는 이 산출물을 golden sample로 보고 자신의 project-specific output 경로로 치환하면 된다.

## Regeneration

- `python3 sdd/99_toolchain/01_automation/spec_asset_builder.py --manifest sdd/99_toolchain/03_templates/asset_recipe_manifest.example.py --verify-exact`
- 또는 `python3 sdd/99_toolchain/01_automation/build_asset_recipes.py --verify-exact`
