# DL_006 UI Spec

- screen code: `DL_006`
- screen name: `이미지보기`
- primary route: `/dealer/market/:vehicleId/image`
- access: `role:DEALER`
- source spec: `sdd/01_planning/02_screen/ir/dealer/dealer_screen_spec.pdf`
- page number: `7`

## Screen Requirements

### 1. 닫기 영역
  - 뷰어를 종료하고 이전 매물 상세 화면으로 복귀하는 컨트
  - 롤 영역
  - 클릭 시 현재 이미지 인덱스 상태 초기화 후 오버레이 제
  - 거

### 2. 이미지 표시 영역
  - 선택된 이미지의 원본 비율·해상도를 유지하여 중앙에 출
  - 력
  - 화면 리사이즈 시 비율 유지한 채 최대 영역에 맞춰 재배
  - 치

### 3. 이미지 전환 컨트롤
  - 좌우 화살표를 통해 현재 이미지 기준 이전/다음 이미지
  - 탐색
  - 키보드 방향키 입력과 동일 동작 처리
  - 첫 이미지에서 이전 이동 시 마지막 이미지로 순환 이동,
  - 마지막 이미지에서 다음 이동 시 첫 이미지로 순환 이동

## Notes

- 이 문서는 seller/dealer/admin 화면명세서 PDF의 우측 요구사항 텍스트를 그대로 옮긴다.
- 평면 배치와 점유 관계는 같은 폴더의 `ui_grid.csv`를 기준으로 본다.
- grid/spec/img 연결 정보와 block-requirement 매핑은 같은 폴더의 `ui_context.json`을 기준으로 본다.
