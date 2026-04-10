# DL_027 UI Spec

- screen code: `DL_027`
- screen name: `감가합의내역`
- primary route: `/dealer/transactions/:vehicleId/depreciation/history`
- access: `role:DEALER`
- source spec: `sdd/01_planning/02_screen/ir/dealer/dealer_screen_spec.pdf`
- page number: `28`

## Screen Requirements

### 1. 감가 합의 정보 영역
  - 판매자 승인 완료 시점 기준의 최종 감가 합의 스냅샷 영
  - 역
  - 합의 일시: 판매자가 감가 협의를 승인한 최종 확정 시각
  - 감가 상세 항목: 협의 과정에서 최종 확정된 감가 항목의
  - 구조화 목록
  - 각 항목은 항목 / 내용 / 감가액 단위로 고정 표시

### 2. 거래 금액 정산 요약 영역
  - 낙찰가: 입찰 종료 시점 기준 낙찰 확정 금액
  - 확정 감가 합계: 확정된 감가 항목 금액의 총합
  - 최종 거래가: 낙찰가 − 확정 감가 합계로 산출된 실제 거
  - 래 기준 금액
  - 본 영역의 금액은 이후 모든 거래 단계(인도·송금·정산)의
  - 기준 금액으로 고정 적용

### 3. 확인 버튼
  - 감가 합의 내역 확인 완료 처리
  - 팝업 종료

## Notes

- 이 문서는 seller/dealer/admin 화면명세서 PDF의 우측 요구사항 텍스트를 그대로 옮긴다.
- 평면 배치와 점유 관계는 같은 폴더의 `ui_grid.csv`를 기준으로 본다.
- grid/spec/img 연결 정보와 block-requirement 매핑은 같은 폴더의 `ui_context.json`을 기준으로 본다.
