# LANDING SCREEN SPEC

- 작성일: 2026-03-14
- 작성 버전: `1.0.0`
- 대상 surface: `client/web`
- 기준 구현:
  - [client/web/src/app/App.tsx](/home/sh/Documents/Github/template-fullstack-mono/client/web/src/app/App.tsx)

## 1. Scope

- `client/web`는 Template public onboarding/support surface를 포함한 customer-facing runtime이다.
- 기존 seller/dealer/admin PDF 설계서에는 landing 전용 PDF가 없으므로, 현재 구현 route를 기준으로 markdown screen spec을 유지한다.

## 2. Screen Matrix

| Screen Code | Domain Code | Screen Name | Primary Route | Access | Entry Condition | Primary UI Blocks | Main Interaction | Exit / Transition | Related Feature |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `LND-S001` | `IDN` | 랜딩 홈 | `/` | `public` | 비로그인 사용자가 서비스에 최초 진입한다. | hero, 역할 CTA, 소개 섹션, 공용 header/footer | 로그인/회원가입/역할별 가입 CTA 선택 | `/login`, `/signup`, `/signup/seller`, `/signup/dealer` | `IDN-F001`, `DLR-F001` |
| `LND-S002` | `IDN` | 로그인 | `/login` | `public` | 랜딩 또는 보호 route redirect로 진입한다. | role toggle, credential form, auto-login, recovery links | 이메일/비밀번호 입력과 role 기준 로그인 | 인증 성공 시 role home 이동 | `IDN-F002` |
| `LND-S003` | `IDN` | 비밀번호 찾기 | `/forgot-password` | `public` | 로그인 화면에서 비밀번호 찾기를 선택한다. | 계정 식별 입력, 요청 CTA, 안내 문구 | 재설정 요청 제출 | 요청 완료 후 로그인 복귀 | `IDN-F003` |
| `LND-S004` | `IDN` | 회원가입 유형 선택 | `/signup` | `public` | 랜딩 또는 로그인에서 회원가입을 선택한다. | 역할 선택 카드, 설명, 다음 CTA | 판매자/딜러 가입 분기 선택 | `/signup/seller`, `/signup/dealer` | `IDN-F001`, `DLR-F001` |
| `LND-S005` | `IDN` | 판매자 회원가입 | `/signup/seller` | `public` | 판매자 가입 경로를 선택한다. | 가입 폼, 약관, 제출 CTA | 판매자 계정 생성 입력 | `/signup/seller/complete` | `IDN-F001` |
| `LND-S006` | `IDN` | 판매자 가입 완료 | `/signup/seller/complete` | `public` | 판매자 가입이 정상 완료된다. | 완료 상태, 다음 단계 CTA | 로그인 또는 홈 이동 선택 | `/login`, `/` | `IDN-F001` |
| `LND-S007` | `DLR` | 딜러 회원가입 | `/signup/dealer` | `public` | 딜러 가입 경로를 선택한다. | 딜러 정보 입력, 서류 업로드, 제출 CTA | 승인 대기 딜러 가입 제출 | `/signup/dealer/complete` | `DLR-F001` |
| `LND-S008` | `DLR` | 딜러 가입 완료 | `/signup/dealer/complete` | `public` | 딜러 가입이 정상 제출된다. | 승인 대기 안내, 복귀 CTA | 승인 대기 상태 확인 | `/login`, `/` | `DLR-F001` |
| `LND-S009` | `SUP` | 공지 목록 | `/support/notices` | `public` | 고객지원 메뉴 또는 링크로 진입한다. | 공지 리스트, 검색/필터, 상세 진입 링크 | 공지 리스트 탐색 | `/support/notices/:noticeId` | `SUP-F001` |
| `LND-S010` | `SUP` | 공지 상세 | `/support/notices/:noticeId` | `public` | 공지 목록에서 항목을 선택한다. | 공지 본문, 메타정보, 목록 복귀 | 상세 열람 | `/support/notices` | `SUP-F002` |
| `LND-S011` | `SUP` | FAQ | `/support/faqs` | `public` | 고객지원 메뉴로 진입한다. | 카테고리형 FAQ 리스트, 검색, 확장형 답변 | FAQ 탐색과 확장 | 관련 support route 이동 | `SUP-F003` |
