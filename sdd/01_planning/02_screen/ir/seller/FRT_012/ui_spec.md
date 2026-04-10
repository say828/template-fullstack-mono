# FRT_012 UI Spec

- screen code: `FRT_012`
- screen name: `프로필`
- primary route: `/settings/profile`
- access: `role:SELLER`
- source spec: `sdd/01_planning/02_screen/ir/seller/seller_screen_spec.pdf`
- page number: `13`

## Screen Requirements

### 1. 사용자 정보 표시 영역
  - 현재 로그인 중인 계정의 이름 / 이메일 주소 표시
  - 표시 정보는 세션 기준 사용자 정보를 호출하여 출력
  - 해당 정보는 읽기 전용 텍스트 형태로 구성
  - 패널 호출 시마다 최신 세션 정보 기준으로 갱신됨

### 2. 로그아웃 버튼
  - 클릭 시 현재 세션 종료 처리
  - 모든 인증 정보 초기화 후 비로그인 상태 랜딩 화면
  - (FRT_001) 로 이동

## Notes

- 이 문서는 seller/dealer/admin 화면명세서 PDF의 우측 요구사항 텍스트를 그대로 옮긴다.
- 평면 배치와 점유 관계는 같은 폴더의 `ui_grid.csv`를 기준으로 본다.
- grid/spec/img 연결 정보와 block-requirement 매핑은 같은 폴더의 `ui_context.json`을 기준으로 본다.
