# Feature TODO Rule

## Common Rule

- 이 폴더는 `sdd/02_plan` 아래에서 에이전트의 현재 개발 계획을 관리한다.
- 다른 `02_plan` 폴더와 동일하게 `README.md + durable TODO 파일`만 유지하고, dated plan history는 두지 않는다.

## Canonical Rule

- 기능 계획은 domain별 durable TODO 파일로 관리한다.
- 신규 작업이 생겨도 날짜별 파일을 추가하지 않는다.
- 같은 domain 파일 안에서는 canonical 기능코드 기준 표만 계속 갱신한다.
- service feature spec은 source reference로만 사용하고, active TODO는 domain 파일만 유지한다.

## Naming

- 파일명은 날짜 prefix를 쓰지 않는다.
- 권장 형식: `{domain}_todos.md`

## Location

- active feature TODO는 `sdd/02_plan/01_feature/` root에 둔다.

## Minimum Sections

- domain summary
- feature items
- acceptance criteria
- current notes
- latest verification

## Template

- [`_feature_todo_template.md`](_feature_todo_template.md)
