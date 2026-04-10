# BIDDING FEATURE SPEC

- 작성일: 2026-03-14
- 작성 버전: `1.0.0`
- 대상 도메인: `bidding`
- 기능 코드: `BID`
- 기준 산출물:
  - [README.md](./README.md)
  - [server/contexts/bidding](/home/sh/Documents/Github/template-fullstack-mono/server/contexts/bidding)

## 1. Purpose

- 매물 탐색, 입찰 참여, 판매자 입찰 마감 유스케이스를 `bidding` context 기준으로 정리한다.
- 판매자, 딜러, 관리자 시야 차이는 동일 입찰 aggregate에 대한 서로 다른 query와 command로 분리한다.

## 2. Canonical Domain Summary

- Primary Backend Module: `server/contexts/bidding`
- Primary Owner Service: `BiddingService`
- Connected Surfaces: `client/web`, `client/admin`
- Covered Feature Codes: `BID-F001 ~ BID-F008`

## 3. Bounded Context Map

| Bounded Context | Primary Backend Owner | Module | Aggregate / Model |
| --- | --- | --- | --- |
| `Auction Listing` | `BiddingService` | `bidding` | `VehicleListing`, `Bid`, `BidCloseDecision` |

## 4. Actor Definitions

| Actor | Description | Domain Role |
| --- | --- | --- |
| `dealer` | Template 심사를 통과해 입찰 시장에 접근할 수 있는 인증 딜러다. | 매물을 조회하고 입찰을 제출·수정·취소하는 입찰 참여자다. |
| `seller` | 차량을 출품한 인증 판매자다. | 본인 차량의 입찰 현황을 확인하고 최종 마감을 결정한다. |
| `admin` | 입찰 활동을 감독하는 운영 관리자다. | 차량 또는 딜러 단위 입찰 내역을 감사 목적으로 조회한다. |

## 5. Use Case Matrix

| Feature Code | Use Case | Actor | Bounded Context | Aggregate / Model | Type | Preconditions | Domain Outcome | Invariant / Business Rule |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `BID-F001` | 입찰 가능 매물 조회 | dealer | `Auction Listing` | `VehicleListing` | `Query` | 승인된 딜러 세션이 유효하다. | 현재 입찰 가능한 매물 목록을 조회한다. | 비승인 딜러는 입찰 시장 read model에 접근하지 않는다. |
| `BID-F002` | 신규 입찰 제출 | dealer | `Auction Listing` | `Bid`, `VehicleListing` | `Command` | 대상 매물이 입찰 가능 상태다. | 현재 딜러의 입찰가가 기록된다. | 마감된 매물이나 최소 조건 미달 금액은 제출하지 않는다. |
| `BID-F003` | 내 입찰가 수정 | dealer | `Auction Listing` | `Bid` | `Command` | 기존 내 입찰이 존재하고 매물이 아직 진행 중이다. | 딜러의 기존 입찰가가 갱신된다. | 본인 입찰만 수정할 수 있고 마감 후 수정은 금지한다. |
| `BID-F004` | 내 입찰 취소 | dealer | `Auction Listing` | `Bid` | `Command` | 기존 내 입찰이 존재하고 취소 가능 상태다. | 딜러 입찰이 취소된다. | 취소 종료된 입찰은 다시 취소하지 않는다. |
| `BID-F005` | 내 입찰 목록 조회 | dealer | `Auction Listing` | `Bid`, `VehicleListing` | `Query` | 승인된 딜러 세션이 유효하다. | 딜러가 참여한 입찰 건과 상태를 조회한다. | 다른 딜러의 입찰 목록은 조회하지 않는다. |
| `BID-F006` | 판매자 차량 입찰 현황 조회 | seller | `Auction Listing` | `Bid`, `VehicleListing` | `Query` | 판매자 세션과 대상 차량이 존재한다. | 특정 차량의 입찰 수, 최고가, 참여 내역을 조회한다. | 본인 차량이 아닌 입찰 현황은 열람하지 않는다. |
| `BID-F007` | 판매자 입찰 마감과 낙찰 확정 | seller | `Auction Listing` | `BidCloseDecision`, `Bid` | `Command` | 대상 차량이 입찰 마감 가능 상태다. | 입찰이 종료되고 낙찰 딜러 또는 종료 결과가 확정된다. | 마감 완료된 차량은 다시 마감하지 않는다. |
| `BID-F008` | 관리자 입찰 감사 조회 | admin | `Auction Listing` | `Bid`, `VehicleListing` | `Query` | 관리자 세션이 유효하다. | 특정 딜러 또는 차량 단위의 입찰 내역을 조회한다. | 관리자 query는 입찰 상태를 변경하지 않는다. |
