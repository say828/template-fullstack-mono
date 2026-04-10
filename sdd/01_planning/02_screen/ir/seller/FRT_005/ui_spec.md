# FRT_005 UI Spec

- screen code: `FRT_005`
- screen name: `회원가입유형선택`
- primary route: `/signup`
- access: `public`
- source spec: `sdd/01_planning/02_screen/ir/seller/seller_screen_spec.pdf`
- page number: `6`

## Screen Requirements

### 1. 판매자로 가입하기 카드
  - 판매자 회원가입 플로우로 진입하는 선택 카드.
  - 선택 시 이후 모든 가입 화면이 판매자 기준 가입 구조로
  - 구성됨.
  - 클릭 시 판매자 회원가입 정보 입력 화면(FRT_006)으로
  - 이동됨.
  - 해당 역할은 거래 구조상 차량 소유자(판매자) 로서의 권
  - 한만 부여되며, 입찰·감가 입력·딜러 기능 접근 불가.

### 2. 딜러로 가입하기 카드
  - 딜러 회원가입 플로우로 진입하는 선택 카드.
  - 선택 시 이후 모든 가입 화면이 딜러 기준 가입 구조로 구
  - 성됨.
  - 딜러 계정은 관리자 승인 완료 후 활성화됨.
  - 승인 이전까지는 로그인 불가능
  - 클릭 시 딜러 회원가입 정보 입력 화면(FRT_008)으로 이
  - 동됨.

### 3. 로그인하기
  - 기존 가입 사용자를 위한 로그인 전환 링크.
  - 클릭 시 로그인 화면(FRT_002)으로 이동됨.

## Notes

- 이 문서는 seller/dealer/admin 화면명세서 PDF의 우측 요구사항 텍스트를 그대로 옮긴다.
- 평면 배치와 점유 관계는 같은 폴더의 `ui_grid.csv`를 기준으로 본다.
- grid/spec/img 연결 정보와 block-requirement 매핑은 같은 폴더의 `ui_context.json`을 기준으로 본다.
