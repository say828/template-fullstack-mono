# FRT_018 입찰자선택 정합성 정리

- Owner: Codex
- Status: active

## Scope

- `FRT_018` seller winner selection surface (`/seller/vehicles/:vehicleId/winner`) 를 screen spec page 19 기준으로 재구성한다.
- 상단 차량 요약 카드, 좌측 입찰자 목록, 우측 선택 정보 요약 패널의 3구역 구조를 맞춘다.
- 입찰자 카드 선택 상태와 선택 완료 흐름을 UI에서 드러낸다.
- 서버 선택 확정 API가 선택한 입찰을 반영할 수 있도록 `winning_bid_id` 기반 확정 경로를 지원한다.

## Assumptions

- `FRT_018`은 `FRT_017`의 후속 별도 surface이며, `FRT_014/FRT_017` 공통 detail shell과는 다른 selection UI를 가진다.
- 화면명세서의 입찰자 목록 메타는 seller bid response에 dealer metadata가 보강되면 더 가깝게 표현할 수 있다.

## Acceptance Criteria

- 상단 요약 카드가 차량 이미지, 입찰 마감 태그, 차량명, 연식, 주행거리, 연료, 현재 최고 입찰가, 입찰 수, `차량 상세 보기` 버튼으로 구성된다.
- 입찰자 목록이 입찰가 내림차순으로 노출되고 최고가 카드에 `HIGHEST` 태그가 표시된다.
- 각 카드에는 선택 버튼과 선택 상태가 표시되고, 우측 선택 정보 요약 패널이 현재 최고가/선택 딜러/최종 낙찰가를 반영한다.
- 선택 완료하기 버튼은 딜러가 선택된 경우에 활성화된다.
- 선택 완료 시 서버가 선택한 입찰을 확정하고 결과 상태를 갱신한다.
- 불필요한 `screen code` 보조 박스, 강제마감 버튼, FRT_016식 필터/검색 bar는 노출되지 않는다.

## Execution Checklist

- [x] screen spec / ui grid / reference image 를 기준으로 current implementation gap 을 정리한다.
- [x] seller bid response와 close bidding API가 선택 후보를 반영하도록 보강한다.
- [x] `SellerVehicleWinnerSelectPage`를 3구역 선택 UI로 재작성한다.
- [x] 선택 상태/확정 후 상태에 대한 명령형 검증을 실행한다.
- [x] verify summary와 regression scope를 기록한다.

## Current Notes

- 현재 구현은 screen spec page 19 기준의 `입찰자 목록 + 선택 정보 요약` 구조로 재배열되었고, 딜러 선택은 `winning_bid_id` 기반으로 실제 마감 요청에 반영된다.
- seller bid response에는 딜러 국가, 사업자번호, 승인 상태, 완료 거래 수가 추가되어 카드 메타를 채운다.
- regression scope는 `seller/vehicles/:vehicleId/winner` direct surface, `seller/vehicles/:vehicleId/bids` seller bid data source, `seller/vehicles/:vehicleId/bidding/close` 선택 확정 API, and the `frt-018-winner-select` exactness suite로 묶는다.

## Validation

- `pnpm exec tsc --noEmit`
- seller winner selection route smoke / exactness check
- backend close bidding API test covering `winning_bid_id`
