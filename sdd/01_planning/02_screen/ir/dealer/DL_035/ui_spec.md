# DL_035 UI Spec

- screen code: `DL_035`
- screen name: `자주묻는질문`
- primary route: `/dealer/support/faqs`
- access: `role:DEALER`
- source spec: `sdd/01_planning/02_screen/ir/dealer/dealer_screen_spec.pdf`
- page number: `36`

## Screen Requirements

### 1. 좌측 고객센터 메뉴
  - 고객센터 기능 진입 네비게이션
  - 현재 위치: 자주 묻는 질문
  - 공지사항 : 클릭 시 (DL_036) 화면으로 전환
  - 1:1 문의 : 클릭 시 (DL_038) 화면으로 전환

### 2. FAQ 통합 검색
  - 키워드 기반 질문 검색
  - 검색 결과는 카테고리·질문 제목·내용 영역 전체에서 매
  - 칭
  - 실시간 필터링 방식으로 질문 목록 갱신

### 3. 카테고리 필터 영역
  - FAQ 데이터 분류 기준 선택 영역.
  - 선택 카테고리 기준으로 FAQ 목록 필터링
  - 다중 선택 불가, 단일 선택 유지
  - 카테고리 변경 시 현재 검색어 조건 유지한 상태로 결과
  - 재필터링

### 4. 질문 리스트 & 답변 확장
  - 질문은 아코디언 구조로 구성
  - 질문 클릭 시 답변 영역 확장
  - 동일 그룹 내 단일 질문만 열림 유지
  - 답변 내용에는 텍스트·링크·단계 안내 포함 가능

## Notes

- 이 문서는 seller/dealer/admin 화면명세서 PDF의 우측 요구사항 텍스트를 그대로 옮긴다.
- 평면 배치와 점유 관계는 같은 폴더의 `ui_grid.csv`를 기준으로 본다.
- grid/spec/img 연결 정보와 block-requirement 매핑은 같은 폴더의 `ui_context.json`을 기준으로 본다.
