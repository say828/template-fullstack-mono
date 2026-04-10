# FRT_032 UI Spec

- screen code: `FRT_032`
- screen name: `인도/정산상세`
- primary route: `/seller/vehicles/:vehicleId/delivery-settlement-progress/detail`
- access: `role:SELLER`
- source spec: `sdd/01_planning/02_screen/ir/seller/seller_screen_spec.pdf`
- page number: `33`

## Screen Requirements

### 1. 인도 / 정산 정보 영역
  - 본 영역은 해당 거래의 실제 인도 완료 및 정산 완료 내역
  - 을 확정 데이터로 노출하는 핵심 증빙 영역이다.
  - 차량 인도 일시는 실제 인도 완료 시점 기준 데이터로 고
  - 정 표시되며 수정 불가 상태로 유지된다.
  - 정산 방식 및 정산 완료 일시는 정산 확정 시점 기준으로
  - 고정되며, 이후 변경 불가 상태로 유지된다.
  - 인도 방식은 해당 거래의 실제 인도 유형(국내 딜러 직접
  - 인수 등)으로 고정 표기된다.
  - 인도 장소는 거래 당사자 간 협의 완료된 실제 인도 위치
  - 정보로 고정 노출된다.
  - 관련 서류 영역은 해당 거래의 법적·회계적 증빙 문서 원
  - 본 파일을 직접 열람·다운로드할 수 있는 구조로 제공된
  - 다.
  - 본 영역의 모든 데이터는 거래 완료 확정 이후 영구 보존
  - 이력 데이터로 관리된다.

### 2. 확인 버튼
  - ‘확인’ 버튼 클릭 시 본 팝업이 닫히며 기존 화면으로 복귀
  - 한다.
  - 본 버튼은 단순 UI 종료 기능만 수행하며, 어떠한 거래 데
  - 이터에도 영향을 주지 않는다.

## Notes

- 이 문서는 seller/dealer/admin 화면명세서 PDF의 우측 요구사항 텍스트를 그대로 옮긴다.
- 평면 배치와 점유 관계는 같은 폴더의 `ui_grid.csv`를 기준으로 본다.
- grid/spec/img 연결 정보와 block-requirement 매핑은 같은 폴더의 `ui_context.json`을 기준으로 본다.
