# FRT_017 UI Spec

- screen code: `FRT_017`
- screen name: `상세보기(입찰마감)`
- primary route: `/seller/vehicles/:vehicleId/detail/closed`
- access: `role:SELLER`
- source spec: `sdd/01_planning/02_screen/ir/seller/seller_screen_spec.pdf`
- page number: `18`

## Screen Requirements

### 1. 입찰 종료 요약 패널
  - 입찰 상태가 ‘입찰 마감’으로 확정된 차량의 거래 요약 정
  - 보가 표시됨.
  - 현재 최고 입찰가, 입찰 건수, 입찰 종료 일시가 확정 데이
  - 터로 노출되며, 입찰 단계가 종료되었음을 명확히 인지시
  - 키는 상태 경고 메시지 영역이 함께 노출됨.
  - ‘입찰자 선택하기’ 버튼은 입찰 마감이 서버 기준으로 확
  - 정된 경우에만 노출되며, 클릭 시 입찰자 선택(FRT_018)
  - 화면으로 이동함.
  - 낙찰자를 선택하는 순간부터 입찰 단계로의 복귀는 불가
  - 하며, 해당 차량의 거래 흐름은 감가협의 단계로 전환됨

## Notes

- 이 문서는 seller/dealer/admin 화면명세서 PDF의 우측 요구사항 텍스트를 그대로 옮긴다.
- 평면 배치와 점유 관계는 같은 폴더의 `ui_grid.csv`를 기준으로 본다.
- grid/spec/img 연결 정보와 block-requirement 매핑은 같은 폴더의 `ui_context.json`을 기준으로 본다.
