# FRT_016 UI Spec

- screen code: `FRT_016`
- screen name: `입찰현황`
- primary route: `/seller/vehicles/:vehicleId/bids`
- access: `role:SELLER`
- source spec: `sdd/01_planning/02_screen/ir/seller/seller_screen_spec.pdf`
- page number: `17`

## Screen Requirements

### 1. 차량 요약 영역
  - 차량 대표 이미지, 거래 상태 태그 ‘입찰중’, 거래 유형 태
  - 그 ‘국내 거래’ 노출됨.
  - 차량명, 연식, 주행거리, 연료 정보 노출됨.
  - 현재 최고 입찰가, 입찰 건수, 입찰 마감 기한, 남은 기간
  - 이 함께 노출됨.
  - 표시 값은 실시간 입찰 데이터 기준으로 갱신됨.

### 2. 차량 상세 보기 버튼
  - 우측 상단 고정 노출됨.
  - 클릭 시 차량 상세 정보 화면(FRT_014) 으로 전환됨.
  - 전환 시 현재 입찰 현황 데이터는 유지됨.

### 3. 입찰 목록 영역
  - 입찰 딜러 리스트가 테이블 형태로 노출됨.
  - 컬럼 구성: 딜러명 / 입찰가 / 입찰 시간 / 국가 / 비고
  - 입찰가는 내림차순 기준 기본 정렬됨.
  - 현재 최고 입찰가는 Highest 태그로 시각적 강조 노출됨.

### 4. 더 보기 버튼
  - 기본 노출 건수 초과 시 하단에 노출됨.
  - 클릭 시 추가 입찰 내역이 목록 하단에 로드됨.
  - 로드 후 기존 스크롤 위치는 유지됨

### 5. 입찰 관리 패널
  - 남은 시간 카운트다운 타이머 노출됨.
  - ‘새 입찰 알림 받기’ 토글, ‘최고가 자동 갱신 알림’ 토글 노
  - 출됨.
  - 각 토글 상태는 판매자 계정 기준으로 저장됨.

## Notes

- 이 문서는 seller/dealer/admin 화면명세서 PDF의 우측 요구사항 텍스트를 그대로 옮긴다.
- 평면 배치와 점유 관계는 같은 폴더의 `ui_grid.csv`를 기준으로 본다.
- grid/spec/img 연결 정보와 block-requirement 매핑은 같은 폴더의 `ui_context.json`을 기준으로 본다.
