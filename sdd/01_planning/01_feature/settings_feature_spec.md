# SETTINGS FEATURE SPEC

- 작성일: 2026-03-14
- 작성 버전: `1.0.0`
- 대상 도메인: `settings`
- 기능 코드: `SET`
- 기준 산출물:
  - [README.md](./README.md)
  - [server/contexts/settings](/home/sh/Documents/Github/template-fullstack-mono/server/contexts/settings)

## 1. Purpose

- 사용자 계정 프로필, 보안, 선호도, 탈퇴와 운영 버전 조회를 `settings` context 기준으로 정리한다.

## 2. Canonical Domain Summary

- Primary Backend Module: `server/contexts/settings`
- Primary Owner Service: `SettingsService`
- Connected Surfaces: `client/web`, `client/admin`
- Covered Feature Codes: `SET-F001 ~ SET-F006`

## 3. Bounded Context Map

| Bounded Context | Primary Backend Owner | Module | Aggregate / Model |
| --- | --- | --- | --- |
| `Account Settings` | `SettingsService` | `settings` | `UserProfile`, `UserPreference`, `AccountWithdrawal`, `AppVersion` |

## 4. Actor Definitions

| Actor | Description | Domain Role |
| --- | --- | --- |
| `seller` | 판매 활동을 수행하는 인증 판매자다. | 본인 프로필, 보안 정보, 알림 설정, 탈퇴 상태를 관리한다. |
| `dealer` | 입찰과 거래를 수행하는 인증 딜러다. | 본인 프로필, 보안 정보, 알림 설정, 탈퇴 상태를 관리한다. |
| `admin` | 서비스 운영 상태를 확인하는 관리자다. | 운영 버전과 본인 관리자 보안 설정을 조회·변경한다. |

## 5. Use Case Matrix

| Feature Code | Use Case | Actor | Bounded Context | Aggregate / Model | Type | Preconditions | Domain Outcome | Invariant / Business Rule |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `SET-F001` | 내 설정 조회 | seller, dealer | `Account Settings` | `UserProfile`, `UserPreference` | `Query` | 인증된 세션이 존재한다. | 현재 사용자 프로필과 환경설정을 조회한다. | 본인 설정만 조회할 수 있다. |
| `SET-F002` | 프로필 수정 | seller, dealer | `Account Settings` | `UserProfile` | `Command` | 인증된 세션과 수정 입력이 존재한다. | 사용자 프로필이 갱신된다. | 금지된 필드나 형식 오류 입력은 반영하지 않는다. |
| `SET-F003` | 비밀번호 변경 | seller, dealer, admin | `Account Settings` | `UserProfile` | `Command` | 현재 비밀번호와 신규 비밀번호가 제공된다. | 사용자 비밀번호가 갱신된다. | 현재 비밀번호 검증을 통과하지 못하면 변경하지 않는다. |
| `SET-F004` | 알림/환경설정 변경 | seller, dealer | `Account Settings` | `UserPreference` | `Command` | 인증된 세션이 존재한다. | 알림 수신 여부와 사용자 선호가 갱신된다. | 허용되지 않은 preference key는 저장하지 않는다. |
| `SET-F005` | 회원 탈퇴 요청 | seller, dealer | `Account Settings` | `AccountWithdrawal` | `Command` | 인증된 세션과 탈퇴 의사가 존재한다. | 탈퇴 요청 또는 탈퇴 상태가 기록된다. | 진행 중 거래가 있는 계정은 정책에 따라 즉시 탈퇴하지 않는다. |
| `SET-F006` | 운영 버전 조회 | admin | `Account Settings` | `AppVersion` | `Query` | 관리자 세션이 유효하다. | 현재 배포 버전 정보를 조회한다. | 조회만으로 버전을 변경하지 않는다. |
