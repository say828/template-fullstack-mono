# DL_015 UI Spec

- screen code: `DL_015`
- screen name: `입찰상세(낙찰)`
- primary route: `/dealer/bids/:vehicleId/detail/won`
- access: `role:DEALER`
- source spec: `sdd/01_planning/02_screen/ir/dealer/dealer_screen_spec.pdf`
- page number: `16`

## Screen Requirements

### 1. 낙찰 완료 패널
  - 서버 기준 낙찰가 / 낙찰 일시 / 거래 유형 고정 노출됨.
  - 상태 태그는 마감으로 고정 표시됨.
  - “축하합니다. 해당 매물에 낙찰되었습니다.” 메시지 노출
  - 됨.
  - 본 상태에서는 입찰·수정·취소 기능 전부 차단됨.
  - 낙찰 이후 진행 단계 안내 항목(거래·결제 → 검차 일정
  - → 감가 제안) 표시됨.

### 2. 거래·결제 진행
  - 클릭 시 거래·결제 프로세스 시작 화면(DL_020)으로 이
  - 동.
  - 해당 매물은 즉시 ‘진행중 거래’ 상태로 전환됨.
  - 이후 플로우는 딜러·판매자·PALKA 운영 개입 구조로 전
  - 개됨.

## Notes

- 이 문서는 seller/dealer/admin 화면명세서 PDF의 우측 요구사항 텍스트를 그대로 옮긴다.
- 평면 배치와 점유 관계는 같은 폴더의 `ui_grid.csv`를 기준으로 본다.
- grid/spec/img 연결 정보와 block-requirement 매핑은 같은 폴더의 `ui_context.json`을 기준으로 본다.
