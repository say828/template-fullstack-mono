# Template Runtime Unification

- Owner: Codex
- Status: completed

## Scope

- customer-facing runtime를 `client/web` 하나로 통합한다.
- 기존 `client/web`와 `client/web` ownership을 `client/web`로 흡수한다.
- `client/admin`만 별도 runtime으로 유지한다.
- README, CI, deploy workflow, parity/toolchain contract, screen IR runtime reference를 새 구조에 맞춘다.

## Assumptions

- 공개 landing/auth/support route와 seller/dealer 업무 route는 이미 `client/web/src/app/App.tsx`에서 함께 호스팅할 수 있다.
- admin runtime은 기존처럼 별도 build/deploy 단위로 유지한다.
- 외부 infra secret 이름은 그대로 유지해도 runtime folder rename과 충돌하지 않는다.

## Acceptance Criteria

- repo의 customer-facing runtime 경로가 `client/web`로 일관된다.
- `client/web`와 `client/web`은 더 이상 active runtime 참조로 남지 않는다.
- CI/deploy build path가 `client/web`와 `client/admin`만 사용한다.
- screen IR, planning/build/verify docs가 public/customer surface ownership을 `client/web` 기준으로 설명한다.
- `pnpm --dir client/web build`와 `pnpm --dir client/admin build`가 성공한다.

## Execution Checklist

- [x] partial rename 상태와 남은 참조를 inventory 한다.
- [x] planning/runtime governance와 task plan을 `client/web` 기준으로 갱신한다.
- [x] code/config/workflow/toolchain reference를 `client/web` 기준으로 정리한다.
- [x] screen IR metadata와 retained build/verify 기록을 새 runtime ownership으로 정리한다.
- [x] customer/admin build를 검증한다.

## Current Notes

- 기존 `client/web`와 `client/web`은 이미 filesystem 상에서 제거되고 `client/web`가 새 customer runtime으로 생성된 상태였다.
- repo 전반에는 `client/app`, `client/landing` path가 README, CI, deploy, ui parity contract, screen IR metadata, retained docs에 혼재해 있었다.
- 이 작업은 runtime 통합이 목적이므로 public landing surface도 별도 앱이 아니라 `client/web` 내부 public route로 유지한다.

## Validation

- `git status --short`
- `rg -n "client/app|client/landing|template-client-app|template-client-landing|5175|4175" README.md .github client/web sdd --glob '!**/node_modules/**' --glob '!**/dist/**'`
- `pnpm --dir client/web build`
- `pnpm --dir client/admin build`
