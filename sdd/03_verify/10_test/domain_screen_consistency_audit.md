# 2026-03-14 Domain/Screen Consistency Audit

## Scope

- 도메인 정본: `sdd/01_planning/01_feature/*_feature_spec.md`
- 화면 정본: `sdd/02_plan/02_screen/* IA`, `sdd/01_planning/02_screen/landing_screen_spec.md`
- 상태 요약: `sdd/02_plan/03_architecture/spec_traceability.md`
- surface 존재 증거: `client/admin/src/app/App.tsx`, `client/web/src/app/App.tsx`

## Summary

- 도메인 ownership 자체는 대체로 정리돼 있다.
- 가장 큰 문제는 `spec-traceability.md`가 실제 route surface와 IA보다 뒤처져 있다는 점이다.
- 특히 admin, dealer, landing/public support 영역에서 “화면이 있다”와 “문서상 구현됐다”가 크게 어긋난다.

## Coverage Snapshot

- Traceability status counts
  - Admin: `implemented 15`, `partial 6`, `deferred 41`
  - Dealer: `implemented 1`, `deferred 37`
  - Seller/Public: `implemented 33`, `deferred 16`
- 이 수치는 현재 `client/*` route inventory와 비교하면 dealer/admin 쪽 과소기록이 크다.

## Findings

### High

1. Admin surface가 IA와 실제 route에는 존재하지만 traceability에는 대량 `deferred`로 남아 있다.
   - IA는 관리자 인증, 대시보드/알림/리포트, 판매자/딜러 운영, 고객지원/정책, 계정/권한/감사/버전 surface를 canonical route로 선언한다.
   - Evidence:
     - `sdd/02_plan/02_screen/admin_todos.md:21-28`
     - `client/admin/src/app/App.tsx:202-211`
     - `client/admin/src/app/App.tsx:213-297`
   - 하지만 traceability는 같은 영역의 다수를 `deferred`로 둔다.
   - Evidence:
     - `sdd/02_plan/03_architecture/spec_traceability.md:9-14`
     - `sdd/02_plan/03_architecture/spec_traceability.md:46-57`
     - `sdd/02_plan/03_architecture/spec_traceability.md:70`
   - 영향:
     - admin 기능 범위를 문서만 보고 판단하면 실제 구현보다 훨씬 작게 보인다.
     - `admin_feature_spec`의 `ADM-F007` 감사 로그 조회와 `/admin/audit/logs` surface가 현재 report 상에서 누락된 것처럼 보인다.
   - Domain references:
     - `sdd/01_planning/01_feature/admin_feature_spec.md:18-24`
     - `sdd/01_planning/01_feature/admin_feature_spec.md:42-51`

2. Dealer surface는 IA와 실제 `client/web` route가 넓게 존재하지만 traceability는 거의 전부 `deferred`다.
   - IA는 dealer market, bids, transactions, settings, support를 canonical route로 명시한다.
   - Evidence:
     - `sdd/02_plan/02_screen/app_todos.md:29-32`
     - `client/web/src/app/App.tsx:329-543`
   - traceability는 `DL_3`만 `implemented`이고 `DL_1 ~ DL_38` 대부분을 `deferred`로 둔다.
   - Evidence:
     - `sdd/02_plan/03_architecture/spec_traceability.md:97-138`
   - 영향:
     - `dealers`, `bidding`, `trades`, `settings`, `support` 도메인의 dealer-facing screen coverage를 문서가 따라가지 못한다.
   - Domain references:
     - `sdd/01_planning/01_feature/dealers_feature_spec.md:19-22`
     - `sdd/01_planning/01_feature/support_feature_spec.md:19-22`
     - `sdd/01_planning/01_feature/settings_feature_spec.md:18-21`

### Medium

3. Landing screen group은 `client/web` 내부 public slice인데 traceability에는 별도 섹션이 없다.
   - landing IA와 landing screen spec은 `client/web` 내부 public onboarding/support screen group을 정의한다.
   - Evidence:
     - `sdd/02_plan/02_screen/landing_todos.md:20-23`
     - `sdd/01_planning/02_screen/landing_screen_spec.md:19-29`
     - `client/web/src/app/App.tsx:18-28`
   - 그러나 traceability에는 `Landing` 섹션이 없고 public onboarding/support가 `FRT_*`에 흡수돼 있다.
   - Evidence:
     - `sdd/02_plan/03_architecture/spec_traceability.md:140-192`
   - 영향:
     - landing screen group 전용 회귀 여부를 traceability만으로 직접 추적할 수 없다.
     - `FRT_4`, `FRT_46 ~ FRT_49`는 `deferred`인데 실제 `/forgot-password`, `/support/notices*`, `/support/faqs` route는 `client/web`에 존재한다.
   - Domain references:
     - `sdd/01_planning/01_feature/identity_feature_spec.md:19-22`
     - `sdd/01_planning/01_feature/support_feature_spec.md:19-22`

4. Active screen / traceability 문서가 여전히 legacy source를 기준 입력처럼 적고 있다.
   - admin/app IA, landing screen spec, traceability가 `_legacy_source` xlsx를 기준 산출물로 계속 명시한다.
   - Evidence:
     - `sdd/02_plan/02_screen/admin_todos.md:9`
     - `sdd/02_plan/02_screen/app_todos.md:9`
     - `sdd/01_planning/02_screen/landing_screen_spec.md:8`
     - `sdd/02_plan/03_architecture/spec_traceability.md:3`
   - 영향:
     - 현재 markdown / IA / route inventory 중심 운영과 source-of-truth 설명이 어긋난다.

## Aligned Areas

- `admin_feature_spec`와 admin IA의 backend context ownership은 `admin` 기준으로 맞춰졌다.
- seller vehicle / trade / settlement flow는 traceability에 상당 부분 반영돼 있어 dealer/admin 영역보다 정합성이 높다.
- landing IA와 실제 `client/web` route 구성은 서로 잘 맞는다. 문제는 landing screen group traceability 섹션 부재다.

## Recommended Next Steps

1. `spec-traceability.md`를 route inventory 기준으로 재생성하거나 최소한 admin / dealer / landing 영역부터 최신화한다.
2. landing을 `FRT` 하위 변형이 아니라 독립 surface 섹션으로 traceability에 추가한다.
3. active IA / traceability의 `_legacy_source` 입력 문구를 archival note로 낮추고, 현재 canonical markdown / route inventory를 우선 정본으로 명시한다.
