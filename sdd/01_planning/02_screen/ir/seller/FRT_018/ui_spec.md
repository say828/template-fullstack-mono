# FRT_018 UI Spec

- screen code: `FRT_018`
- screen name: `입찰자선택`
- primary route: `/seller/vehicles/:vehicleId/winner`
- access: `role:SELLER`
- source spec: `sdd/01_planning/02_screen/ir/seller/seller_screen_spec.pdf`
- page number: `19`

## Screen Requirements

### 1. 차량 요약 영역
  - 차량 대표 이미지, 입찰 마감 상태 태그, 차량명, 연식, 주
  - 행거리, 연료 정보가 노출됨.
  - 현재 최고 입찰가 및 입찰 건수가 확정 데이터로 표시됨.
  - 본 영역 데이터는 입찰 종료 시점 기준으로 고정되며 수
  - 정 불가 상태로 유지됨.

### 2. 차량 상세 보기 버튼
  - 클릭 시 차량 상세 화면(FRT_017)으로 이동됨.
  - 입찰자 선택 화면의 상태는 유지되며, 재진입 시 동일 상
  - 태로 복원됨.

### 3. 입찰자 목록 영역
  - 입찰에 참여한 딜러 목록이 입찰가 기준 내림차순으로 노
  - 출됨.
  - 각 딜러 카드에는 딜러명, 국가, 누적 거래 수, 사업자 등
  - 록 여부, 서류 인증 여부, 입찰가, 입찰 시각이 표시됨.
  - 최고 입찰 딜러는 HIGHEST 태그로 강조 노출됨.
  - 각 항목에는 이 딜러 선택 버튼이 노출되며, 선택 시 해당
  - 딜러 카드가 선택 상태로 전환됨

### 4. 선택 정보 요약 패널
  - 현재 최고 입찰가, 선택된 딜러, 최종 낙찰가가 실시간 반
  - 영됨.
  - 선택 완료하기 버튼은 딜러 선택이 발생한 경우에만 활성
  - 화됨.
  - 선택 완료 이후 해당 정보는 변경 불가 상태로 전환되며,
  - 낙찰 확정 후 상태는 검차 단계로 전환됨

## Notes

- 이 문서는 seller/dealer/admin 화면명세서 PDF의 우측 요구사항 텍스트를 그대로 옮긴다.
- 평면 배치와 점유 관계는 같은 폴더의 `ui_grid.csv`를 기준으로 본다.
- grid/spec/img 연결 정보와 block-requirement 매핑은 같은 폴더의 `ui_context.json`을 기준으로 본다.
