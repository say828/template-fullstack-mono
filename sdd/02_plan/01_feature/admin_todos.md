# ADM admin

- Owner: Codex
- Status: active

## Domain Summary

- domain code: `ADM`
- canonical source: `sdd/01_planning/01_feature/admin_feature_spec.md`
- update rule: 이 파일 안에서 feature code 기준으로 계속 갱신한다.

## Feature Items

| Feature Code | Use Case | Status | Current Notes |
| --- | --- | --- | --- |
| `ADM-F001 ~ ADM-F012` | 권한 그룹, 관리자 계정, 감사 로그, 블랙리스트, 운영 대시보드, 리포트 조회 | `partial` | 핵심 admin backend와 콘솔 surface는 구현돼 있지만 일부 운영 read-model과 variation은 traceability 기준 `partial`이다. |

## Acceptance Criteria

- [x] admin TODO는 운영 계정/권한/감사/차단 범위를 single source로 유지한다.

## Current Notes

- admin feature backlog와 admin screen backlog는 분리 유지한다.

## Latest Verification

- `sdd/03_verify/01_feature/domain_verification.md`
