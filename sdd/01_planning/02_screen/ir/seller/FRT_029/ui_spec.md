# FRT_029 UI Spec

- screen code: `FRT_029`
- screen name: `상세보기(인도정산)`
- primary route: `/seller/vehicles/:vehicleId/detail/delivery-settlement`
- access: `role:SELLER`
- source spec: `sdd/01_planning/02_screen/ir/seller/seller_screen_spec.pdf`
- page number: `30`

## Screen Requirements

### 1. 감가 협의 결과 패널
  - 감가 협의가 완료된 차량의 거래 요약 정보가 확정 데이
  - 터로 노출됨.
  - 기존 낙찰가, 감가 금액, 최종 거래 금액, 선택된 딜러 정
  - 보가 수정 불가 상태로 표시됨.
  - 현재 거래 단계가 인도/정산 상태로 고정 표시됨.
  - 인도/정산 진행 버튼은 딜러가 인도 일정을 등록한 경우
  - 에만 노출됨.
  - 버튼 클릭 시 인도/정산 진행 화면(FRT_030)으로 이동

## Notes

- 이 문서는 seller/dealer/admin 화면명세서 PDF의 우측 요구사항 텍스트를 그대로 옮긴다.
- 평면 배치와 점유 관계는 같은 폴더의 `ui_grid.csv`를 기준으로 본다.
- grid/spec/img 연결 정보와 block-requirement 매핑은 같은 폴더의 `ui_context.json`을 기준으로 본다.
