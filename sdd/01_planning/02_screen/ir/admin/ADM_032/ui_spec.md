# ADM_032 UI Spec

- screen code: `ADM_032`
- screen name: `인도관리상세(인도완료)`
- primary route: `/admin/deliveries/:vehicleId`
- access: `role:ADMIN`
- source spec: `sdd/01_planning/02_screen/ir/admin/admin_screen_spec.pdf`
- page number: `33`

## Screen Requirements

### 1. 인도 완료 데이터 조회 영역
  - 거래 ID, 차량 모델, 판매자/딜러 정보, 현재 인도 상태가
  - ‘인도 완료’로 확정 노출되는 상단 요약 영역.
  - 해당 상태는 관리자 승인 완료 시점에 거래 상태 테이블
  - 에 기록된 값 기준 고정 표시되며, 이후 변경 불가 상태 유
  - 지.
  - 인도 일정 정보(일시, 장소), 판매자 인도 완료 확인, 딜러
  - 인도 완료 확인이 모두 완료 상태로 고정 노출.
  - 각 확인 항목에는 개별 확인 시점의 등록 일시가 함께 표
  - 시되며, 모든 데이터는 인도 승인 이벤트 이후 수정·삭제
  - 불가 상태 유지.
  - 인도 완료 시점에 업로드된 차량 인도 증빙 이미지 고정
  - 노출.
  - 인도 완료 과정에서 등록된 서류 인수 확인서 PDF 파일
  - 고정 노출.
  - 서류인수확인서는 인도 완료의 법적 증빙 자료로 저장되
  - 며, 다운로드만 가능하고 수정·재업로드 불가 상태 유지

### 2. 닫기 버튼
  - 본 거래의 인도 단계가 최종 종결 상태임을 나타내는 제
  - 어 영역
  - 본 거래의 인도 단계가 최종 종결 상태임을 나타내는 제
  - 어 영역

## Notes

- 이 문서는 seller/dealer/admin 화면명세서 PDF의 우측 요구사항 텍스트를 그대로 옮긴다.
- 평면 배치와 점유 관계는 같은 폴더의 `ui_grid.csv`를 기준으로 본다.
- grid/spec/img 연결 정보와 block-requirement 매핑은 같은 폴더의 `ui_context.json`을 기준으로 본다.
