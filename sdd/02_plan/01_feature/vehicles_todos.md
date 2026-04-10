# VEH vehicles

- Owner: Codex
- Status: active

## Domain Summary

- domain code: `VEH`
- canonical source: `sdd/01_planning/01_feature/vehicles_feature_spec.md`
- update rule: 이 파일 안에서 feature code 기준으로 계속 갱신한다.

## Feature Items

| Feature Code | Use Case | Status | Current Notes |
| --- | --- | --- | --- |
| `VEH-F001 ~ VEH-F002` | 판매자 차량 등록, 내 차량 목록 조회 | `implemented` | seller vehicle intake와 목록 조회는 `client/web` seller route와 `server/contexts/vehicles` 기준으로 정렬돼 있다. |

## Acceptance Criteria

- [x] vehicle intake backlog는 domain feature range 기준으로 유지한다.

## Current Notes

- 입찰과 거래 단계 전이는 `bidding`, `trades` domain에서 별도 관리한다.

## Latest Verification

- `sdd/03_verify/01_feature/domain_verification.md`
