# DL_016 UI Spec

- screen code: `DL_016`
- screen name: `입찰상세(취소됨)`
- primary route: `/dealer/bids/:vehicleId/detail/cancelled`
- access: `role:DEALER`
- source spec: `sdd/01_planning/02_screen/ir/dealer/dealer_screen_spec.pdf`
- page number: `17`

## Screen Requirements

### 1. 내 입찰 정보 패널
  - 서버 기준 취소된 입찰가 / 취소 일시 고정 노출됨.
  - 상태 메시지 “입찰이 취소되었습니다.” 고정 표시됨.
  - 취소 이후 본 입찰은 모든 거래·정산·검차 프로세스에서
  - 완전히 분리됨.
  - 해당 이력은 나의 입찰 → 취소됨 상태로 영구 보존됨.

### 2. 다시 입찰하기
  - 클릭 시 해당 매물의 현재 진행 상태를 재확인한 뒤 재입
  - 찰 플로우 진입 시도.
  - • 매물이 여전히 입찰 가능 상태인 경우 → 일반 입찰 프
  - 로세스로 전환됨.(DL_004)
  - • 매물이 이미 마감·종료 상태인 경우 → 재입찰 차단 및
  - 안내 메시지 노출됨.
  - 클릭 시 현재 매물 상태 재검증 후 신규 입찰 생성 프로세
  - 스로 전환됨.
  - 기존 취소된 입찰 데이터는 취소 이력으로 유지되며 수정
  - ·재사용되지 않음.
  - 재입찰 성공 시 신규 입찰 레코드가 생성되어 ‘나의 입찰’
  - 목록에 별도 행으로 추가됨.
  - 기존 취소된 행은 상태 ‘취소됨’으로 계속 유지됨.
  - 신규 생성된 입찰 행은 일반 입찰과 동일한 라이프사이클
  - (입찰중 → 마감 → 결과)로 관리됨.

## Notes

- 이 문서는 seller/dealer/admin 화면명세서 PDF의 우측 요구사항 텍스트를 그대로 옮긴다.
- 평면 배치와 점유 관계는 같은 폴더의 `ui_grid.csv`를 기준으로 본다.
- grid/spec/img 연결 정보와 block-requirement 매핑은 같은 폴더의 `ui_context.json`을 기준으로 본다.
