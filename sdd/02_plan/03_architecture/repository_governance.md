# repository governance

- Owner: Codex
- Status: active

## Scope

- `main` canonical branch 운영
- repo path와 주요 문서 구조 정합성 유지
- SDD current-state 원칙 유지

## Acceptance Criteria

- [x] `main`을 canonical branch로 유지한다.
- [x] repo 경로와 주요 문서는 현재 저장소 구조를 기준으로 설명한다.
- [x] plan/verify current-state 문서는 dated history 없이 durable 문서만 유지한다.
- [x] repo-impact 작업의 기본 skill surface가 `sdd`로 명시된다.
- [x] mutation/workflow UI 변경은 full-layer E2E gate 없이는 완료로 기록하지 않는다.
- [x] mutation/workflow E2E는 seed/reset precondition과 사용자 피드백 확인까지 포함한다.

## Current Notes

- 앱 코드 경로와 실행 경계는 각 저장소 구조에 맞게 정의한다.
- 공통 정책 문서에는 서비스별 파일 경로를 하드코딩하지 않는다.
- SDD는 최종 일관성 문서만 유지하고, raw 운영 로그는 runtime logging system에 남긴다.
- 이 저장소에서는 구현, 리뷰, 문서/테스트/배포 변경 같은 repo-impact 작업을 `sdd` 기본 흐름으로 처리한다.
- 화면/모달/API mutation/workflow 작업은 타입체크나 build만으로 완료 판정을 내리지 않고, 실제 DEV E2E를 completion gate로 사용한다.
- URL 전이만으로는 workflow 성공을 판정하지 않고, success/error feedback과 persistence 반영까지 확인한다.

## Validation

- `AGENTS.md`
- `sdd/03_verify/03_architecture/repository_governance.md`
