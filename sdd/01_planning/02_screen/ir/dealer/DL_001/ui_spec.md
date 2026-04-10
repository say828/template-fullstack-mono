# DL_001 UI Spec

- screen code: `DL_001`
- screen name: `알림`
- primary route: `/dealer/notifications`
- access: `role:DEALER`
- source spec: `sdd/01_planning/02_screen/ir/dealer/dealer_screen_spec.pdf`
- page number: `2`

## Screen Requirements

### 1. 알림 리스트 영역
  - 딜러에게 전달되는 이벤트 기반 알림 집계 영역.
  - 아이콘 + 제목 + 상세 설명 + 발생 일시 구성
  - 우측 빨간 점: 미열람 상태 표시
  - 열람 시 해당 알림의 미열람 상태 해제
  - 알림 클릭 시 해당 하는 알림의 상세 화면으로 이동 분기
  - 최신 알림 상단 배치 및 미열람 알림 우선 노출

### 2. 알림 일괄 처리 영역
  - 알림 상태 일괄 제어 영역.
  - 모두 읽음 클릭시 전체 알림 읽음 상태로 일괄 전환
  - 모든 빨간 점 제거
  - 이후 신규 알림만 미열람 상태로 누적

## Notes

- 이 문서는 seller/dealer/admin 화면명세서 PDF의 우측 요구사항 텍스트를 그대로 옮긴다.
- 평면 배치와 점유 관계는 같은 폴더의 `ui_grid.csv`를 기준으로 본다.
- grid/spec/img 연결 정보와 block-requirement 매핑은 같은 폴더의 `ui_context.json`을 기준으로 본다.
