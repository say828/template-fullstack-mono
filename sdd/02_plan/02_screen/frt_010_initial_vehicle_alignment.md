# FRT_010 initial vehicle alignment

- Owner: Codex
- Status: completed

## Scope

- `FRT_010` 판매자 내 차량 초기 화면을 screen IR 기준으로 정렬한다.
- `/seller/vehicles/initial` direct route를 실제 화면으로 복구한다.
- seller shell header의 우측 상단 `알림 → 프로필 → 닉네임 님` chrome를 spec 순서와 유사하게 맞춘다.
- empty-state 차량 이미지는 spec crop을 runtime asset으로 사용한다.
- seller 차량 리스트의 상태 필터는 `전체 / 입찰 중 / 입찰 마감 / 검차 / 감가 협의 / 인도/정산 / 거래 완료` 7개 칩을 필터 박스 안에 넣어 정렬한다.

## Assumptions

- `FRT_010`은 등록 차량이 없는 seller 상태를 의미한다.
- seller top header chrome 변경은 `FRT_010`과 seller vehicle flow 초반 화면에 공통 적용된다.
- local bootstrap seller 표시명은 screen 검증을 위해 한국어 이름으로 유지해도 된다.

## Acceptance Criteria

- `/seller/vehicles/initial`이 redirect가 아니라 직접 렌더링된다.
- 빈 상태 본문은 greeting, 차량 crop 이미지, empty headline, CTA, 가이드 카드 구조를 가진다.
- seller header 우측 상단은 알림, 프로필 원형 아이콘, `닉네임 님` 순서로 렌더링된다.
- spec crop 기반 차량 이미지 asset이 runtime에서 사용된다.
- 필터 박스 안에 `전체 / 입찰 중 / 입찰 마감 / 검차 / 감가 협의 / 인도/정산 / 거래 완료` 칩이 렌더링된다.
- `pnpm --dir client/web build`와 seller screen IR validation이 통과한다.
- Playwright headless 캡처로 `/seller/vehicles/initial` runtime 렌더를 확인한다.

## Execution Checklist

- [x] `FRT_010` screen IR raw surface와 geometry를 확인한다.
- [x] seller header chrome와 empty-state 구조 차이를 정리한다.
- [x] spec crop 차량 이미지를 runtime asset으로 생성한다.
- [x] `/seller/vehicles/initial` route와 `SellerVehiclesPage`를 정렬한다.
- [x] seller header 우측 상단 chrome를 정렬한다.
- [x] build, IR validator, Playwright runtime capture를 수행한다.

## Current Notes

- 기존 구현은 `/seller/vehicles/initial`을 `/seller/vehicles`로 redirect하고 있었고, empty-state도 full-width hero 카드 구조라 spec과 거리가 컸다.
- seller header는 `프로필` 버튼과 `로그아웃` 버튼을 노출하고 있어 `FRT_010` top-right chrome 순서와 다르게 보였다.
- local bootstrap seller 표시명은 `홍길동`으로 맞춰 runtime screenshot에서 spec 명칭과 유사한 상태를 유지한다.
- 차량 리스트 상태 필터는 화면 상단의 별도 탭이 아니라 카드 내부 필터 박스로 재배치하고, 활성 칩은 검은 pill 배경으로 표시한다.

## Validation

- `pnpm --dir client/web build`
- `python3 sdd/99_toolchain/01_automation/validate_template_screen_ir.py --service seller`
- `cd server && .venv/bin/python -m pytest tests/test_identity_bootstrap.py`
- Playwright headless capture:
  - `http://127.0.0.1:5173/seller/vehicles/initial`
  - artifact: `sdd/03_verify/02_screen/app/artifacts/frt_010_initial_runtime.png`
