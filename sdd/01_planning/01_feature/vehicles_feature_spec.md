# VEHICLES FEATURE SPEC

- 작성일: 2026-03-14
- 작성 버전: `1.0.0`
- 대상 도메인: `vehicles`
- 기능 코드: `VEH`
- 기준 산출물:
  - [README.md](./README.md)
  - [server/contexts/vehicles](/home/sh/Documents/Github/template-fullstack-mono/server/contexts/vehicles)

## 1. Purpose

- 판매자 차량 등록과 기본 매물 보유 현황을 `vehicles` context 기준으로 문서화한다.
- 이후 입찰, 거래 전이는 별도 `bidding`, `trades` 도메인으로 분리한다.

## 2. Canonical Domain Summary

- Primary Backend Module: `server/contexts/vehicles`
- Primary Owner Service: `VehicleService`
- Connected Surfaces: `client/web`
- Covered Feature Codes: `VEH-F001 ~ VEH-F002`

## 3. Bounded Context Map

| Bounded Context | Primary Backend Owner | Module | Aggregate / Model |
| --- | --- | --- | --- |
| `Vehicle Intake` | `VehicleService` | `vehicles` | `Vehicle`, `VehicleImage`, `SellerVehicleDraft` |

## 4. Actor Definitions

| Actor | Description | Domain Role |
| --- | --- | --- |
| `seller` | 차량을 출품하는 인증 판매자다. | 차량 매물을 등록하고 본인 소유 매물 목록을 조회한다. |

## 5. Use Case Matrix

| Feature Code | Use Case | Actor | Bounded Context | Aggregate / Model | Type | Preconditions | Domain Outcome | Invariant / Business Rule |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `VEH-F001` | 판매자 차량 등록 | seller | `Vehicle Intake` | `Vehicle`, `VehicleImage` | `Command` | 판매자 세션과 차량 등록 필수 정보가 존재한다. | 새 차량 매물이 생성된다. | 판매자 본인 소유가 아닌 계정으로 차량을 등록하지 않는다. |
| `VEH-F002` | 판매자 내 차량 목록 조회 | seller | `Vehicle Intake` | `Vehicle` | `Query` | 판매자 세션이 유효하다. | 현재 판매자 소유 차량 목록과 상태를 조회한다. | 본인 차량만 조회할 수 있다. |
