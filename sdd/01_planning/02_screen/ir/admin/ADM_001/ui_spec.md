# ADM_001 UI Spec

- screen code: `ADM_001`
- screen name: `로그인`
- primary route: `/login`
- access: `public`
- source spec: `sdd/01_planning/02_screen/ir/admin/admin_screen_spec.pdf`
- page number: `2`

## Screen Requirements

### 1. 아이디 입력 필드
  - 관리자 로그인 식별값 입력 영역
  - 입력 값은 어드민 계정 테이블의 admin_id와 매칭됨
  - 이메일 형식 입력 강제
  - 공백·형식 오류 시 로그인 시도 불가
  - 입력 내용은 로그인 검증 단계까지 브라우저 메모리에만
  - 유지됨

### 2. 비밀번호 입력 필드
  - 관리자 비밀번호 입력 영역
  - 입력 값은 서버 해시값과 비교 검증됨
  - 입력 중 마스킹 처리 고정
  - 일정 횟수 이상 실패 시 계정 잠금 정책 적용 대상

### 3. 아이디 저장 체크
  - 체크 시 브라우저 로컬 스토리지에 saved_admin_id 저
  - 장
  - 이후 재접속 시 아이디 자동 입력 처리
  - 로그아웃 시 유지됨
  - 보안 정책에 따라 공용 PC 사용 시 미체크 권장

### 4. 비밀번호 찾기 링크
  - 클릭 시 비밀번호 찾기(ADM_002) 화면 호출
  - 관리자 이메일 인증 → 임시 비밀번호 발급 → 비밀번호
  - 재설정 화면 이동

### 5. 로그인 버튼
  - 클릭 시 입력값 검증 → 서버 인증 요청
  - 인증 성공 시
  - 관리자 세션 생성
  - 관리자 권한 정보 로딩
  - ADM_006(대시보드) 화면으로 이동
  - 인증 실패 시
  - 실패 사유에 따라 에러 메시지 분기 출력
  - 실패 횟수 누적

## Notes

- 이 문서는 seller/dealer/admin 화면명세서 PDF의 우측 요구사항 텍스트를 그대로 옮긴다.
- 평면 배치와 점유 관계는 같은 폴더의 `ui_grid.csv`를 기준으로 본다.
- grid/spec/img 연결 정보와 block-requirement 매핑은 같은 폴더의 `ui_context.json`을 기준으로 본다.
