# DL_008 UI Spec

- screen code: `DL_008`
- screen name: `매물상세(거래조건)`
- primary route: `/dealer/market/:vehicleId/terms`
- access: `role:DEALER`
- source spec: `sdd/01_planning/02_screen/ir/dealer/dealer_screen_spec.pdf`
- page number: `9`

## Screen Requirements

### 1. 인도 및 운송 조건 영역
  - 해당 매물 거래 성립 시 적용되는 거래 유형, 인도 방식,
  - 운송 책임 주체 및 비용 부담 주체를 고정 정보로 제공하
  - 는 계약 조건 영역
  - 매물 등록 시 판매자가 설정한 조건값이 그대로 노출되
  - 며, 입찰 진행 중 변경 불가
  - 국내 거래 또는 수출 거래 여부를 명시
  - ‘수출 가능’ 매물의 경우 해외 거래 전제 조건임을 명확히
  - 고지
  - 차량 인도 위치 및 방식 고지 (예: PALKA 수출 센터 탁
  - 송)
  - 거래 확정 이후 해당 인도 방식이 계약 조건으로 자동 적
  - 용됨
  - 탁송 비용의 부담 주체 명시 (예: 딜러 부담, 거래 비례)
  - 해당 비용이 최종 거래 원가 산정에 반영됨

### 2. 결제 및 수수료 영역
  - 낙찰 이후 적용되는 수수료 구조 및 결제 흐름을 확정적
  - 으로 고지하는 영역
  - 낙찰 수수료 + 정산 수수료가 동시에 적용됨을 명시
  - 결제 흐름을 “딜러 → PALKA 가상계좌 송금(안전결제)”
  - 구조로 고정 고지
  - 입찰 성공 시 해당 결제 방식이 자동 적용됨

## Notes

- 이 문서는 seller/dealer/admin 화면명세서 PDF의 우측 요구사항 텍스트를 그대로 옮긴다.
- 평면 배치와 점유 관계는 같은 폴더의 `ui_grid.csv`를 기준으로 본다.
- grid/spec/img 연결 정보와 block-requirement 매핑은 같은 폴더의 `ui_context.json`을 기준으로 본다.
