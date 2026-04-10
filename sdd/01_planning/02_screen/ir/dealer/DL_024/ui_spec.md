# DL_024 UI Spec

- screen code: `DL_024`
- screen name: `거래결제상세(감가입력후)`
- primary route: `/dealer/transactions/:vehicleId/detail/depreciation-submitted`
- access: `role:DEALER`
- source spec: `sdd/01_planning/02_screen/ir/dealer/dealer_screen_spec.pdf`
- page number: `25`

## Screen Requirements

### 1. 감가 협의 영역
  - 본 거래에 대해 딜러가 제출한 감가 협의 제안 데이터의
  - 최종 요약 영역
  - 제안 감가 금액: 딜러가 요청한 전체 감가 합산 금액
  - 제안 후 최종 거래가(예상): 낙찰가 − 제안 감가 금액
  - 제안 일시: 딜러가 감가 제안을 최종 제출한 시점
  - 감가 사유 요약: 딜러가 입력한 감가 사유 문장
  - 항목별 감가 내역: 각 감가 항목·사유·금액의 구조화된 목
  - 록
  - 해당 데이터는 판매자 승인 전까지 임시 제안 상태이며
  - 거래의 실제 가격에는 아직 반영되지 않음

### 2. 제안 수정하기
  - 감가 제안을 다시 편집하는 기능
  - 클릭 시 감가 금액 입력 팝업(DL_023) 재호출
  - 수정 완료 시 기존 제안 데이터 완전 교체 저장
  - 수정 시점 기준으로 제안 일시 갱신

### 3. 제안 철회하기
  - 현재 감가 제안을 완전히 무효화
  - 철회 즉시 거래 상태 → 검차 완료 단계로 되돌림
  - 모든 감가 데이터 삭제
  - 이후 딜러는 다시 감가 제안을 새로 생성 가능
  - 제안 철회하기
  - 감가 제안이 철회되었습니다.
- 해당 매물에 대해 제출한 감가 제안이
  - 정상적으로 철회되었습니다.
  - 필요 시 검차 결과를 다시 확인한 후
- 새로운 감가 제안을 제출할 수 있습니다.
  - 확인

## Notes

- 이 문서는 seller/dealer/admin 화면명세서 PDF의 우측 요구사항 텍스트를 그대로 옮긴다.
- 평면 배치와 점유 관계는 같은 폴더의 `ui_grid.csv`를 기준으로 본다.
- grid/spec/img 연결 정보와 block-requirement 매핑은 같은 폴더의 `ui_context.json`을 기준으로 본다.
