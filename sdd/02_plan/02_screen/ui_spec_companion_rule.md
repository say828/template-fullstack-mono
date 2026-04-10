# ui spec companion rule

## Purpose

screen package 아래에 사람이 읽는 requirement companion과 visual IR companion을 같은 레벨로 유지하는 규칙을 정의한다.

## Rule

- 각 `ir/<surface>/<SCREEN_CODE>/` 폴더는 아래 companion set를 함께 가진다.
  - `ui_grid.csv` 또는 variant가 있으면 `ui_grid_desktop.csv`, `ui_grid_mobile.csv`
  - `ui_spec.md`
  - `ui_img.png`
  - `ui_context.json`
- `ui_spec.md`, `ui_img.png`, `ui_context.json`은 `ui_grid*.csv`와 같은 레벨에 둔다.
- `ui_grid*.csv`는 24-column semantic matrix로 현재 UI 평면 구조를 고정하는 canonical visual companion이다.
- `ui_spec.md`는 사용자 목표, 핵심 block, interaction, state를 빠르게 읽는 markdown companion이다.
- `ui_context.json`은 routing, access, artifact path, requirement mapping 같은 비시각 메타를 연결한다.
- `ui_img.png`는 visual crop evidence를 제공하지만, grid contract 자체를 대체하지 않는다.

## Read Order

1. `ui_grid*.csv`
2. `ui_spec.md`
3. `ui_context.json`
4. `ui_img.png`

## Adoption Note

- legacy screen package 문서가 남아 있더라도 canonical companion set는 `ui_grid*.csv`, `ui_spec.md`, `ui_img.png`, `ui_context.json`이다.
- 신규 정렬 작업부터는 desktop-only면 `ui_grid.csv`, dual variant면 `ui_grid_desktop.csv`와 `ui_grid_mobile.csv`를 반드시 같은 package에 추가한다.
