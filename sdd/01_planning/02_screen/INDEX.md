# Screen Planning

이 디렉터리는 화면 명세 입력을 둔다.

## Expected Inputs

- canonical `*_screen_spec.pdf`
- 필요한 경우 screen guide, asset inventory, UI IR package
- drift 확인에 필요한 reference capture 또는 proof link

## UI IR Baseline

- screen-local companion은 `ir/` 아래 per-screen package로 둔다.
- canonical visual contract는 24-column `ui_grid*.csv`다.
- desktop-only는 `ui_grid.csv`, 같은 screen code에 desktop/mobile이 같이 있으면 `ui_grid_desktop.csv`, `ui_grid_mobile.csv`를 사용한다.

build source와 generator는 `sdd/99_toolchain/01_automation` 아래에 둔다.
