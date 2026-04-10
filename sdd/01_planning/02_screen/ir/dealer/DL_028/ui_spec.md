# DL_028 UI Spec

- screen code: `DL_028`
- screen name: `거래결제상세(송금정산)`
- primary route: `/dealer/transactions/:vehicleId/detail/remittance`
- access: `role:DEALER`
- source spec: `sdd/01_planning/02_screen/ir/dealer/dealer_screen_spec.pdf`
- page number: `29`

## Screen Requirements

### 1. 인도 진행 완료 정보 영역
  - 인도 완료 시각 표시: 판매자·딜러·시스템 기준으로 인도
  - 확정된 최종 시각
  - 인도 증빙 파일 목록: 인도 확인을 위해 업로드된 모든 증
  - 빙 파일의 고정 이력 목록
  - 본 영역 데이터는 인도 단계 종료 시점에 고정되며 이후
  - 수정 불가

### 2. 송금·정산 입력 영역
  - 판매자 송금 안내 문구 노출: 딜러의 송금 책임과 등록 의
  - 무 명시
  - 송금 일자 입력: 실제 판매자에게 대금을 송금한 날짜
  - 송금 금액 입력: 확정된 최종 거래가 기준 금액만 입력 가
  - 능
  - 송금 방법 선택: 계좌이체 / 기타 중 단일 선택
  - 송금 증빙 파일 업로드(필수): 거래 증빙 파일 첨부, 최대
  - 10MB, JPG/PNG/PDF 허용
  - 메모 입력(선택): 송금 특이사항 기록용 보조 필드

### 3. 송금 완료 등록 버튼
  - 모든 필수 항목 충족 시 활성화
  - 클릭 시 정산 확정 처리 수행
- 송금 완료가 등록되었습니다.
  - 확인

## Notes

- 이 문서는 seller/dealer/admin 화면명세서 PDF의 우측 요구사항 텍스트를 그대로 옮긴다.
- 평면 배치와 점유 관계는 같은 폴더의 `ui_grid.csv`를 기준으로 본다.
- grid/spec/img 연결 정보와 block-requirement 매핑은 같은 폴더의 `ui_context.json`을 기준으로 본다.
