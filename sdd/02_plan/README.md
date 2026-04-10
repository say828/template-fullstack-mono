# Plan Governance

## Purpose

- `sdd/02_plan/`은 에이전트의 현재 개발 계획을 관리하는 루트다.
- 계획 문서는 히스토리를 쌓지 않고, 대상별 durable 파일을 덮어써 최종 일관성만 유지한다.

## Common Rule

- `02_plan`의 모든 폴더는 같은 규칙을 따른다.
- 각 폴더의 `README.md`는 현재 계획 규칙과 운영 방식을 설명한다.
- 실제 계획은 대상 식별자 기준 durable 문서를 직접 갱신하는 방식으로 유지한다.
- 개발계가 있는 대상은 `구현(branch) -> branch push -> build -> main merge/push -> DEV(개발계) 배포 -> DEV 검수 -> 문서 갱신`을 기본 루틴으로 포함한다.
- 날짜 기반 임시 계획 메모나 히스토리성 plan 파일은 남기지 않는다.

## Section Rule

- `01_feature/`: 기능별 TODO
- `02_screen/`: 화면별 TODO
- `03_architecture/`: 구조, 거버넌스, 마이그레이션 같은 횡단 작업
- `04_data/`: 데이터 모델 정렬 계획
- `05_api/`: API contract/backlog 정렬 계획
- `06_iac/`: 인프라 작업
- `07_integration/`: 외부/내부 연동 계획
- `08_nonfunctional/`: 비기능 요구 정렬 계획
- `09_security/`: 보안 계획
- `10_test/`: 테스트 전략과 검증 계획

## Durable TODO Rule

- 기능 계획은 `sdd/02_plan/01_feature/<domain>_todos.md`를 갱신하고, 파일 안에서는 기능코드 기준으로만 관리한다.
- 화면 계획은 `sdd/02_plan/02_screen/<service>_todos.md`를 갱신하고, 파일 안에서는 화면코드 기준으로 관리한다.
- architecture, data, API, IAC, integration, nonfunctional, security, test 계획도 section별 durable 문서를 직접 갱신한다.
- 파일명은 날짜가 아니라 대상 식별자를 기준으로 정한다.

## Final-Only Rule

- `sdd/02_plan`에는 dated plan history를 두지 않는다.
- 과거 계획에서 여전히 유효한 내용은 durable governance, backlog, TODO 문서로 흡수한다.
- runtime log나 운영 이벤트 타임라인은 backend/application logging system이 맡고, plan은 항상 현재 기준만 보여준다.
