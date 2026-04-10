# IDN identity

- Owner: Codex
- Status: active

## Domain Summary

- domain code: `IDN`
- canonical source: `sdd/01_planning/01_feature/identity_feature_spec.md`
- update rule: 이 파일 안에서 feature code 기준으로 계속 갱신한다.

## Feature Items

| Feature Code | Use Case | Status | Current Notes |
| --- | --- | --- | --- |
| `IDN-F001 ~ IDN-F005` | 판매자 가입, 역할 기반 로그인, 비밀번호 재설정, 현재 세션 조회 | `implemented` | `client/web`, `client/admin`과 `server/contexts/identity` 기준 기본 인증 흐름이 운영 중이다. |

## Acceptance Criteria

- [x] identity TODO는 `IDN` feature range 기준으로 유지한다.

## Current Notes

- seller/dealer/admin 로그인 variation은 screen TODO와 traceability 문서에서 세분화한다.
- 로컬 runtime bootstrap 계정 정책은 `sdd/02_plan/01_feature/identity_local_bootstrap_accounts.md`에서 관리한다.

## Latest Verification

- `sdd/03_verify/01_feature/domain_verification.md`
