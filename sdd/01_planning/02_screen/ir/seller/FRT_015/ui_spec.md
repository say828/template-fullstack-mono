# FRT_015 UI Spec

- screen code: `FRT_015`
- screen name: `이미지보기`
- primary route: `/seller/vehicles/:vehicleId/images`
- access: `role:SELLER`
- source spec: `sdd/01_planning/02_screen/ir/seller/seller_screen_spec.pdf`
- page number: `16`

## Screen Requirements

### 1. 닫기 버튼
  - 화면 우측 상단 고정 노출됨.
  - 클릭 시 본 이미지 보기 화면이 닫히며 직전 화면
  - (FRT_014) 으로 복귀됨.
  - 닫힘 이후 거래 상태, 차량 데이터, 화면 스크롤 위치는 변
  - 경되지 않음.

### 2. 이미지 전환 영역
  - 현재 선택된 차량 이미지가 중앙에 크게 노출됨.
  - 좌·우 화살표 버튼이 이미지 좌우에 고정 노출됨.
  - 좌측 화살표 클릭 시 이전 이미지로 전환됨.
  - 우측 화살표 클릭 시 다음 이미지로 전환됨.
  - 이미지 전환은 등록된 이미지 배열 순서 기준으로만 이동
  - 됨.
  - 첫 번째 이미지에서 좌 이동 시 마지막 이미지로, 마지막
  - 이미지에서 우 이동 시 첫 번째 이미지로 순환 전환됨.

## Notes

- 이 문서는 seller/dealer/admin 화면명세서 PDF의 우측 요구사항 텍스트를 그대로 옮긴다.
- 평면 배치와 점유 관계는 같은 폴더의 `ui_grid.csv`를 기준으로 본다.
- grid/spec/img 연결 정보와 block-requirement 매핑은 같은 폴더의 `ui_context.json`을 기준으로 본다.
