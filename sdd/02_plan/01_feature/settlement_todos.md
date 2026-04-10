# STL settlement

- Owner: Codex
- Status: active

## Domain Summary

- domain code: `STL`
- canonical source: `sdd/01_planning/01_feature/settlement_feature_spec.md`
- update rule: 이 파일 안에서 feature code 기준으로 계속 갱신한다.

## Feature Items

| Feature Code | Use Case | Status | Current Notes |
| --- | --- | --- | --- |
| `STL-F001 ~ STL-F005` | 정산 계좌 조회·등록·수정, 판매자/관리자 정산 기록 조회 | `implemented` | seller settings와 admin settlement surface에서 현재 ledger 조회 흐름이 유지된다. |

## Acceptance Criteria

- [x] settlement TODO는 계좌와 ledger view 범위를 유지한다.

## Current Notes

- 거래 단계 전이 자체는 `trades`가 owner다.

## Latest Verification

- `sdd/03_verify/01_feature/domain_verification.md`
