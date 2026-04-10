# FRT_047 UI Spec

- screen code: `FRT_047`
- screen name: `공지사항`
- primary route: `/seller/support/notices`
- access: `role:SELLER`
- source spec: `sdd/01_planning/02_screen/ir/seller/seller_screen_spec.pdf`
- page number: `48`

## Screen Requirements

### 1. 공지 검색 영역
  - 공지 데이터 전문 검색 입력 영역.
  - 입력 문자열 기준 제목·본문 전문 텍스트 매칭
  - 입력 즉시 리스트 실시간 필터링
  - 검색어 미입력 상태에서는 현재 선택된 분류 기준 전체
  - 공지 노출

### 2. 분류 필터 영역
  - 공지 데이터 분류 기준 선택 영역.
  - 선택 값: 전체 / 공지사항 / 이벤트 / 업데이트 / 약관
  - 단일 선택 구조 유지
  - 선택 분류 기준으로 공지 리스트 필터링
  - 검색어 조건 존재 시 검색 결과 범위 내에서 분류 재적용

### 3. 공지 리스트 영역
  - 공지 데이터 요약 목록 표시 영역.
  - 각 행 구성 요소: 분류 태그 · 제목 · 등록일
  - 최신 등록일 기준 기본 정렬
  - 제목 클릭 시 해당 공지 상세 화면(FRT_048) 이동
  - 목록은 검색·분류 조건에 따라 실시간 재구성

## Notes

- 이 문서는 seller/dealer/admin 화면명세서 PDF의 우측 요구사항 텍스트를 그대로 옮긴다.
- 평면 배치와 점유 관계는 같은 폴더의 `ui_grid.csv`를 기준으로 본다.
- grid/spec/img 연결 정보와 block-requirement 매핑은 같은 폴더의 `ui_context.json`을 기준으로 본다.
