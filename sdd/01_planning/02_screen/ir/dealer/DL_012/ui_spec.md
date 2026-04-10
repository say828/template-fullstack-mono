# DL_012 UI Spec

- screen code: `DL_012`
- screen name: `입찰상세(입찰중)`
- primary route: `/dealer/bids/:vehicleId/detail/open`
- access: `role:DEALER`
- source spec: `sdd/01_planning/02_screen/ir/dealer/dealer_screen_spec.pdf`
- page number: `13`

## Screen Requirements

### 1. 입찰 현황 영역
  - 서버 기준 현재 최고 입찰가 / 입찰 건수 / 마감까지 남은
  - 시간을 실시간 표시함.
  - 해당 값들은 경합 판단의 기준 데이터로 사용되며, 화면
  - 체류 중에도 주기적으로 동기화 갱신됨.
  - 마감 시점 도래 시 본 패널은 자동으로 ‘마감’ 상태 구조로
  - 전환됨(DL_013 참고)

### 2. 내 입찰 정보 영역
  - 현재 딜러의 입찰가를 표시하며, 서버 기준 최신 값으로
  - 유지됨.
  - 내 입찰가가 최고가일 경우 “현재 최고가입니다.” 상태 배
  - 너가 노출됨.
  - 최고가가 아닐 경우 최고가 대비 차이를 내부 계산하여
  - 수정 판단에 사용됨.

### 3. 입찰가 수정 버튼
  - 마감 이전에만 활성화됨.
  - 클릭 시 입찰가 수정 팝업(DL_011) 호출됨.
  - 수정 완료 시 본 패널의 내 입찰가·입찰 건수·최고가·순위
  - 데이터가 즉시 재계산·갱신됨.

### 4. 입찰 취소 버튼
  - 마감 이전에만 활성화됨.
  - 클릭 시 입찰 취소 확인 프로세스 호출됨.
  - 취소 성공 시 본 매물에 대한 내 입찰 기록은 즉시 무효 처
  - 리되며, 본 화면은 ‘취소됨 상태 매물 상세’ 화면 구조로
  - 전환됨.(DL_016 참고)

## Notes

- 이 문서는 seller/dealer/admin 화면명세서 PDF의 우측 요구사항 텍스트를 그대로 옮긴다.
- 평면 배치와 점유 관계는 같은 폴더의 `ui_grid.csv`를 기준으로 본다.
- grid/spec/img 연결 정보와 block-requirement 매핑은 같은 폴더의 `ui_context.json`을 기준으로 본다.
