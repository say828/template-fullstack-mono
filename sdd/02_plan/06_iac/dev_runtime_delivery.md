# dev runtime delivery

- Owner: Codex
- Status: active

## Scope

- In scope:
  - template repo의 DEV runtime/delivery baseline
  - screen spec capture, frontend build, backend/root compose runtime 확인 기준
- Out of scope:
  - 특정 서비스의 release timeline

## Acceptance Criteria

- [x] DEV 검수 시 visible surface와 current build artifact 확인 기준을 명시한다.
- [x] runtime bootstrap과 delivery path는 current structure만 설명한다.
- [x] delivery plan도 final-only 문서로 유지한다.

## Execution Checklist

- [x] current delivery path를 정리한다.
- [x] build artifact와 runtime health 확인 기준을 정리한다.
- [x] dated deploy memo를 제거하고 durable 기준으로 대체한다.

## Current Notes

- template repo는 service별 frontend build와 backend test/boot path를 current runtime baseline으로 둔다.
- screen spec capture/PDF generation도 current toolchain path를 기준으로 유지한다.
- visible build artifact 확인과 targeted test/build 조합을 delivery 검수 기본으로 사용한다.
- `main` push만으로 DEV workflow가 열리지 않는 변경은 `workflow_dispatch`로 frontend/API DEV deploy를 수동 실행한다.
- self-hosted runner가 잡히지 않으면 deploy gate는 `미완료`로 유지하고, queued run id와 current live check를 `03_verify`에 남긴다.

## Validation

- current references:
  - `sdd/03_verify/06_iac/dev_runtime_delivery.md`
  - `sdd/03_verify/06_iac/dev_runtime_delivery.md`
