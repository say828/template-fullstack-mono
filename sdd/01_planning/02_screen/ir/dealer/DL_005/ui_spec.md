# DL_005 UI Spec

- screen code: `DL_005`
- screen name: `매물상세(사진영상)`
- primary route: `/dealer/market/:vehicleId/photos`
- access: `role:DEALER`
- source spec: `sdd/01_planning/02_screen/ir/dealer/dealer_screen_spec.pdf`
- page number: `6`

## Screen Requirements

### 1. 사진 카테고리 필터
  - 차량 이미지를 외관 / 내부 / 계기판 / 타이어 / 하부 유형
  - 기준으로 분류하여 노출
  - 필터 선택 시 서버 기준 해당 카테고리 이미지 목록만 조
  - 회됨
  - 선택 상태는 시각적으로 강조 표시되며, 필터 변경 시 이
  - 미지 영역 즉시 갱신됨

### 2. 사진 목록 영역
  - 선택된 카테고리에 속한 차량 이미지 그리드 형태 노출
  - 각 이미지는 원본 비율 유지 썸네일로 구성되며 클릭 시
  - 원본 확대 뷰어(DL_006) 호출
  - 마지막 썸네일은 ‘+N 더보기’로 잔여 이미지 개수 표시
  - 이미지 로딩 실패 시 해당 슬롯은 오류 상태 UI로 대체 노
  - 출

## Notes

- 이 문서는 seller/dealer/admin 화면명세서 PDF의 우측 요구사항 텍스트를 그대로 옮긴다.
- 평면 배치와 점유 관계는 같은 폴더의 `ui_grid.csv`를 기준으로 본다.
- grid/spec/img 연결 정보와 block-requirement 매핑은 같은 폴더의 `ui_context.json`을 기준으로 본다.
