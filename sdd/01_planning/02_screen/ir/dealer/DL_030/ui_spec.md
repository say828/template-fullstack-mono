# DL_030 UI Spec

- screen code: `DL_030`
- screen name: `계정정보`
- primary route: `/dealer/settings/account`
- access: `role:DEALER`
- source spec: `sdd/01_planning/02_screen/ir/dealer/dealer_screen_spec.pdf`
- page number: `31`

## Screen Requirements

### 1. 설정 메뉴 네비게이션 영역
  - 좌측 메뉴를 통해 설정 하위 화면 이동
  - • 현재 위치: 계정 정보 활성 표시
  - 사업자/서류 메뉴 클릭 시 (DL_031) 화면으로 전환
  - 알림설정 메뉴 클릭 시 (DL_032) 화면으로 전환
  - 보안/비밀번호 메뉴 클릭 시 (DL_033) 화면으로 전환
  - 약관 및 회원탈퇴 메뉴 클릭 시 (DL_034) 화면으로 전환

### 2. 계정 요약 영역
  - 사용자 이름, 이메일 표시
  - 해당 정보는 가입 시 등록된 기본 식별 정보이며 수정 불
  - 가

### 3. 계정 정보 수정 영역
  - 휴대폰 번호: 딜러 연락 기준 번호, 저장 즉시 계정 기준값
  - 갱신
  - 활동 국가: 거래·세금·서류 처리 기준 국가 값, 변경 즉시
  - 거래 정책·양식에 반영
  - 표시 언어: 플랫폼 UI·알림·시스템 메시지 전체 표시 언어,
  - 저장 즉시 전 화면 반영

### 4. 저장 버튼
  - 모든 수정 항목 검증 완료 시 활성
  - 클릭 시 입력값 검증 후 계정 설정 최종 저장
  - 저장 완료 후 시스템 전역에 즉시 반영

## Notes

- 이 문서는 seller/dealer/admin 화면명세서 PDF의 우측 요구사항 텍스트를 그대로 옮긴다.
- 평면 배치와 점유 관계는 같은 폴더의 `ui_grid.csv`를 기준으로 본다.
- grid/spec/img 연결 정보와 block-requirement 매핑은 같은 폴더의 `ui_context.json`을 기준으로 본다.
