# app screen TODO

- Owner: Codex
- Status: active

## Service Summary

- service: `app`
- canonical source: `sdd/01_planning/02_screen/ir/seller/seller_screen_spec.pdf`, `sdd/01_planning/02_screen/ir/dealer/dealer_screen_spec.pdf`
- update rule: 이 파일 안에서 화면코드 기준 또는 코드 범위 기준으로 계속 갱신한다.

## Shared Constraints

- route baseline: `/` 아래 public landing/auth route와 seller/dealer protected route를 함께 둔다.
- shared API/modeling note: seller/dealer 상세 variation은 route alias, query, tab 압축을 허용한다.

## Screen Items

### `FRT_001 ~ FRT_009` 공개 진입과 가입

- route: `/`, `/login`, `/forgot-password`, `/signup*`
- status: `implemented`

#### 한 일

- [x] `FRT_002/FRT_003` 로그인 surface를 seller/dealer 2탭 public shell로 재정렬했다.
- [x] `FRT_004` 비밀번호 찾기를 동일 public shell/card 구조로 맞췄다.

#### 최신 검증

- `sdd/02_plan/02_screen/frt_002_login_alignment.md`
- `sdd/02_plan/03_architecture/spec_traceability.md`
- `sdd/03_verify/02_screen/app/README.md`

### `FRT_010 ~ FRT_037` 판매자 차량·입찰·거래·정산

- route: `/seller/vehicles*`, `/seller/settlement*`
- status: `implemented`

#### 해야 할 일

- [x] `FRT_016` 입찰현황은 page 17 기준 정렬형 목록, 토글 저장, 더 보기, 우측 고정 CTA까지 반영해 완료한다.

#### 한 일

- [x] `FRT_010` 초기 empty-state를 `/seller/vehicles/initial` direct route와 spec crop 차량 asset 기준으로 재구성했다.
- [x] `FRT_013` 내차량 목록의 `새 차량 등록하기` CTA를 우측 정렬로 유지하고, 카드 액션과 상태 태그를 spec 기준으로 정리했다.
- [x] `FRT_014 ~ FRT_027` detail-state family를 page 15, 18, 20, 23, 25, 28 기준 per-screen `ui_grid.csv` artifact로 풀었다.
- [x] `FRT_014` active detail shell은 `header -> hero/media + bidding summary -> vehicle identity -> vehicle basics -> photo strip -> trade progress/recent activity` 순서로 정렬했다.
- [x] `FRT_014` photo/options 카드는 실제 `vehicle.options` 데이터와 seller 등록 payload를 공유하도록 연결했다.
- [x] `FRT_014` 차량 기본 정보와 등록 확인 요약은 실제 `transmission` 값을 내려받아 표기한다.
- [x] `FRT_014` 차량 사진 타일은 클릭 시 상세 안에서 모달 이미지 뷰어를 열고, 실제 S3-backed `photo_urls` 목록을 따라 좌우 이동할 수 있게 연결했다.
- [x] `FRT_014` 차량 사진 타일에서 보이던 `전면/후면`류 visible caption은 제거하고, 이미지 뷰어 모달을 `FRT_015` fullscreen overlay 레이아웃에 맞췄다.
- [x] `FRT_014` 차량 이미지 메타는 DB에 저장하고, 실제 이미지는 S3에 업로드된 뒤 presigned `photo_urls`로 내려오도록 연결했다.
- [x] `FRT_014` 차량 정보 수정 버튼은 `/seller/vehicles/:vehicleId/edit` route로 연결하고, seller own vehicle update API로 저장하도록 활성화했다.
- [x] `FRT_014` 거래 진행 단계 카드도 page 15 기준 가로 스테퍼 UI로 맞췄다.
- [x] `FRT_018` 입찰자선택은 별도 surface로 유지한다.
- [x] `agentic-dev`에는 동명 파일이 없어 `screen_ir_schema.md`와 `screen_ir_architecture.md`를 lineaged reference로 남긴다.

#### 최신 검증

- `sdd/02_plan/02_screen/frt_010_initial_vehicle_alignment.md`
- `sdd/02_plan/02_screen/frt_014_027_detail_state_alignment.md`
- `sdd/02_plan/03_architecture/spec_traceability.md`
- `sdd/03_verify/02_screen/app/README.md`
- `sdd/02_plan/02_screen/frt_016_bids_alignment.md`

### `FRT_038 ~ FRT_049` 판매자 설정과 고객지원

- route: `/settings*`, `/support/*`
- status: `partial`

#### 해야 할 일

- [ ] `FRT_038 ~ FRT_049`은 route-aware `SettingsPage`와 seller support pages를 direct route 기준으로 계속 정리한다.

#### 한 일

- [x] `FRT_011` seller notifications를 modal overlay contract로 정리했다.
- [x] `FRT_012` shared header profile trigger를 modal overlay로 정리했다.
- [x] legacy page surfaces를 제거하고 modal-only contract로 유지한다.

#### 최신 검증

- `sdd/02_plan/03_architecture/spec_traceability.md`
- `sdd/03_verify/02_screen/app/README.md`

### `DL_001 ~ DL_029` 딜러 마켓·입찰·거래

- route: `/dealer/market*`, `/dealer/bids*`, `/dealer/transactions*`
- status: `partial`

#### 해야 할 일

- [ ] 일부 상태 화면을 대표 route 압축이 아니라 개별 surface로 더 세분화한다.

#### 한 일

- [x] dealer market과 거래 상세는 current baseline으로 유지한다.

#### 최신 검증

- `sdd/02_plan/03_architecture/spec_traceability.md`
- `sdd/03_verify/02_screen/app/README.md`

### `DL_030 ~ DL_038` 딜러 설정과 고객지원

- route: `/dealer/settings`, `/dealer/support/*`
- status: `implemented`

#### 한 일

- [x] 딜러 계정, FAQ, 공지, 문의, 영수증 증빙 화면을 current dealer surface baseline으로 유지한다.

#### 최신 검증

- `sdd/02_plan/03_architecture/spec_traceability.md`
- `sdd/03_verify/02_screen/app/README.md`

## Current Notes

- app surface는 seller/dealer를 한 runtime에서 운영하고, role 기반 home path로 진입점을 분기한다.
