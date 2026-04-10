# DL_025 UI Spec

- screen code: `DL_025`
- screen name: `거래결제상세(감가재협의)`
- primary route: `/dealer/transactions/:vehicleId/detail/depreciation-renegotiation`
- access: `role:DEALER`
- source spec: `sdd/01_planning/02_screen/ir/dealer/dealer_screen_spec.pdf`
- page number: `26`

## Screen Requirements

### 1. 감가 협의 영역
  - 상태 배지: 재협의 요청 / 수정 제안 필요
  - 본 영역은 다음 세 그룹의 정보를 동시에 제공
- ① 딜러 기존 감가 제안 요약
  - 총 감가 금액: 딜러가 이전에 제출한 감가 합계 금액
  - 예상 최종가: 낙찰가 − 총 감가 금액
  - 항목별 감가 내역
  - 외관/도장: 범퍼 스크래치 및 도색 필요 / -500,000원
  - 타이어: 마모 60% 2본 교체 / -700,000원
  - 제안 시각: 딜러가 제안을 최종 제출한 시점
- ② 판매자 재협의 요청 정보
  - 판매자 요청 시각
  - 요청 사유 메시지
  - 판매자 희망 금액
  - 판매자 첨부 파일
- ③ 시스템 경고 메시지
  - 판매자가 재협의를 요청했습니다. 요청 내용을 확인하고
  - 감가 내역을 수정하여 다시 제출해주세요.

### 2. 감가 내역 수정하기
  - 클릭 시 감가 입력 팝업(DL_023) 호출
  - 기존 감가 데이터를 기본값으로 로드
  - 수정 완료 시 기존 제안 완전 대체
  - 재협의 요청 상태 해제
  - 상태 → 판매자 검토 대기

### 3. 이전 제안 유지
  - 기존 제안을 그대로 유지
  - 판매자에게 동일 제안 재전달
  - 상태 → 판매자 재검토 중

## Notes

- 이 문서는 seller/dealer/admin 화면명세서 PDF의 우측 요구사항 텍스트를 그대로 옮긴다.
- 평면 배치와 점유 관계는 같은 폴더의 `ui_grid.csv`를 기준으로 본다.
- grid/spec/img 연결 정보와 block-requirement 매핑은 같은 폴더의 `ui_context.json`을 기준으로 본다.
