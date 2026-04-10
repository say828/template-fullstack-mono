# SETTLEMENT FEATURE SPEC

- 작성일: 2026-03-14
- 작성 버전: `1.0.0`
- 대상 도메인: `settlement`
- 기능 코드: `STL`
- 기준 산출물:
  - [README.md](./README.md)
  - [server/contexts/settlement](/home/sh/Documents/Github/template-fullstack-mono/server/contexts/settlement)

## 1. Purpose

- 판매자 정산 계좌와 정산 기록 조회 기능을 `settlement` context 기준으로 정리한다.
- 실제 거래 단계 전이는 `trades`가 소유하고, 정산 계좌와 정산 ledger view는 `settlement`가 소유한다.

## 2. Canonical Domain Summary

- Primary Backend Module: `server/contexts/settlement`
- Primary Owner Service: `SettlementService`
- Connected Surfaces: `client/web`, `client/admin`
- Covered Feature Codes: `STL-F001 ~ STL-F005`

## 3. Bounded Context Map

| Bounded Context | Primary Backend Owner | Module | Aggregate / Model |
| --- | --- | --- | --- |
| `Settlement Ledger` | `SettlementService` | `settlement` | `SettlementAccount`, `SettlementRecord` |

## 4. Actor Definitions

| Actor | Description | Domain Role |
| --- | --- | --- |
| `seller` | 차량 거래 대금을 정산받는 인증 판매자다. | 본인 정산 계좌를 등록·수정하고 정산 기록을 조회한다. |
| `admin` | 정산 ledger를 감독하는 운영 관리자다. | 전체 정산 상태를 조회해 운영상 이상 여부를 확인한다. |

## 5. Use Case Matrix

| Feature Code | Use Case | Actor | Bounded Context | Aggregate / Model | Type | Preconditions | Domain Outcome | Invariant / Business Rule |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `STL-F001` | 내 정산 계좌 목록 조회 | seller | `Settlement Ledger` | `SettlementAccount` | `Query` | 판매자 세션이 유효하다. | 현재 판매자의 정산 계좌 목록을 조회한다. | 본인 계좌만 조회할 수 있다. |
| `STL-F002` | 정산 계좌 등록 | seller | `Settlement Ledger` | `SettlementAccount` | `Command` | 계좌 등록 필수 값이 제공된다. | 새 정산 계좌가 생성된다. | 허용되지 않은 계좌 형식이나 중복 기본 계좌 규칙 위반은 허용하지 않는다. |
| `STL-F003` | 정산 계좌 수정 | seller | `Settlement Ledger` | `SettlementAccount` | `Command` | 수정 대상 계좌가 존재한다. | 계좌 정보가 갱신된다. | 본인 소유가 아닌 계좌는 수정하지 않는다. |
| `STL-F004` | 판매자 정산 기록 조회 | seller | `Settlement Ledger` | `SettlementRecord` | `Query` | 판매자 세션이 유효하다. | 판매자 기준 정산 완료 또는 대기 기록을 조회한다. | 본인 거래 정산만 열람할 수 있다. |
| `STL-F005` | 관리자 정산 기록 조회 | admin | `Settlement Ledger` | `SettlementRecord` | `Query` | 관리자 세션이 유효하다. | 전체 정산 ledger와 상태를 조회한다. | 관리자 query는 정산 상태를 변경하지 않는다. |
