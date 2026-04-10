# FRT_048 UI Spec

- screen code: `FRT_048`
- screen name: `공지사항상세`
- primary route: `/seller/support/notices/:noticeId`
- access: `role:SELLER`
- source spec: `sdd/01_planning/02_screen/ir/seller/seller_screen_spec.pdf`
- page number: `49`

## Screen Requirements

### 1. 공지 메타 정보 영역
  - 선택된 공지의 기준 식별 정보 표시 영역.
  - 공지 제목 노출
  - 게시일, 작성 주체, 조회수 동시 노출
  - 목록·검색·분류 화면에서 선택된 공지 데이터와 1:1 매칭
  - 본 화면 진입 시 해당 공지 조회수 1회 증가 처리

### 2. 공지 본문 영역
  - 공지 전문 내용 표시 영역.
  - 운영 공지 원문 그대로 노출
  - 단락·목록·구분선·강조 서식 유지

### 3. 목록 복귀 영역
  - 공지 리스트 화면 복귀 제어 영역.
  - 클릭 시 직전 공지 목록 상태(검색어·분류 조건 유지)로
  - 복귀
  - 공지 상세 열람 종료 트리거 역할 수행

## Notes

- 이 문서는 seller/dealer/admin 화면명세서 PDF의 우측 요구사항 텍스트를 그대로 옮긴다.
- 평면 배치와 점유 관계는 같은 폴더의 `ui_grid.csv`를 기준으로 본다.
- grid/spec/img 연결 정보와 block-requirement 매핑은 같은 폴더의 `ui_context.json`을 기준으로 본다.
