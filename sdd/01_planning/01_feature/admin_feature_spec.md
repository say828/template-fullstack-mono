# ADMIN FEATURE SPEC

- 작성일: 2026-03-14
- 작성 버전: `1.0.0`
- 대상 도메인: `admin`
- 기능 코드: `ADM`
- 기준 산출물:
  - [README.md](./README.md)
  - [server/contexts/admin](/home/sh/Documents/Github/template-fullstack-mono/server/contexts/admin)

## 1. Purpose

- 관리자 계정/권한, 운영 요약, 감사 로그, 운영 차단, 리포트 조회를 하나의 `admin` bounded context 기준으로 정리한다.

## 2. Canonical Domain Summary

- Primary Backend Module: `server/contexts/admin`
- Primary Owner Services:
  - `AdminAccountsService`
  - `AdminAuditService`
  - `AdminBlacklistService`
- Covered Surface Roles:
  - 운영 요약 / 알림 / 리포트 read model 조합
- Connected Surfaces: `client/admin`
- Covered Feature Codes: `ADM-F001 ~ ADM-F012`

## 3. Bounded Context Map

| Bounded Context | Primary Backend Owner | Module | Aggregate / Model |
| --- | --- | --- | --- |
| `Admin Operations` | `AdminAccountsService`, `AdminAuditService`, `AdminBlacklistService` | `admin` | `AdminAccount`, `PermissionGroup`, `AdminAuditLog`, `AdminBlacklistEntry`, `AdminOperationalOverview`, `AdminOperationalReport` |

## 4. Actor Definitions

| Actor | Description | Domain Role |
| --- | --- | --- |
| `admin` | Template 운영 콘솔에 접근하는 내부 운영자다. | 계정·권한, 운영 요약, 감사 로그, 운영 차단, 리포트 조회를 통합 관리하는 주체다. |

## 5. Use Case Matrix

| Feature Code | Use Case | Actor | Bounded Context | Aggregate / Model | Type | Preconditions | Domain Outcome | Invariant / Business Rule |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `ADM-F001` | 권한 그룹 목록 조회 | admin | `Admin Operations` | `PermissionGroup` | `Query` | 관리자 세션이 유효하다. | 권한 그룹 목록과 멤버 수를 조회한다. | 조회만으로 권한 구조를 변경하지 않는다. |
| `ADM-F002` | 권한 그룹 상세 조회 | admin | `Admin Operations` | `PermissionGroup` | `Query` | 그룹 코드가 존재한다. | 특정 권한 그룹의 상세 정보와 멤버를 조회한다. | 존재하지 않는 그룹 코드는 조회하지 않는다. |
| `ADM-F003` | 관리자 계정 목록 조회 | admin | `Admin Operations` | `AdminAccount` | `Query` | 관리자 세션이 유효하다. | 전체 관리자 계정과 상태를 조회한다. | 관리자 본문은 승인된 운영자에게만 노출한다. |
| `ADM-F004` | 관리자 계정 생성 | admin | `Admin Operations` | `AdminAccount`, `PermissionGroup` | `Command` | 생성 필수 정보와 권한 그룹이 제공된다. | 새 관리자 계정과 권한 프로필이 생성된다. | 이메일 중복과 잘못된 권한 그룹 연결은 허용하지 않는다. |
| `ADM-F005` | 관리자 계정 상세 조회 | admin | `Admin Operations` | `AdminAccount` | `Query` | 대상 관리자 계정이 존재한다. | 특정 관리자 계정 상세와 권한 정보를 조회한다. | 존재하지 않는 계정은 조회하지 않는다. |
| `ADM-F006` | 관리자 계정 수정 | admin | `Admin Operations` | `AdminAccount`, `PermissionGroup` | `Command` | 수정 대상 계정이 존재한다. | 관리자 상태, 권한 그룹, 기본 정보가 갱신된다. | 유효하지 않은 상태값과 존재하지 않는 계정 수정은 허용하지 않는다. |
| `ADM-F007` | 관리자 감사 로그 조회 | admin | `Admin Operations` | `AdminAuditLog` | `Query` | 관리자 세션이 유효하다. | 관리자 행위와 관련 운영 이벤트를 시간순으로 조회한다. | 감사 로그 조회는 원본 로그를 수정하거나 삭제하지 않는다. |
| `ADM-F008` | 블랙리스트 사용자 등록 | admin | `Admin Operations` | `AdminBlacklistEntry` | `Command` | 관리자 세션과 대상 사용자가 존재한다. | 사용자가 블랙리스트에 등록되고 계정 상태가 중지된다. | 이미 차단된 사용자를 중복 등록하지 않는다. |
| `ADM-F009` | 블랙리스트 목록 조회 | admin | `Admin Operations` | `AdminBlacklistEntry` | `Query` | 관리자 세션이 유효하다. | 현재 또는 전체 차단 사용자 목록을 조회한다. | 조회만으로 차단 상태를 변경하지 않는다. |
| `ADM-F010` | 블랙리스트 해제 | admin | `Admin Operations` | `AdminBlacklistEntry` | `Command` | 대상 차단 사용자가 존재한다. | 사용자가 블랙리스트에서 제거되고 이전 계정 상태가 복원된다. | 존재하지 않는 차단 항목은 해제하지 않는다. |
| `ADM-F011` | 운영 대시보드와 알림 패널 조회 | admin | `Admin Operations` | `AdminOperationalOverview` | `Query` | 관리자 세션이 유효하다. | 거래/정산/차단 현황과 운영 알림 패널을 조회한다. | 조회만으로 운영 상태를 변경하지 않는다. |
| `ADM-F012` | 운영 리포트 조회 | admin | `Admin Operations` | `AdminOperationalReport` | `Query` | 관리자 세션이 유효하다. | 거래/정산/블랙리스트/공지 기반 운영 리포트를 조회한다. | 리포트 조회는 source domain 데이터를 수정하지 않는다. |
