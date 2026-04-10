# DLR dealers

- Owner: Codex
- Status: active

## Domain Summary

- domain code: `DLR`
- canonical source: `sdd/01_planning/01_feature/dealers_feature_spec.md`
- update rule: 이 파일 안에서 feature code 기준으로 계속 갱신한다.

## Feature Items

| Feature Code | Use Case | Status | Current Notes |
| --- | --- | --- | --- |
| `DLR-F001 ~ DLR-F006` | 딜러 가입, 승인대기 조회, 심사 상세, 승인/반려, 문서 미리보기 | `implemented` | 관리자 심사와 딜러 가입 흐름은 현재 backend contract와 admin surface 기준으로 연결돼 있다. |

## Acceptance Criteria

- [x] dealers TODO는 심사와 가입 흐름을 단일 domain backlog로 유지한다.

## Current Notes

- admin 상세 variation과 문서 preview route는 screen TODO에서 계속 관리한다.

## Latest Verification

- `sdd/03_verify/01_feature/domain_verification.md`
