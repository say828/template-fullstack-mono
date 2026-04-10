# DL_002 UI Spec

- screen code: `DL_002`
- screen name: `프로필`
- primary route: `/dealer/profile`
- access: `role:DEALER`
- source spec: `sdd/01_planning/02_screen/ir/dealer/dealer_screen_spec.pdf`
- page number: `3`

## Screen Requirements

### 1. 계정 정보 영역
  - 현재 로그인된 딜러 계정의 식별 정보 조회 전용 영역
  - 사용자명 + 이메일 주소 표시로 로그인 주체를 명확히 식
  - 별
  - 세션 주체 확인 목적의 UI 영역이며 수정·변경 불가 구조
  - 유지
  - 모든 거래·입찰·정산 행위의 권한 주체를 시각적으로 고
  - 정시키는 기준 정보 역할

### 2. 로그아웃 영역
  - 현재 로그인된 딜러 계정의 세션 종료 트리거 영역
  - 클릭 시 즉시 로그아웃 처리 및 서비스 접근 권한 해제 흐
  - 름 시작
  - 로그아웃 완료 후 랜딩페이지 화면(FRT_001)으로 이동
  - 처리
  - 로그아웃 시 진행 중이던 입찰·거래 화면 접근 세션 모두
  - 무효화 처리

## Notes

- 이 문서는 seller/dealer/admin 화면명세서 PDF의 우측 요구사항 텍스트를 그대로 옮긴다.
- 평면 배치와 점유 관계는 같은 폴더의 `ui_grid.csv`를 기준으로 본다.
- grid/spec/img 연결 정보와 block-requirement 매핑은 같은 폴더의 `ui_context.json`을 기준으로 본다.
