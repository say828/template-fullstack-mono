# FRT_037 UI Spec

- screen code: `FRT_037`
- screen name: `정산대기상세`
- primary route: `/seller/settlement/pending/:vehicleId`
- access: `role:SELLER`
- source spec: `sdd/01_planning/02_screen/ir/seller/seller_screen_spec.pdf`
- page number: `38`

## Screen Requirements

### 1. 정산 상태 통지 영역
  - 본 거래가 현재 ‘정산 대기’ 상태임이 명확히 고지됨.
  - 딜러 또는 해외 정산 주체의 입금 처리 완료가 아직 확인
  - 되지 않은 단계임을 사용자에게 인지시키며, 해당 입금이
  - 확인되는 즉시 거래 상태가 ‘정산 완료’로 자동 전환됨.

### 2. 입금/계좌 상태 확인 영역
  - 현재 정산의 유일한 잔여 조건이 ‘입금 확인’임이 명확히
  - 표현됨.
  - 정산 방식(국내 계좌이체), 정산 계좌 정보, 현재 정산 상
  - 태가 함께 노출되며, 판매자는 “어디로 얼마가 입금될 예
  - 정인지”와 “아직 입금 확인이 되지 않았음”을 본 영역에
  - 서 확정적으로 인식함.
  - 입금 확인 시 본 영역 상태가 ‘입금 완료’로 변경되며 화면
  - 전체가 정산 완료 단계로 전환됨.

## Notes

- 이 문서는 seller/dealer/admin 화면명세서 PDF의 우측 요구사항 텍스트를 그대로 옮긴다.
- 평면 배치와 점유 관계는 같은 폴더의 `ui_grid.csv`를 기준으로 본다.
- grid/spec/img 연결 정보와 block-requirement 매핑은 같은 폴더의 `ui_context.json`을 기준으로 본다.
