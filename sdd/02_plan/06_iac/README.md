# IaC Planning

- 이 폴더는 `sdd/02_plan` 아래에서 에이전트의 현재 개발 계획을 관리한다.
- 이 폴더는 배포, 런타임, 데이터베이스 운영 계획을 durable 문서로 유지한다.
- dated deploy plan은 남기지 않고, 현재 유효한 delivery/runtime 계획만 갱신한다.

## Common Rule

- 다른 `02_plan` 폴더와 동일하게 `README.md + durable 문서`만 유지한다.
- 실제 계획은 대상 문서를 직접 갱신하는 방식으로 관리하고, 날짜 기반 임시 plan 파일은 두지 않는다.
- 개발계가 있는 대상은 `branch push -> build -> main merge/push -> DEV(개발계) 배포 -> DEV(개발계) 검수`를 delivery 기본 루틴으로 포함한다.
