# ADM_005 UI Spec

- screen code: `ADM_005`
- screen name: `알림`
- primary route: `/admin/notifications`
- access: `role:ADMIN`
- source spec: `sdd/01_planning/02_screen/ir/admin/admin_screen_spec.pdf`
- page number: `6`

## Screen Requirements

### 1. 알림 아이콘 영역 (헤더)
  - 관리자 계정 기준 미확인 알림 존재 여부를 뱃지(dot) 상
  - 태로 표시
  - 미확인 알림이 1건 이상 존재할 경우에만 활성 상태 유지
  - 클릭 시 알림 패널 호출
  - 모든 알림이 읽음 처리된 경우 뱃지 자동 제거

### 2. 알림 목록 영역
  - 운영 개입이 필요한 이벤트만 리스트업하여 시간 역순으
  - 로 노출
  - 각 알림 항목은 다음 정보를 고정 포함
  - 알림 유형 아이콘
  - 이벤트 요약 메시지
  - 이벤트 발생 일시
  - 미확인 알림은 시각적으로 강조(점 등) 처리
  - 알림 항목 클릭 시
  - → 해당 이벤트의 관리자 처리 화면으로 즉시 이동
  - → 이동과 동시에 해당 알림은 읽음 상태로 전환

### 3. 모두 읽음처리 버튼
  - 현재 노출된 알림 중 미확인 상태가 1건 이상일 경우에만
  - 활성화
  - 클릭 시
  - 해당 관리자 계정 기준 모든 알림을 일괄 읽음 처리
  - 서버 기준 알림 상태 일괄 업데이트
  - 알림 뱃지 즉시 제거
  - 이미 모두 읽음 상태인 경우 비활성 처리

## Notes

- 이 문서는 seller/dealer/admin 화면명세서 PDF의 우측 요구사항 텍스트를 그대로 옮긴다.
- 평면 배치와 점유 관계는 같은 폴더의 `ui_grid.csv`를 기준으로 본다.
- grid/spec/img 연결 정보와 block-requirement 매핑은 같은 폴더의 `ui_context.json`을 기준으로 본다.
