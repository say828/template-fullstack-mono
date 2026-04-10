# DL_037 UI Spec

- screen code: `DL_037`
- screen name: `공지사항상세`
- primary route: `/dealer/support/notices/:noticeId`
- access: `role:DEALER`
- source spec: `sdd/01_planning/02_screen/ir/dealer/dealer_screen_spec.pdf`
- page number: `38`

## Screen Requirements

### 1. 공지 본문 영역
  - 운영자가 등록한 단일 공지 콘텐츠의 전체 내용을 표시하
  - 는 영역
  - 공지 데이터는 다음 항목으로 구성됨
  - 공지 제목 : 공지 식별용 대표 제목
  - 게시일 : 공지 최초 노출 일시
  - 작성자 : 공지 작성 주체(예: PALKA 운영팀)
  - 조회수 : 해당 공지 열람 누적 횟수
  - 공지 본문 : 운영 정책, 절차 변경, 이용 가이드 등 서
  - 술형 콘텐츠 전문
  - 공지 본문 내용은 HTML 텍스트 형식으로 저장되며 줄바
  - 꿈, 리스트, 강조 문구 등의 서식 유지
  - 본 화면 진입 시 해당 공지의 조회수가 1회 증가
  - 공지는 수정 이력이 있을 경우 최종 수정 기준 내용만 노
  - 출됨

### 2. 목록으로 버튼
  - 클릭 시 공지사항 목록 화면(DL_036) 으로 이동
  - 이동 시 기존 필터·페이지 상태 유지
  - 본 화면은 조회 전용이므로 별도 저장·확인 절차 없음

## Notes

- 이 문서는 seller/dealer/admin 화면명세서 PDF의 우측 요구사항 텍스트를 그대로 옮긴다.
- 평면 배치와 점유 관계는 같은 폴더의 `ui_grid.csv`를 기준으로 본다.
- grid/spec/img 연결 정보와 block-requirement 매핑은 같은 폴더의 `ui_context.json`을 기준으로 본다.
