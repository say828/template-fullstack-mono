# IDENTITY FEATURE SPEC

- 작성일: 2026-03-14
- 작성 버전: `1.0.0`
- 대상 도메인: `identity`
- 기능 코드: `IDN`
- 기준 산출물:
  - [README.md](./README.md)
  - [server/contexts/identity](/home/sh/Documents/Github/template-fullstack-mono/server/contexts/identity)

## 1. Purpose

- `identity` backend owner 기준으로 Template 인증 도메인의 canonical feature spec을 제공한다.
- 판매자, 딜러, 관리자 surface가 공유하는 인증 유스케이스를 단일 문서로 정리한다.

## 2. Canonical Domain Summary

- Primary Backend Module: `server/contexts/identity`
- Primary Owner Service: `IdentityService`
- Connected Surfaces: `client/web`, `client/admin`
- Covered Feature Codes: `IDN-F001 ~ IDN-F005`

## 3. Bounded Context Map

| Bounded Context | Primary Backend Owner | Module | Aggregate / Model |
| --- | --- | --- | --- |
| `Authentication & Session` | `IdentityService` | `identity` | `User`, `PasswordResetToken`, `AuthSession` |

## 4. Actor Definitions

| Actor | Description | Domain Role |
| --- | --- | --- |
| `seller prospect` | 판매자로 가입하려는 비회원 또는 가입 직전 사용자다. | 판매자 계정을 신규 생성하는 시작 주체다. |
| `seller` | 판매자 role로 인증되는 사용자다. | 로그인, 비밀번호 재설정, 현재 세션 복원 흐름을 수행한다. |
| `dealer` | 딜러 role로 인증을 시도하거나 유지하는 사용자다. | 승인 상태 검증을 거쳐 로그인과 계정 복구 흐름을 수행한다. |
| `admin` | 관리자 콘솔에 접근하는 운영자다. | 관리자 인증과 세션 조회 흐름을 수행한다. |
| `system` | 보호 라우트나 인증 미들웨어 같은 내부 호출 주체다. | 저장된 인증 토큰으로 현재 세션을 복원하고 사용자 문맥을 확인한다. |

## 5. Use Case Matrix

| Feature Code | Use Case | Actor | Bounded Context | Aggregate / Model | Type | Preconditions | Domain Outcome | Invariant / Business Rule |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `IDN-F001` | 판매자 회원가입 | seller prospect | `Authentication & Session` | `User` | `Command` | 가입 필수 정보가 제공된다. | 판매자 role의 계정이 생성된다. | 이메일 중복 사용자는 다시 생성하지 않는다. |
| `IDN-F002` | 역할 기반 로그인과 세션 발급 | seller, dealer, admin | `Authentication & Session` | `User`, `AuthSession` | `Command` | 유효한 이메일과 비밀번호가 제공된다. | 사용자 role에 맞는 세션이 발급된다. | 승인되지 않은 딜러나 잘못된 자격 증명에는 세션을 발급하지 않는다. |
| `IDN-F003` | 비밀번호 재설정 요청 | seller, dealer, admin | `Authentication & Session` | `User`, `PasswordResetToken` | `Command` | 계정 식별 정보가 존재한다. | 재설정 토큰 또는 재설정 절차가 시작된다. | 존재하지 않는 계정 여부를 노출하지 않는 방향으로 처리한다. |
| `IDN-F004` | 비밀번호 재설정 확정 | seller, dealer, admin | `Authentication & Session` | `User`, `PasswordResetToken` | `Command` | 유효한 재설정 토큰과 신규 비밀번호가 제공된다. | 계정 비밀번호가 갱신된다. | 만료되거나 이미 사용된 토큰은 재사용하지 않는다. |
| `IDN-F005` | 현재 세션 조회 | seller, dealer, admin, system | `Authentication & Session` | `User`, `AuthSession` | `Query` | 기존 인증 토큰이 존재한다. | 현재 사용자 본체와 role 정보가 복원된다. | 무효 또는 만료 세션은 사용자 본체로 복원하지 않는다. |
