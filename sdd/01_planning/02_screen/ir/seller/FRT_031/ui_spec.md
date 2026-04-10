# FRT_031 UI Spec

- screen code: `FRT_031`
- screen name: `상세보기(거래완료)`
- primary route: `/seller/vehicles/:vehicleId/detail/completed`
- access: `role:SELLER`
- source spec: `sdd/01_planning/02_screen/ir/seller/seller_screen_spec.pdf`
- page number: `32`

## Screen Requirements

### 1. 거래 요약 정보 패널
  - 본 영역은 거래번호 기준으로 해당 차량 거래의 최종 확
  - 정 상태를 요약 표시하는 영역이다.
  - 기존 낙찰가, 감가 금액, 최종 거래 금액, 최종 선정 딜러
  - 정보가 정산 완료 기준 데이터로 고정 노출된다.
  - 거래 상태는 ‘거래 완료’로 확정 표기되며, 이후 상태 변경
  - 불가 상태임이 확정된다.
  - ‘인도 / 정산 상세’ 버튼 클릭 시 인도/정산상세
  - (FRT_032) 화면을 호출하며, 이미 완료된 인도·정산 처
  - 리 내역의 세부 기록 확인 전용 화면이 호출된다.

## Notes

- 이 문서는 seller/dealer/admin 화면명세서 PDF의 우측 요구사항 텍스트를 그대로 옮긴다.
- 평면 배치와 점유 관계는 같은 폴더의 `ui_grid.csv`를 기준으로 본다.
- grid/spec/img 연결 정보와 block-requirement 매핑은 같은 폴더의 `ui_context.json`을 기준으로 본다.
