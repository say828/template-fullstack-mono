# TRADES FEATURE SPEC

- 작성일: 2026-03-14
- 작성 버전: `1.0.0`
- 대상 도메인: `trades`
- 기능 코드: `TRD`
- 기준 산출물:
  - [README.md](./README.md)
  - [server/contexts/trades](/home/sh/Documents/Github/template-fullstack-mono/server/contexts/trades)

## 1. Purpose

- 검차, 감가, 인도, 송금, 정산 완료까지 이어지는 거래 파이프라인 유스케이스를 `trades` context 기준으로 정리한다.
- 판매자, 딜러, 관리자 각 surface의 단계별 화면은 동일 trade workflow aggregate를 다른 관점에서 조회하거나 확정하는 것으로 해석한다.

## 2. Canonical Domain Summary

- Primary Backend Module: `server/contexts/trades`
- Primary Owner Service: `TradeWorkflowService`
- Connected Surfaces: `client/web`, `client/admin`
- Covered Feature Codes: `TRD-F001 ~ TRD-F011`

## 3. Bounded Context Map

| Bounded Context | Primary Backend Owner | Module | Aggregate / Model |
| --- | --- | --- | --- |
| `Trade Workflow` | `TradeWorkflowService` | `trades` | `TradeWorkflow`, `InspectionProposal`, `DepreciationProposal`, `DeliverySchedule`, `Remittance` |

## 4. Actor Definitions

| Actor | Description | Domain Role |
| --- | --- | --- |
| `seller` | 차량 소유자인 인증 판매자다. | 검차 승인, 감가 협의, 인도 확인 등 판매자 측 거래 결정을 수행한다. |
| `dealer` | 낙찰 후 거래를 진행하는 인증 딜러다. | 감가 제안, 인도 일정 등록, 송금 증빙 제출을 수행한다. |
| `admin` | 거래 파이프라인을 운영하는 관리자다. | 검차 제안과 완료, 송금 확인, 강제 종료 같은 운영 단계를 확정한다. |

## 5. Use Case Matrix

| Feature Code | Use Case | Actor | Bounded Context | Aggregate / Model | Type | Preconditions | Domain Outcome | Invariant / Business Rule |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `TRD-F001` | 거래 워크플로우 조회 | seller, dealer, admin | `Trade Workflow` | `TradeWorkflow` | `Query` | 대상 거래와 유효한 접근 주체가 존재한다. | 역할별 거래 단계와 후속 조치 정보를 조회한다. | 역할에 허용된 거래만 조회할 수 있다. |
| `TRD-F002` | 거래 워크플로우 목록 조회 | seller, dealer, admin | `Trade Workflow` | `TradeWorkflow` | `Query` | 유효한 세션이 존재한다. | 역할 기준 거래 목록과 현재 단계를 조회한다. | 조회는 거래 단계 자체를 바꾸지 않는다. |
| `TRD-F003` | 검차 일정 제안 | admin | `Trade Workflow` | `InspectionProposal`, `TradeWorkflow` | `Command` | 거래가 검차 제안 단계에 있다. | 검차 일정이 제안 상태로 기록된다. | 거래 단계가 맞지 않으면 검차를 제안하지 않는다. |
| `TRD-F004` | 검차 승인, 재조율, 완료 | seller, admin | `Trade Workflow` | `InspectionProposal`, `TradeWorkflow` | `Command` | 기존 검차 제안이 존재한다. | 판매자가 승인 또는 재조율하고, 관리자가 최종 완료를 기록한다. | 완료 전에는 다음 감가 단계로 전이하지 않는다. |
| `TRD-F005` | 감가 제안 | dealer | `Trade Workflow` | `DepreciationProposal`, `TradeWorkflow` | `Command` | 검차가 완료되고 감가 입력이 허용된다. | 감가 금액과 사유가 제안된다. | 검차 이전에는 감가를 제안하지 않는다. |
| `TRD-F006` | 감가 재협의와 승인 | seller | `Trade Workflow` | `DepreciationProposal`, `TradeWorkflow` | `Command` | 딜러의 감가 제안이 존재한다. | 판매자가 재협의 또는 최종 승인 결정을 기록한다. | 승인된 감가 조건은 다시 미확정 상태로 되돌리지 않는다. |
| `TRD-F007` | 인도 일정 등록 | dealer | `Trade Workflow` | `DeliverySchedule`, `TradeWorkflow` | `Command` | 감가 또는 최종 거래가가 확정되었다. | 인도 일정이 설정된다. | 거래가 확정되기 전에는 인도 일정을 등록하지 않는다. |
| `TRD-F008` | 인도 완료 확인 | seller, dealer | `Trade Workflow` | `DeliverySchedule`, `TradeWorkflow` | `Command` | 등록된 인도 일정이 존재한다. | 판매자와 딜러의 인도 확인이 누적된다. | 양측 확인이 모두 끝나기 전에는 인도 완료로 확정하지 않는다. |
| `TRD-F009` | 송금 증빙 제출 | dealer | `Trade Workflow` | `Remittance`, `TradeWorkflow` | `Command` | 인도 완료 단계가 충족되었다. | 딜러 송금 증빙과 송금 상태가 기록된다. | 인도 전에는 송금 제출을 허용하지 않는다. |
| `TRD-F010` | 송금 확인과 정산 완료 | admin | `Trade Workflow` | `Remittance`, `TradeWorkflow` | `Command` | 딜러 송금 제출이 존재한다. | 관리자가 송금을 확인하고 정산 완료를 기록한다. | 송금 미확인 상태에서는 정산 완료를 기록하지 않는다. |
| `TRD-F011` | 거래 강제 종료 | admin | `Trade Workflow` | `TradeWorkflow` | `Command` | 관리자 세션과 종료 사유가 존재한다. | 거래가 강제 취소 또는 종료 상태로 전이된다. | 강제 종료는 비가역 운영 조치로 간주한다. |
