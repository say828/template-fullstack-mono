# IR Planning Root

- `ir/`는 canonical screen spec과 per-screen IR package를 surface 단위로 묶는 current-state planning root다.
- runtime UI correction의 직접 기준은 `ir/` 아래 per-screen artifact다.

## Package Baseline

- `<surface>/<surface>_screen_spec.pdf`
- `<surface>/registry.json`
- `<surface>/<SCREEN_CODE>/ui_grid.csv`
- `<surface>/<SCREEN_CODE>/ui_spec.md`
- `<surface>/<SCREEN_CODE>/ui_img.png`
- `<surface>/<SCREEN_CODE>/ui_context.json`

## Rule

- 각 screen folder의 canonical entry는 `<SCREEN_CODE>/` package다.
- desktop-only 화면은 `ui_grid.csv` 하나를 canonical로 쓴다.
- 같은 screen code에 desktop/mobile이 같이 존재할 때만 `ui_grid_desktop.csv`, `ui_grid_mobile.csv`를 추가로 두고, variant 선택은 `ui_context.json`에서 연결한다.
- `ui_grid*.csv`는 24-column semantic matrix로 작성하고, 각 셀에는 UI-only semantic token만 둔다.
- `ui_spec.md`는 screen-spec의 요구사항 텍스트를 사람이 읽기 좋게 옮긴 companion artifact다.
- `ui_img.png`는 current retained surface crop evidence다.
- `ui_context.json`은 grid/spec/img/runtime metadata 연결층이다.
