# SDD Governance

## Purpose

- `sdd/`는 템플릿 레포의 canonical delivery system이다.
- 모든 SDD 산출물은 현재 기준의 최종 일관성만 설명한다.

## Final-Only Rule

- `sdd/` 안에는 날짜별 히스토리, archive, release log, gate log 같은 누적 기록을 두지 않는다.
- 같은 대상의 후속 작업은 새 문서를 만들지 않고 기존 durable 문서를 덮어써 갱신한다.
- raw runtime log, backend log, infrastructure log는 SDD가 아니라 해당 운영 시스템의 역할이다.

## Section Map

- `01_planning/`: 현재 canonical spec과 source reference
- `02_plan/`: feature spec과 screen spec을 입력으로 한 에이전트 작업 기획
- `03_verify/`: 사람이 읽기 쉬운 테스트 시나리오, 테스트 케이스, 실행 결과
- `99_toolchain/`: SDD를 유지하는 생성기, 자동화, 정책 문서

## Flow Rule

- canonical SDD flow는 `01_planning -> 02_plan -> implementation -> 03_verify`다.
- 구현은 3번 단계지만 별도 산출물 폴더를 남기지 않는다.
- 화면 관련 작업은 `01_planning`의 screen spec/UI IR 검토 뒤, 구현 타겟 화면 캡처로 현재 drift를 확인한 후 구현에 반영한다.
- `sdd-dev`는 레거시다. 이 저장소의 canonical skill name은 `sdd`다.

## Test Rule

- 화면/기능 구현의 완료 기준은 기능 단위 바운더리로 정한 full-layer e2e 통과다.
- 기능 E2E 케이스는 체크리스트 항목/요구사항과 매핑되어야 하며, 각 승인 항목당 최소 1개 `E2E-*` 케이스를 가져야 한다.
- auth, mutation, persistence, upload/download, workflow side-effect, notification, migration 영향 기능은 `UI + API + 영속성 + side effect`를 함께 보는 full-layer e2e가 기본이다.
- 승인되지 않은 누락 항목은 residual risk가 아니라 즉시 incomplete gate로 처리한다.
- 테스트 산출은 테스트 코드(코드베이스) + `sdd/03_verify` 사람용 케이스/결과 기록으로 남긴다.
