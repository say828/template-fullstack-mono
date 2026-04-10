# SUPPORT FEATURE SPEC

- 작성일: 2026-03-14
- 작성 버전: `1.0.0`
- 대상 도메인: `support`
- 기능 코드: `SUP`
- 기준 산출물:
  - [README.md](./README.md)
  - [server/contexts/support](/home/sh/Documents/Github/template-fullstack-mono/server/contexts/support)

## 1. Purpose

- 공지, FAQ, 정책 문서, 문의, 알림, 운영 답변 기능을 `support` context 기준으로 정리한다.
- 공용 support surface와 admin 운영 surface가 공유하는 콘텐츠 및 티켓 규칙을 단일 도메인으로 관리한다.

## 2. Canonical Domain Summary

- Primary Backend Module: `server/contexts/support`
- Primary Owner Service: `SupportService`
- Connected Surfaces: `client/web`, `client/admin`
- Covered Feature Codes: `SUP-F001 ~ SUP-F012`

## 3. Bounded Context Map

| Bounded Context | Primary Backend Owner | Module | Aggregate / Model |
| --- | --- | --- | --- |
| `Support Content & Inbox` | `SupportService` | `support` | `Notice`, `Faq`, `Inquiry`, `Notification`, `PolicyDocument` |

## 4. Actor Definitions

| Actor | Description | Domain Role |
| --- | --- | --- |
| `public` | 로그인하지 않은 방문자다. | 공지와 FAQ 같은 공개 support 콘텐츠를 열람한다. |
| `seller` | 고객센터를 사용하는 인증 판매자다. | 공지·FAQ를 확인하고 문의와 알림을 관리한다. |
| `dealer` | 고객센터를 사용하는 인증 딜러다. | 공지·FAQ를 확인하고 문의와 알림을 관리한다. |
| `admin` | support 운영을 담당하는 관리자다. | 공지·FAQ·정책 문서·문의 큐를 관리하고 답변을 기록한다. |

## 5. Use Case Matrix

| Feature Code | Use Case | Actor | Bounded Context | Aggregate / Model | Type | Preconditions | Domain Outcome | Invariant / Business Rule |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `SUP-F001` | 공지 목록 조회 | public, seller, dealer | `Support Content & Inbox` | `Notice` | `Query` | 서비스 접근이 가능하다. | 공지 목록을 조회한다. | 숨김 또는 삭제된 공지는 목록에 노출하지 않는다. |
| `SUP-F002` | 공지 상세 조회 | public, seller, dealer | `Support Content & Inbox` | `Notice` | `Query` | 대상 공지가 존재한다. | 공지 상세 본문을 조회한다. | 게시 상태가 아닌 공지는 상세로 노출하지 않는다. |
| `SUP-F003` | FAQ 조회 | public, seller, dealer, admin | `Support Content & Inbox` | `Faq` | `Query` | 서비스 접근이 가능하다. | FAQ 목록을 조회한다. | 비공개 FAQ는 사용자 surface에 노출하지 않는다. |
| `SUP-F004` | 문의 등록 | seller, dealer | `Support Content & Inbox` | `Inquiry` | `Command` | 인증된 사용자와 문의 본문이 존재한다. | 새로운 문의 티켓이 생성된다. | 제목 또는 본문이 비어 있는 문의는 생성하지 않는다. |
| `SUP-F005` | 내 문의 목록 조회 | seller, dealer | `Support Content & Inbox` | `Inquiry` | `Query` | 인증된 사용자가 존재한다. | 본인 문의 목록과 처리 상태를 조회한다. | 본인 문의만 조회할 수 있다. |
| `SUP-F006` | 내 알림 조회와 읽음 처리 | seller, dealer | `Support Content & Inbox` | `Notification` | `Query` | 인증된 사용자가 존재한다. | 사용자 알림 목록을 조회하고 읽음 상태를 반영한다. | 다른 사용자 소유 알림은 읽음 처리하지 않는다. |
| `SUP-F007` | 관리자 공지 관리 | admin | `Support Content & Inbox` | `Notice` | `Command` | 관리자 세션이 유효하다. | 공지를 생성, 수정, 삭제한다. | 게시 상태가 아닌 문서는 사용자 surface에 노출하지 않는다. |
| `SUP-F008` | 관리자 FAQ 관리 | admin | `Support Content & Inbox` | `Faq` | `Command` | 관리자 세션이 유효하다. | FAQ를 생성, 수정, 삭제한다. | 삭제된 FAQ는 사용자 surface에서 즉시 제외한다. |
| `SUP-F009` | 관리자 문의 큐 조회 | admin | `Support Content & Inbox` | `Inquiry` | `Query` | 관리자 세션이 유효하다. | 문의 목록과 상세를 조회한다. | 조회만으로 문의 상태를 임의 변경하지 않는다. |
| `SUP-F010` | 관리자 문의 첨부 다운로드와 답변 | admin | `Support Content & Inbox` | `Inquiry` | `Command` | 대상 문의가 존재한다. | 첨부를 다운로드하고 답변 또는 처리 결과를 기록한다. | 종료된 문의를 정책 없이 다시 미처리 상태로 되돌리지 않는다. |
| `SUP-F011` | 관리자 정책 문서 목록과 상세 조회 | admin | `Support Content & Inbox` | `PolicyDocument` | `Query` | 관리자 세션이 유효하다. | `POLICY` 카테고리 정책 문서 목록과 상세를 조회한다. | 정책 문서 조회는 게시 상태를 변경하지 않는다. |
| `SUP-F012` | 관리자 정책 문서 등록, 수정, 삭제 | admin | `Support Content & Inbox` | `PolicyDocument` | `Command` | 관리자 세션과 정책 문서 입력이 유효하다. | 정책 문서가 등록, 수정, 삭제된다. | 정책 문서는 `support` 공지 aggregate 규칙을 벗어나 독립 저장소를 만들지 않는다. |
