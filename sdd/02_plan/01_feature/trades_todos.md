# TRD trades

- Owner: Codex
- Status: active

## Domain Summary

- domain code: `TRD`
- canonical source: `sdd/01_planning/01_feature/trades_feature_spec.md`
- update rule: 이 파일 안에서 feature code 기준으로 계속 갱신한다.

## Feature Items

| Feature Code | Use Case | Status | Current Notes |
| --- | --- | --- | --- |
| `TRD-F001 ~ TRD-F011` | 거래 워크플로우 조회, 검차, 감가, 인도, 송금, 정산 완료, 강제 종료 | `partial` | 핵심 상태머신과 운영 route는 구현돼 있지만 screen variation은 일부 압축돼 `partial` surface가 남아 있다. |

## Acceptance Criteria

- [x] trades TODO는 거래 파이프라인 전체를 단일 domain backlog로 유지한다.

## Current Notes

- 상태별 압축 화면과 세부 운영 variation은 `spec_traceability.md`에서 지속 점검한다.

## Latest Verification

- `sdd/03_verify/01_feature/domain_verification.md`
