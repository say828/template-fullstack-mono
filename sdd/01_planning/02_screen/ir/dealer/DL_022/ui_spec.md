# DL_022 UI Spec

- screen code: `DL_022`
- screen name: `거래결제상세(감가입력전)`
- primary route: `/dealer/transactions/:vehicleId/detail/depreciation-waiting`
- access: `role:DEALER`
- source spec: `sdd/01_planning/02_screen/ir/dealer/dealer_screen_spec.pdf`
- page number: `23`

## Screen Requirements

### 1. 검차 리포트 영역
  - 검차가 완료되고 검차 결과 데이터가 확정된 상태를 표시
  - 하는 영역.
  - 검차 주요 결과 요약: 외관 흠집, 타이어 마모율, 하부 이
  - 상 여부 등 핵심 항목 요약
  - 리포트 상태: 등록 완료
  - 검차 리포트 다운로드 버튼: PDF 형식의 검차 리포트 파
  - 일 다운로드
  - 본 영역은 조회 전용이며, 수정 불가.

### 2. 감가 협의 영역 (활성화)
  - 검차 리포트 등록 완료 시점에 자동 활성화됨.
  - 상태 태그: 감가 협의
  - [감가 금액 입력하기] 버튼 활성화
  - 버튼 클릭 시 감가 제안 팝업 (DL_023)호출
  - 해당 버튼은 딜러만 사용 가능하며, 감가 제안 제출 전까
  - 지 이후 단계 잠금 유지.

## Notes

- 이 문서는 seller/dealer/admin 화면명세서 PDF의 우측 요구사항 텍스트를 그대로 옮긴다.
- 평면 배치와 점유 관계는 같은 폴더의 `ui_grid.csv`를 기준으로 본다.
- grid/spec/img 연결 정보와 block-requirement 매핑은 같은 폴더의 `ui_context.json`을 기준으로 본다.
