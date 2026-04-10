# Test Planning

- 이 폴더는 `sdd/02_plan` 아래에서 에이전트의 현재 개발 계획을 관리한다.
- 이 폴더는 반복적으로 유지해야 하는 검증 전략과 테스트 계획을 durable 문서로 관리한다.
- 날짜별 테스트 계획 메모는 두지 않고, 현재 유지해야 하는 전략과 matrix만 갱신한다.

## Common Rule

- 다른 `02_plan` 폴더와 동일하게 `README.md + durable 문서`만 유지한다.
- 실제 계획은 검증 전략 문서를 직접 갱신하는 방식으로 관리하고, 날짜 기반 임시 plan 파일은 두지 않는다.
- 검증 전략과 회귀 검수 범위 선택은 각각 durable 문서로 유지하고, direct target-only 검수로 축약하지 않는다.
- 기능 정합성 E2E gate는 checklist source와 requirement-to-test-case traceability를 가진 별도 durable 문서로 유지한다.
