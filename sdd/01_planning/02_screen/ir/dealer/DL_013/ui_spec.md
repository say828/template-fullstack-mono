# DL_013 UI Spec

- screen code: `DL_013`
- screen name: `입찰상세(마감)`
- primary route: `/dealer/bids/:vehicleId/detail/closed`
- access: `role:DEALER`
- source spec: `sdd/01_planning/02_screen/ir/dealer/dealer_screen_spec.pdf`
- page number: `14`

## Screen Requirements

### 1. 입찰 결과 패널
  - 서버 기준 내 입찰가 / 최고 입찰가 / 입찰 마감 시각을 고
  - 정 표시함.
  - 상단 상태 태그는 마감으로 고정 노출됨.
  - 결과 상태 메시지 영역에 “입찰이 마감되었습니다. 현재
  - 낙찰 결과를 확인 중입니다.” 고정 노출됨.
  - 해당 상태에서는 모든 입찰 관련 액션 비활성화됨

### 2. 결과 새로고침
  - 딜러가 낙찰 결과 확정 여부를 수동 재조회하는 기능.
  - 클릭 시 서버에 결과 확정 상태 재요청 수행.
  - 결과 확정 시 본 화면은 낙찰 / 미낙찰 상태 화면으로 자
  - 동 전환됨.

## Notes

- 이 문서는 seller/dealer/admin 화면명세서 PDF의 우측 요구사항 텍스트를 그대로 옮긴다.
- 평면 배치와 점유 관계는 같은 폴더의 `ui_grid.csv`를 기준으로 본다.
- grid/spec/img 연결 정보와 block-requirement 매핑은 같은 폴더의 `ui_context.json`을 기준으로 본다.
