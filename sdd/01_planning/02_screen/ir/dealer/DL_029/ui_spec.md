# DL_029 UI Spec

- screen code: `DL_029`
- screen name: `거래결제상세(거래완료)`
- primary route: `/dealer/transactions/:vehicleId/detail/completed`
- access: `role:DEALER`
- source spec: `sdd/01_planning/02_screen/ir/dealer/dealer_screen_spec.pdf`
- page number: `30`

## Screen Requirements

### 1. 거래 완료 요약 영역
  - 거래 상태: 거래가 완료되었습니다 고정 노출
  - 인도 완료 시각: 차량 인도 확정 시각
  - 송금 완료 시각: 딜러의 송금 정산 확정 시각
  - 정산 완료 시각: 시스템이 거래를 완료 상태로 최종 확정
  - 한 시각
  - 본 영역의 모든 시각 정보는 거래 종결 시점에 고정되며
  - 이후 변경 불가

### 2. 송금·정산 요약 영역
  - 송금 일자: 딜러가 입력한 실제 송금일
  - 송금 금액: 감가 협의 확정 후 최종 거래 금액
  - 송금 방법: 거래 시 선택된 송금 방식
  - 정산 상태: 정산 완료 고정 표시

### 3. 증빙 보기 버튼
  - 클릭 시 영수증 증빙(DL_019) 팝업 호출
  - 거래에 등록된 모든 송금 증빙 파일 열람

### 4. 정산 확인서 다운로드 버튼
  - 클릭 시 본 거래의 정산 결과를 문서 형태로 다운로드

### 5. 명의 이전·말소 자료 영역
  - 거래 종료를 위해 등록된 명의 이전·말소 관련 파일 목록
  - 각 파일별 개별 다운로드 가능
  - 해당 파일들은 거래 종료 후 영구 보존 이력으로 관리됨

## Notes

- 이 문서는 seller/dealer/admin 화면명세서 PDF의 우측 요구사항 텍스트를 그대로 옮긴다.
- 평면 배치와 점유 관계는 같은 폴더의 `ui_grid.csv`를 기준으로 본다.
- grid/spec/img 연결 정보와 block-requirement 매핑은 같은 폴더의 `ui_context.json`을 기준으로 본다.
