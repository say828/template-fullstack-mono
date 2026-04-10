# ADM_045 UI Spec

- screen code: `ADM_045`
- screen name: `딜러상세`
- primary route: `/admin/dealers/:dealerId`
- access: `role:ADMIN`
- source spec: `sdd/01_planning/02_screen/ir/admin/admin_screen_spec.pdf`
- page number: `46`

## Screen Requirements

### 1. 정보 탭 영역(기본 및 신원 정보 / 입찰 참여 이력)
  - 가입 승인 된 딜러의 정보 묶음을 탭으로 분리 제공하는
  - 전환 영역.
  - 기본 및 신원 정보 탭은 기본 진입 탭으로 고정.
  - 입찰 참여 이력 탭은 해당 딜러가 입찰에 참여한 건수와
  - 리스트를 노출
  - 탭 전환은 동일 패널 내 콘텐츠만 교체되며, 입찰 참여이
  - 력 탭 클릭 시 (ADM_046) 화면으로 탭 전환

### 2. 블랙리스트 등록
  - 선택 딜러를 “블랙리스트 상태”로 전환시키는 운영 액션
  - 버튼.
  - 노출/활성 규칙(상태 기반 분기 필요)
  - 현재 상태=정상: 버튼 활성(등록 가능).
  - 현재 상태=블랙리스트: 버튼명 “블랙리스트 해제” 로
  - 변경됨
  - 현재 상태=탈퇴: 버튼명 “닫기”로 변경됨
  - 처리 결과
  - 등록 완료 시 1번 상태 태그 즉시 “블랙리스트”로 갱
  - 신.
  - 목록 화면으로 복귀 시 해당 딜러의 상태가 “블랙리스
  - 트”로 반영되어 필터/검색 결과에 즉시 영향.
  - 클릭 시 블랙리스트 (ADM_041) 화면 호출

## Notes

- 이 문서는 seller/dealer/admin 화면명세서 PDF의 우측 요구사항 텍스트를 그대로 옮긴다.
- 평면 배치와 점유 관계는 같은 폴더의 `ui_grid.csv`를 기준으로 본다.
- grid/spec/img 연결 정보와 block-requirement 매핑은 같은 폴더의 `ui_context.json`을 기준으로 본다.
