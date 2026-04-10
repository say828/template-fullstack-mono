# DL_036 UI Spec

- screen code: `DL_036`
- screen name: `공지사항`
- primary route: `/dealer/support/notices`
- access: `role:DEALER`
- source spec: `sdd/01_planning/02_screen/ir/dealer/dealer_screen_spec.pdf`
- page number: `37`

## Screen Requirements

### 1. 공지 검색 영역
  - 입력된 키워드를 기준으로 공지 리스트가 실시간 필터링
  - 됨.
  - 검색 대상은 공지 제목·공지 분류·공지 본문 요약 영역 전
  - 체이며, 입력 즉시 서버 기준 필터 결과 반영.
  - 검색 결과 없음 상태에서는 “검색 결과 없음” 빈 화면 노
  - 출.

### 2. 공지 분류 필터 탭
  - 공지 유형별 필터링을 수행하는 1차 분기 영역.
  - 선택된 탭 기준으로 하위 공지 리스트 노출 전환됨.
  - 탭 변경 시 기존 검색 키워드 조건 유지 상태로 필터 재적
  - 용.

### 3. 공지 리스트 영역
  - 리스트 정렬 기준은 등록일 내림차순 고정.
  - 행 클릭 시 해당 공지의 상세(DL_037) 화면으로 전환됨.
  - 열람 이력은 개별 사용자 단위로 누적 관리됨.

## Notes

- 이 문서는 seller/dealer/admin 화면명세서 PDF의 우측 요구사항 텍스트를 그대로 옮긴다.
- 평면 배치와 점유 관계는 같은 폴더의 `ui_grid.csv`를 기준으로 본다.
- grid/spec/img 연결 정보와 block-requirement 매핑은 같은 폴더의 `ui_context.json`을 기준으로 본다.
