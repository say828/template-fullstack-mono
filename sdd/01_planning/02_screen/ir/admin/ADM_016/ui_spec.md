# ADM_016 UI Spec

- screen code: `ADM_016`
- screen name: `거래상세(상태이력)`
- primary route: `/admin/trades/:vehicleId`
- access: `role:ADMIN`
- source spec: `sdd/01_planning/02_screen/ir/admin/admin_screen_spec.pdf`
- page number: `17`

## Screen Requirements

### 1. 이력 리포트 출력
  - 현재 거래의 전체 상태 이력을 PDF 리포트로 출력
  - 출력 데이터 범위
  - → 거래 생성부터 거래 종료까지 모든 로그
  - → 담당 주체·처리 결과·시간 포함
  - 출력 파일은 감사·법무·세무 자료로 사용

### 2. 상태 이력 타임라인
  - 각 로그는 단일 불변 이벤트 레코드이며 다음 필드를 고
  - 정 포함한다.
  - 이벤트 발생 시각
  - 서버 기준 타임스탬프
  - 모든 정렬의 절대 기준
  - 이벤트 명
  - 거래 단계 전환 또는 운영 처리 명칭
  - (입찰 시작, 낙찰 확정, 검차 배정, 감가 제안 등록, 판
  - 매자 승인, 인도 완료, 송금 완료, 정산 완료, 거래 종료
  - 등)
  - 처리 주체
  - 시스템 / 관리자 계정 / 딜러 / 판매자
  - 실제 행위자 명확 표시
  - 처리 결과
  - 해당 이벤트의 상태 전환 결과 요약
  - (예: 감가 협의 완료 → 인도 단계 전환)
  - 정렬 규칙
  - 발생 시각 기준 역순 고정 출력
  - 최근 이벤트가 항상 상단
  - 무결성 규칙
  - 모든 로그는 생성 즉시 영구 저장
  - 수정·삭제·비활성화·은폐 불가

## Notes

- 이 문서는 seller/dealer/admin 화면명세서 PDF의 우측 요구사항 텍스트를 그대로 옮긴다.
- 평면 배치와 점유 관계는 같은 폴더의 `ui_grid.csv`를 기준으로 본다.
- grid/spec/img 연결 정보와 block-requirement 매핑은 같은 폴더의 `ui_context.json`을 기준으로 본다.
