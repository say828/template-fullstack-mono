# repository governance verification

## Status

- pass

## Retained Checks

- `AGENTS.md`와 `sdd/README.md`가 final-only SDD 규칙을 설명한다.
- `AGENTS.md`, `README.md`, skill/policy 문서가 `task-fit work branch -> origin branch push -> main merge/push -> DEV deploy` 순서를 설명한다.
- plan/verify current-state 문서가 history-style section 없이 정리된다.
- root skill alias와 repo guide가 repo-impact 작업의 기본 skill을 `sdd`로 설명한다.
- `AGENTS.md`, repo guide, skill/policy 문서가 mutation/workflow UI 변경의 full-layer E2E gate를 completion requirement로 설명한다.
- `AGENTS.md`, repo guide, skill/policy 문서가 seed/reset precondition과 사용자 피드백 확인을 mutation/workflow E2E requirement로 설명한다.
- planning data modeling root가 `04_data`로 유지된다.
- screen build/verify summary가 service split 아래에 정리된다.

## Residual Risk

- toolchain이나 skill이 legacy path를 다시 참조하면 구조와 충돌한다.

## Incident Note

- 위반 원인은 mutation/workflow UI 작업에서 타입체크/코드 경로 검토를 완료 기준처럼 취급하고 실제 브라우저 E2E gate를 생략한 데 있었다.
- 추가로 mutable seller demo state가 이전 재현 시도에서 이미 변경되었는데 reset precondition을 맞추지 않아, 재시도 시 hidden state drift가 발생했다.
- 재발 방지를 위해 skill/repo guide/agent policy에 `seed/reset precondition + success/error feedback + persistence + 후속 화면 상태`까지 E2E gate에 포함하도록 강화했다.
