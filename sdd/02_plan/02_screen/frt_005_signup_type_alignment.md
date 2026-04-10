# FRT_005 Signup Type Alignment Plan

- Owner: Codex
- Status: completed

## Scope

- 대상 화면: `FRT_005 회원가입유형선택`
- 대상 runtime: `client/web`
- 대상 툴체인: `sdd/99_toolchain/01_automation/run_playwright_exactness.py`, `sdd/99_toolchain/01_automation/run_browser_use_diagnostic.py`

## Assumptions

- `FRT_005`는 public landing/auth shell을 공유한다.
- pixel-perfect strict parity보다 구조, 카드 배치, CTA hierarchy, role handoff가 우선이다.
- Browser Use는 canonical gate가 아니라 구조/레이아웃 진단 evidence다.

## Acceptance Criteria

- `/signup` route가 `FRT_005` screen IR과 일치한다.
- header, brand, title/subtitle, 2-card selection, login handoff, footer copy가 spec 구조와 유사하게 유지된다.
- seller/dealer 선택 카드는 같은 row에서 유사한 폭과 간격으로 배치된다.
- Playwright exactness suite가 `/signup` 구조를 검증한다.
- Browser Use diagnostic이 `/signup` 구조/카드 내용/레이아웃 지표를 JSON evidence로 남긴다.
- `client/web` 빌드가 성공한다.

## Execution Checklist

- [x] current screen IR/spec/runtime route mapping을 확인한다.
- [x] exactness toolchain ownership과 runner mismatch를 정리한다.
- [x] `FRT_005` 화면을 public auth shell 기준으로 정렬한다.
- [x] Playwright exactness suite와 Browser Use diagnostic을 추가한다.
- [x] 실행 결과와 SDD build/verify trail을 남긴다.

## Current Notes

- 기존 `SignupTypePage`는 `AuthScaffold` 기반이라 `FRT_002~004` public auth shell과 결이 달랐다.
- 기존 exactness 문서에는 `playwright`와 `browser_use` 역할 설명 모순이 있었고, Browser Use는 skill이 아니라 exactness package의 diagnostic runner였다.
- `playwright_exactness_manifest.py`는 비어 있었고, `run_playwright_exactness.py`가 실제 active template suite를 실행하지 못하는 상태였다.
- `FRT_005`는 public shell, 2-card row, login handoff, footer copy 기준으로 재정렬했다.
- 카드 설명 본문은 `15px`로 상향했고, CTA 버튼 높이는 `66px`로 조정했다.
- `SellerSignupPage`, `DealerSignupPage`, `AuthScaffold`와 public support pages의 `React` runtime import 누락을 보정해 white-screen runtime failure를 막았다.
- Playwright exactness와 Browser Use diagnostic은 둘 다 `http://127.0.0.1:3003/signup`에 대해 pass했고, 결과 artifact는 `sdd/99_toolchain/02_exactness/results/`에 남겼다.

## Validation

- `pnpm --dir client/web build`
- `python3 sdd/99_toolchain/01_automation/run_playwright_exactness.py --suite frt-005-signup-type --base-url http://127.0.0.1:3003`
- `python3 sdd/99_toolchain/01_automation/run_browser_use_diagnostic.py --suite frt-005-signup-type --base-url http://127.0.0.1:3003`
