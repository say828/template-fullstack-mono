# FRT_014 ~ FRT_027 detail state alignment

- Owner: Codex
- Status: active

## Scope

- `FRT_014` 상세보기(입찰중)과 `FRT_017`, `FRT_019`, `FRT_022`, `FRT_024`, `FRT_027`의 seller detail-state `ui_spec`를 상태별로 구체화한다.
- `FRT_014`의 runtime layout을 design guide page 15 기준으로 먼저 정렬한다.
- screen IR 문서와 `SellerVehicleDetailPage`의 active detail shell 정합성을 맞춘다.
- `FRT_014` photo/options card는 실제 `vehicle.options` 데이터와 등록 payload를 공유한다.
- `FRT_014` 차량 기본 정보와 등록 확인 요약은 실제 `transmission` 값을 공유한다.
- `FRT_014` 차량 사진 타일은 상세 안에서 모달 이미지 뷰어를 열고 실제 S3-backed `photo_urls` 목록을 공유한다. visible caption은 노출하지 않으며 `FRT_015` fullscreen overlay layout을 따른다.
- `FRT_014` 차량 정보 수정 버튼은 `/seller/vehicles/:vehicleId/edit` route로 연결해 seller own vehicle update API를 호출한다.

## Assumptions

- `FRT_014`는 `/seller/vehicles/:vehicleId` active bidding detail surface다.
- `FRT_017` closed detail는 `detail/closed` alias가 active shell을 재사용하는 상태로 본다.
- `FRT_019 ~ FRT_027`은 inspection/depreciation 단계별 detail alias이며, `FRT_018` 입찰자선택은 별도 화면으로 유지한다.

## Acceptance Criteria

- `FRT_014`, `FRT_017`, `FRT_019`, `FRT_022`, `FRT_024`, `FRT_027`의 `ui_spec.md`가 상태별 hero/summary/body 순서를 드러내도록 갱신된다.
- `SellerVehicleDetailPage` active branch가 `FRT_014` ui_spec 순서와 일치하도록 재배치된다.
- `SellerVehicleDetailPage` photo/options 영역이 하드코딩 문구가 아니라 실제 `vehicle.options` 데이터를 렌더링한다.
- `SellerVehicleDetailPage` 차량 기본 정보와 등록 확인 요약이 실제 `transmission` 값을 렌더링한다.
- `SellerVehicleDetailPage` 사진 타일 클릭이 모달 이미지 뷰어를 열고 실제 S3-backed `photo_urls` 목록을 렌더링한다. visible caption은 렌더링하지 않으며 `FRT_015` fullscreen overlay layout을 따른다.
- `SellerVehicleDetailPage` 차량 정보 수정 버튼은 `/seller/vehicles/:vehicleId/edit` route로 이동한다.
- seller 차량 등록 확인 화면은 동일한 `options` payload를 서버로 전달한다.
- `pnpm --dir client/web build`가 통과한다.
- `python3 sdd/99_toolchain/01_automation/validate_template_screen_ir.py --service seller`가 통과한다.

## Execution Checklist

- [x] detail-state 범위와 route/state 매핑을 정리한다.
- [x] `FRT_014 ~ FRT_027` ui_spec 초안을 상세 layout 기준으로 갱신한다.
- [x] `SellerVehicleDetailPage` active layout을 `FRT_014` spec 순서에 맞춘다.
- [x] `FRT_014` photo/options card를 실제 `vehicle.options` 데이터와 등록 payload에 연결한다.
- [x] `FRT_014` 차량 기본 정보와 등록 확인 요약을 실제 `transmission` 값에 연결한다.
- [x] `FRT_014` 차량 사진 타일과 모달 이미지 뷰어를 실제 S3-backed `photo_urls` 목록에 연결하고 visible caption을 제거하며 `FRT_015` fullscreen overlay layout을 따른다.
- [x] `FRT_014` 차량 정보 수정 버튼을 seller own vehicle update route와 API에 연결한다.
- [x] build와 screen IR validation을 실행한다.

## Current Notes

- seller design guide page 15 is the active bidding detail reference; page 18, 20, 23, 25, 28 provide the downstream closed/inspection/depreciation variants.
- `FRT_018` winner selection remains a separate surface and is not part of this pass.
- the active runtime shell now keeps `hero media + bidding summary` on the first grid row and moves `vehicle identity` into the next full-width row so the page order matches `sdd/01_planning/02_screen/ir/seller/FRT_014/ui_grid.csv` more literally.
- the photo/options card now reads persisted vehicle options and the seller registration confirm payload forwards the same option labels.
- the vehicle basics and registration confirm summary now read persisted transmission data instead of a hardcoded default.
- the photo tiles now omit visible captions and the modal viewer matches the `FRT_015` fullscreen overlay image layout instead of a split list panel.
- the vehicle photo payload is now DB-backed metadata plus S3 presigned `photo_urls`, not local placeholder cycling.
- the detail page edit button now opens `/seller/vehicles/:vehicleId/edit` and saves through the seller vehicle update API.
- the trade progress card now uses the page 15 horizontal stepper line instead of a dense icon grid.
- the remaining follow-up is `FRT_016` and the later detail-state runtime surfaces.

## Validation

- `pnpm --dir client/web build`
- `python3 sdd/99_toolchain/01_automation/validate_template_screen_ir.py --service seller`
