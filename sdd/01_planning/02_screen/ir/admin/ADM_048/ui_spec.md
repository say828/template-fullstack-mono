# ADM_048 UI Spec

- screen code: `ADM_048`
- screen name: `FAQ관리`
- primary route: `/admin/support/faqs`
- access: `role:ADMIN`
- source spec: `sdd/01_planning/02_screen/ir/admin/admin_screen_spec.pdf`
- page number: `49`

## Screen Requirements

### 1. 상단 검색 영역
  - 키워드 기준 FAQ 전체 데이터 탐색 영역.
  - 제목·본문 포함 텍스트 기준 통합 검색.
  - 검색 조건은 하단 필터(2번) 조건과 동시 적용 구조.
  - 검색 상태는 페이지 이동·목록 갱신 시 유지, 새로고침 시
  - 초기화.

### 2. 필터 조건 영역
  - FAQ 노출 정책 제어 핵심 필터.
  - 채널: 판매자 / 딜러 / 전체 노출 구분 기준.
  - 카테고리: 서비스 기능 분류 체계 기준.
  - 노출 여부: 사용자 화면 실제 노출 제어 기준.
  - 모든 필터는 목록 데이터 조회 기준으로 직접 반영되며,
  - 통합 조건 필터 구조 유지

### 3. FAQ 등록 버튼
  - 클릭 시 신규 FAQ 콘텐츠 생성(ADM_049)화면 호출.
  - 등록 완료 시 본 목록에 즉시 반영.
  - 등록 콘텐츠는 채널·카테고리·노출 여부 기준에 따라 사
  - 용자 서비스 화면 동기 노출 구조

### 4. FAQ 목록 영역
  - 각 행은 단일 FAQ 콘텐츠의 운영 단위로 관리됨.
  - No: 운영 기준 정렬 순번.
  - 질문 제목: 사용자 화면 노출 제목.
  - 채널: 노출 대상 서비스(판매자/딜러).
  - 카테고리: 서비스 기능 분류 기준값.
  - 노출여부: 실제 서비스 노출 상태.
  - 등록자 / 수정일: 콘텐츠 운영 이력 관리 기준 정보.
  - 목록 행 클릭 시 해당 FAQ의 상세 관리(ADM_049) 화면
  - 호출.

## Notes

- 이 문서는 seller/dealer/admin 화면명세서 PDF의 우측 요구사항 텍스트를 그대로 옮긴다.
- 평면 배치와 점유 관계는 같은 폴더의 `ui_grid.csv`를 기준으로 본다.
- grid/spec/img 연결 정보와 block-requirement 매핑은 같은 폴더의 `ui_context.json`을 기준으로 본다.
