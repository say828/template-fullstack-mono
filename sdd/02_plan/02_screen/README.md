# Screen TODO Rule

## Common Rule

- 이 폴더는 `sdd/02_plan` 아래에서 화면 작업의 현재 실행 계획을 관리한다.
- 다른 `02_plan` 폴더와 동일하게 `README.md + durable TODO 파일`만 유지하고, dated plan history는 두지 않는다.

## Canonical Rule

- 화면 계획은 surface별 durable TODO 파일로 관리한다.
- 같은 파일 안에서 screen code 기준으로 계속 갱신한다.
- 과거 screen plan 문서는 별도 보관하지 않고, 현재 기준 README와 TODO만 유지한다.
- screen spec PDF 전체 페이지를 직접 해석하기보다 필요한 경우 `ir/` package를 canonical agent input으로 사용한다.
- UI IR의 canonical visual contract는 24-column `ui_grid*.csv`다.
- desktop-only 화면은 `ui_grid.csv` 하나를 사용하고, 같은 screen code에 desktop/mobile이 같이 존재할 때만 `ui_grid_desktop.csv`, `ui_grid_mobile.csv`로 분리한다.
- layout 외 메타는 `ui_context.json`에 둔다.

## Naming

- 파일명은 날짜 prefix를 쓰지 않는다.
- 권장 형식: `{surface}_todos.md`

## Minimum Sections

- surface summary
- shared constraints or baseline
- screen items
- delivery phases or backlog
- latest verification references

## Template

- [`_screen_todo_template.md`](_screen_todo_template.md)
- [screen_ir_schema.md](./screen_ir_schema.md)
