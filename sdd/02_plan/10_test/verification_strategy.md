# verification strategy

- Owner: Codex
- Status: active

## Scope

- In scope:
  - feature/screen 구현 시 기본 검증 전략
  - backend/frontend/build/proof 확인 조합
- Out of scope:
  - 개별 test run timeline 보관

## Acceptance Criteria

- [x] feature 변경은 최소한 관련 integration 또는 targeted verification surface를 남긴다.
- [x] screen 변경은 build + proof 또는 targeted verification을 기본으로 한다.
- [x] SDD verify는 durable current-summary만 유지한다.
- [x] 회귀 검수 범위는 direct, upstream, downstream, shared surface까지 retained current-state로 선택한다.
- [x] 승인된 기능 요구사항은 checklist source와 requirement-to-test-case traceability를 가진 functional E2E gate를 남긴다.
- [x] persistence/migration 영향 기능은 migration apply와 schema parity를 verification surface에 포함한다.

## Execution Checklist

- [x] backend, frontend, proof verification 조합을 current strategy로 정리한다.
- [x] UI parity 같은 proof harness 경로를 current structure로 맞춘다.
- [x] verification plan도 dated memo가 아니라 durable 문서로 유지한다.
- [x] regression surface selection baseline을 별도 durable 문서로 유지한다.

## Current Notes

- backend는 `pytest` targeted suite, frontend는 build, proof는 ui parity harness와 Playwright exactness runner를 기본 전략으로 둔다.
- screen local exactness의 canonical entrypoint는 `python3 sdd/99_toolchain/01_automation/run_playwright_exactness.py --suite <suite-id> --base-url <url>`이다.
- direct `npx playwright test ...` 호출은 디버깅 예외로만 쓰고, retained verification command는 toolchain wrapper 기준으로 남긴다.
- screen spec/PDF generator와 parity harness는 current toolchain path를 기준으로 검증한다.
- verify는 날짜별 memo 대신 현재 retained checks와 residual risk만 남긴다.
- 회귀 검수는 `sdd/02_plan/10_test/regression_verification.md`를 기준으로 direct target과 upstream/downstream/shared surface를 함께 선택한다.
- build, parity, targeted test는 selected regression surface를 채우는 수단이지 scope 자체를 대체하지 않는다.
- 기능 정합성 gate는 검수 확인서/acceptance checklist/approved use case inventory 기준으로 test case를 파생시키고, 승인된 요구사항마다 최소 1개 이상의 retained case를 남긴다.
- auth, data mutation, persistence, upload/download, workflow side effect가 있는 기능은 UI/API/persistence/side effect를 함께 보는 full-layer E2E gate를 기본 completion surface로 본다.
- migration이나 schema drift가 영향을 줄 수 있는 기능은 migration apply check와 DEV/PROD schema parity verification이 빠지면 verification complete로 보지 않는다.

## Validation

- current references:
  - `sdd/03_verify/README.md`
  - `sdd/03_verify/10_test/verification_harness.md`
  - `sdd/02_plan/10_test/regression_verification.md`
  - `sdd/02_plan/10_test/functional_e2e_gate.md`
