# DEALERS FEATURE SPEC

- 작성일: 2026-03-14
- 작성 버전: `1.0.0`
- 대상 도메인: `dealers`
- 기능 코드: `DLR`
- 기준 산출물:
  - [README.md](./README.md)
  - [server/contexts/dealers](/home/sh/Documents/Github/template-fullstack-mono/server/contexts/dealers)

## 1. Purpose

- 딜러 온보딩, 증빙서류, 승인 상태 전이를 `dealers` context 기준으로 문서화한다.
- 딜러 가입 화면과 관리자 심사 화면이 공유하는 상태 규칙을 backend owner 기준으로 정리한다.

## 2. Canonical Domain Summary

- Primary Backend Module: `server/contexts/dealers`
- Primary Owner Services:
  - `DealerOnboardingService`
  - `DealerAdminService`
- Connected Surfaces: `client/web`, `client/admin`
- Covered Feature Codes: `DLR-F001 ~ DLR-F006`

## 3. Bounded Context Map

| Bounded Context | Primary Backend Owner | Module | Aggregate / Model |
| --- | --- | --- | --- |
| `Dealer Onboarding` | `DealerOnboardingService`, `DealerAdminService` | `dealers` | `DealerProfile`, `DealerDocument`, `DealerApproval` |

## 4. Actor Definitions

| Actor | Description | Domain Role |
| --- | --- | --- |
| `dealer prospect` | 아직 승인되지 않았지만 딜러 등록을 신청하는 잠재 사용자다. | 가입 정보와 증빙 서류를 제출해 딜러 심사를 시작한다. |
| `admin` | 딜러 심사를 담당하는 운영 관리자다. | 제출 서류를 검토하고 승인·반려 상태를 결정한다. |

## 5. Use Case Matrix

| Feature Code | Use Case | Actor | Bounded Context | Aggregate / Model | Type | Preconditions | Domain Outcome | Invariant / Business Rule |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `DLR-F001` | 딜러 회원가입과 서류 제출 | dealer prospect | `Dealer Onboarding` | `DealerProfile`, `DealerDocument` | `Command` | 딜러 가입 필수 필드와 증빙 파일이 제공된다. | 승인 대기 상태의 딜러 계정과 서류가 생성된다. | 필수 서류가 빠진 가입은 완료하지 않는다. |
| `DLR-F002` | 승인 대기 딜러 목록 조회 | admin | `Dealer Onboarding` | `DealerApproval` | `Query` | 관리자 세션이 유효하다. | 심사 대상 딜러 집합을 조회한다. | 조회만으로 승인 상태를 변경하지 않는다. |
| `DLR-F003` | 딜러 상세와 제출 서류 조회 | admin | `Dealer Onboarding` | `DealerProfile`, `DealerDocument` | `Query` | 대상 딜러가 존재한다. | 딜러 상세 정보와 제출 문서 메타데이터를 조회한다. | 존재하지 않는 딜러나 문서는 노출하지 않는다. |
| `DLR-F004` | 딜러 승인 | admin | `Dealer Onboarding` | `DealerApproval`, `DealerProfile` | `Command` | 대상 딜러가 `pending` 상태다. | 딜러 상태가 `approved`로 전이된다. | 이미 승인되거나 반려된 딜러는 중복 승인하지 않는다. |
| `DLR-F005` | 딜러 반려 | admin | `Dealer Onboarding` | `DealerApproval`, `DealerProfile` | `Command` | 대상 딜러가 `pending` 상태다. | 딜러 상태가 `rejected`로 전이된다. | 심사 종료 상태는 다시 반려하지 않는다. |
| `DLR-F006` | 딜러 제출 문서 미리보기와 다운로드 | admin | `Dealer Onboarding` | `DealerDocument` | `Query` | 관리자 세션과 대상 문서가 존재한다. | 원본 문서를 preview 또는 download 한다. | 문서 접근은 관리자 심사 경로에서만 허용한다. |
