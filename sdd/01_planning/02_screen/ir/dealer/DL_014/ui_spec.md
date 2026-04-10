# DL_014 UI Spec

- screen code: `DL_014`
- screen name: `입찰상세(미낙찰)`
- primary route: `/dealer/bids/:vehicleId/detail/lost`
- access: `role:DEALER`
- source spec: `sdd/01_planning/02_screen/ir/dealer/dealer_screen_spec.pdf`
- page number: `15`

## Screen Requirements

### 1. 입찰 결과 패널
  - 서버 기준 내 입찰가 / 최종 낙찰가 / 입찰 마감 시각 / 결
  - 과를 고정 표시함.
  - 상단 상태 태그는 마감 고정 노출됨.
  - 결과 영역에 “이번 입찰에서 낙찰되지 않았습니다.” 메시
  - 지 노출됨.
  - 본 상태에서는 모든 입찰 관련 액션 완전 차단됨.

### 2. 유사 매물 보기
  - 클릭 시 현재 매물과 차종·연식·가격대 기준으로 유사 매
  - 물 목록 화면(DL_003)으로 이동.
  - 해당 매물은 더 이상 재입찰 대상에 포함되지 않음.

## Notes

- 이 문서는 seller/dealer/admin 화면명세서 PDF의 우측 요구사항 텍스트를 그대로 옮긴다.
- 평면 배치와 점유 관계는 같은 폴더의 `ui_grid.csv`를 기준으로 본다.
- grid/spec/img 연결 정보와 block-requirement 매핑은 같은 폴더의 `ui_context.json`을 기준으로 본다.
