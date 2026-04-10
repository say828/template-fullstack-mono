# FRT_011_049 subagent rollout

- Owner: Codex
- Status: completed

## Scope

- `FRT_011 ~ FRT_049` seller 화면군을 subagent 병렬 작업으로 정렬한다.
- `FRT_011`과 `FRT_012`는 header popup/panel 상태로 메인 rollout이 shared shell에서 직접 구현한다.
- 메인 rollout은 공통 shell/chrome, route wiring, 최종 SDD 통합을 소유한다.

## Assumptions

- `FRT_010`에서 맞춘 seller top-right chrome 기준은 `FRT_011` 이후 seller 화면에도 유지된다.
- worker 1은 `vehicle-hero` crop asset을 공통 source로 써서 내차량/상세/이미지보기/입찰현황/입찰자선택 화면을 한 번에 맞췄다.
- seller 차량 흐름, 거래/정산 흐름, 설정/고객센터 흐름은 파일 ownership을 나누면 병렬 편집이 가능하다.
- `client/web/dist`와 `__pycache__`는 runtime 산출물로 보고, 기능 보정의 write target은 `src/*`와 `sdd/*`를 우선한다.

## Acceptance Criteria

- `FRT_011 ~ FRT_049` 각 screen code에 대해 direct route 또는 대표 route에서 구조가 screen IR와 유사하게 정렬된다.
- `FRT_011`과 `FRT_012`는 shared shell popup/panel state로 직접 렌더링된다.
- 화면군별 plan/verify trail이 `sdd/02_plan`과 `sdd/03_verify`에 남는다.
- `pnpm --dir client/web build`가 통과한다.
- seller screen IR validation과 필요한 route/runtime capture evidence가 남는다.

## Execution Checklist

- [x] screen IR 기준으로 `FRT_011 ~ FRT_049` route와 그룹을 분해한다.
- [x] subagent ownership과 disjoint write scope를 확정한다.
- [x] worker 1 `FRT_013 ~ FRT_018` seller vehicle surface를 structure-first로 정렬한다.
- [x] worker 2 `FRT_019 ~ FRT_037` seller trade/settlement subtree를 structure-first로 정렬한다.
- [x] worker 3 `FRT_038 ~ FRT_049` seller settings/support route pages를 정렬한다.
- [x] main rollout이 `FRT_011`/`FRT_012` shared header popup/panel state를 구현한다.
- [x] settings/support worker 결과를 통합한다.
- [x] shared regression, build, verify trail을 마감한다.

## Ownership

- Main rollout
  - `client/web/src/components/Layout.tsx`
  - `client/web/src/app/App.tsx`
  - shared route/shell integration
  - final SDD integration
- Worker 1
  - `FRT_013 ~ FRT_018`
  - `client/web/src/pages/SellerVehiclesPage.tsx`
  - `client/web/src/pages/SellerVehicleDetailPage.tsx`
  - `client/web/src/pages/SellerImageViewerPage.tsx`
  - `client/web/src/pages/SellerVehicleBidsPage.tsx`
  - `client/web/src/pages/SellerVehicleWinnerSelectPage.tsx`
- Worker 2
  - `FRT_019 ~ FRT_037`
  - inspection/depreciation/delivery/settlement seller flow pages
- Worker 3
  - `FRT_038 ~ FRT_049`
  - `client/web/src/pages/SettingsPage.tsx`
  - `client/web/src/pages/SupportFaqsPage.tsx`
  - `client/web/src/pages/SupportNoticesPage.tsx`
  - `client/web/src/pages/SupportNoticeDetailPage.tsx`
  - `client/web/src/pages/SupportInquiryPage.tsx`
  - seller settings/support pages excluding shared layout

## Current Notes

- `FRT_010`에서 empty-state와 seller top-right chrome를 먼저 정렬했다.
- worker 1은 `FRT_013 ~ FRT_018`을 `vehicle-hero` crop asset, closed-state banner, and winner confirmation surface 기준으로 정리했다.
- worker 2는 `FRT_019 ~ FRT_037`의 inspection/depreciation/delivery/settlement/register 흐름을 `frt010-empty-vehicle` crop hero와 summary panel 기준으로 정리했다.
- `FRT_011`과 `FRT_012`는 shared shell 의존성이 있어 main rollout에서 `/support/notifications`, `/settings/profile` route를 popup/panel state로 직접 렌더링했다.
- `FRT_038 ~ FRT_049`는 direct route 정합성과 page-level structure-first 조정이 핵심이었다.
- `SettingsPage`는 pathname-aware direct route로 정리됐고, `/settings/account`, `/settings/settlement`, `/settings/settlement/edit`, `/settings/settlement/empty`, `/settings/notifications`, `/settings/security`, `/settings/locale`, `/settings/terms` smoke가 통과했다.
- retained runtime artifacts는 `frt_010_initial_runtime.png`, `frt_011_notifications_runtime.png`, `frt_012_profile_runtime.png`, `worker3-*.png`로 남긴다.

## Validation

- `pnpm --dir client/web build`
- `python3 sdd/99_toolchain/01_automation/validate_template_screen_ir.py --service seller`
- route-level runtime captures for touched FRT codes
