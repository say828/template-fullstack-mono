# ADM_022 UI Spec

- screen code: `ADM_022`
- screen name: `검차운영상세(응답대기)`
- primary route: `/admin/inspections/:vehicleId`
- access: `role:ADMIN`
- source spec: `sdd/01_planning/02_screen/ir/admin/admin_screen_spec.pdf`
- page number: `23`

## Screen Requirements

### 1. 검차 일정 제안 정보 영역
  - 현재 거래 상태: 응답대기
  - 운영자가 마지막으로 전송한 검차 일정 제안 데이터 스냅
  - 샷 고정 노출
  - 본 영역의 모든 필드는 읽기 전용, 수정 불가
  - 검차 일시 : 운영자가 전송한 제안 일시
  - 담당 평가사 : 제안 시 배정된 평가사
  - 검차 장소 : 제안된 검차 센터
  - 평가사 연락처 : 배정 평가사 기준 자동 표시

### 2. 일정 변경 버튼
  - 거래 상태가 응답대기인 경우에만 활성
  - 클릭 시 현재 제안 데이터를 유지한 채 검차 일정 수정 입
  - 력 모드로 전환
  - 수정 후 전송 시 기존 제안 데이터 폐기 → 신규 제안 데
  - 이터로 대체 저장

### 3. 알림 재발송 버튼
  - 판매자에게 전송된 검차 일정 제안 알림을 재전송
  - 거래 상태·데이터에는 영향 없음
  - 알림 로그에 재발송 이력 기록

## Notes

- 이 문서는 seller/dealer/admin 화면명세서 PDF의 우측 요구사항 텍스트를 그대로 옮긴다.
- 평면 배치와 점유 관계는 같은 폴더의 `ui_grid.csv`를 기준으로 본다.
- grid/spec/img 연결 정보와 block-requirement 매핑은 같은 폴더의 `ui_context.json`을 기준으로 본다.
