# FRT_046 UI Spec

- screen code: `FRT_046`
- screen name: `자주묻는질문`
- primary route: `/support/faqs`
- access: `public`
- source spec: `sdd/01_planning/02_screen/ir/seller/seller_screen_spec.pdf`
- page number: `47`

## Screen Requirements

### 1. 고객센터 메뉴 영역
  - 고객지원 메뉴 진입 및 서브 메뉴 전환 영역.
  - 현재 위치 자주 묻는 질문 상태 표시
  - 공지사항, 1:1 문의 메뉴와 동일 계층 구조 유지
  - 메뉴 변경 시 고객센터 메인 컨텐츠 영역 전체 교체 로드

### 2. FAQ 검색 영역
  - FAQ 데이터셋에 대한 실시간 질의 필터 입력 영역.
  - 입력 문자열 기준으로 질문 제목·본문 전문 텍스트 매칭
  - 검색 수행
  - 입력 즉시 결과 목록 갱신
  - 검색어 미입력 시 전체 FAQ 데이터 노출

### 3. 카테고리 필터 영역
  - FAQ 데이터 분류 기준 선택 영역.
  - 선택 카테고리 기준으로 FAQ 목록 필터링
  - 다중 선택 불가, 단일 선택 유지
  - 선택 상태 값: 전체 / 입찰·낙찰 / 검차·감가 협의 / 인도·
  - 정산 / 계정·보안 / 기타문의
  - 카테고리 변경 시 현재 검색어 조건 유지한 상태로 결과
  - 재필터링

### 4. FAQ 리스트 영역
  - 질문·답변 단위 정보 제공 영역.
  - 질문 행 클릭 시 해당 문항만 펼쳐지는 아코디언 구조
  - 단일 문항만 확장 유지
  - 확장 시 답변 전문 로드
  - 데이터는 최신 수정일 기준 정렬 유지
  - 검색·카테고리 조건 변경 시 노출 리스트 실시간 재구성

## Notes

- 이 문서는 seller/dealer/admin 화면명세서 PDF의 우측 요구사항 텍스트를 그대로 옮긴다.
- 평면 배치와 점유 관계는 같은 폴더의 `ui_grid.csv`를 기준으로 본다.
- grid/spec/img 연결 정보와 block-requirement 매핑은 같은 폴더의 `ui_context.json`을 기준으로 본다.
