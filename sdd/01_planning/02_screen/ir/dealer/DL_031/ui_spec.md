# DL_031 UI Spec

- screen code: `DL_031`
- screen name: `사업자서류`
- primary route: `/dealer/settings/business-docs`
- access: `role:DEALER`
- source spec: `sdd/01_planning/02_screen/ir/dealer/dealer_screen_spec.pdf`
- page number: `32`

## Screen Requirements

### 1. 사업자 정보 영역
  - 딜러 가입 시 제출되어 운영 검증이 완료된 사업자 정보
  - 요약 영역
  - 상호명, 사업자등록번호, 매매 사업증 번호, 사업장 주소
  - 표시
  - 본 정보는 거래·정산·세무 문서 발행의 기준 데이터로 사
  - 용됨
  - 본 영역의 데이터는 조회 전용이며 사용자 수정 불가 상
  - 태로 유지됨

### 2. 사업자 정보 영역
  - 딜러 가입 시 제출되어 운영 검증이 완료된 사업자 정보
  - 요약 영역
  - 상호명, 사업자등록번호, 매매 사업증 번호, 사업장 주소
  - 표시
  - 본 정보는 거래·정산·세무 문서 발행의 기준 데이터로 사
  - 용됨
  - 본 영역의 데이터는 조회 전용이며 사용자 수정 불가 상
  - 태로 유지됨

## Notes

- 이 문서는 seller/dealer/admin 화면명세서 PDF의 우측 요구사항 텍스트를 그대로 옮긴다.
- 평면 배치와 점유 관계는 같은 폴더의 `ui_grid.csv`를 기준으로 본다.
- grid/spec/img 연결 정보와 block-requirement 매핑은 같은 폴더의 `ui_context.json`을 기준으로 본다.
