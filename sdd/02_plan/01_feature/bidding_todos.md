# BID bidding

- Owner: Codex
- Status: active

## Domain Summary

- domain code: `BID`
- canonical source: `sdd/01_planning/01_feature/bidding_feature_spec.md`
- update rule: 이 파일 안에서 feature code 기준으로 계속 갱신한다.

## Feature Items

| Feature Code | Use Case | Status | Current Notes |
| --- | --- | --- | --- |
| `BID-F001 ~ BID-F008` | 매물 조회, 입찰 제출·수정·취소, 판매자 마감, 관리자 감사 조회 | `implemented` | dealer market, seller vehicle bids, admin trade audit read-model이 현재 runtime baseline이다. |

## Acceptance Criteria

- [x] bidding TODO는 dealer/seller/admin 관점을 단일 bidding backlog로 유지한다.

## Current Notes

- 세부 상태별 상세 화면은 screen TODO와 traceability 문서에서 partial 여부를 계속 갱신한다.

## Latest Verification

- `sdd/03_verify/01_feature/domain_verification.md`
