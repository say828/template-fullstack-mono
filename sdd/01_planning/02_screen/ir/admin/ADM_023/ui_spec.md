# ADM_023 UI Spec

- screen code: `ADM_023`
- screen name: `검차운영상세(리포트미제출)`
- primary route: `/admin/inspections/:vehicleId`
- access: `role:ADMIN`
- source spec: `sdd/01_planning/02_screen/ir/admin/admin_screen_spec.pdf`
- page number: `24`

## Screen Requirements

### 1. 검차 일정 정보 영역
  - 현재 거래 상태: 검차중
  - 검차 일정 승인 이후 확정된 검차 정보 고정 노출
  - 모든 필드는 읽기 전용
  - 검차 일시 : 승인된 최종 검차 일정
  - 장소 : 검차 센터 주소
  - 평가사 : 배정 평가사 이름
  - 연락처 : 평가사 연락처

### 2. 검차 결과 입력 영역
  - 검차 판정 핵심 데이터 입력 영역
  - 외관 상태 (드롭다운)
  - 엔진/미션 상태 (드롭다운)
  - 사고 이력 (드롭다운)
  - 침수 여부 (드롭다운)
  - 정밀 판정 태그(다중 선택): (엔진오일/브레이크/타이어/
  - 배터리/냉각수/점화계)
  - 추가 기록: 종합 판정 코멘트 (텍스트 입력)
  - 첨부 자료: 사진 첨부 (PNG/JPG/PDF, ≤ 5MB) , 검차 리
  - 포트 첨부 (PNG/JPG/PDF, ≤ 5MB)

### 3. 검차 결과 제출 버튼
  - 모든 필수 항목 입력 완료 시에만 활성
  - 클릭 시 검차 결과 저장 → 상태 전이 → 후속 단계 자동
  - 트리거

## Notes

- 이 문서는 seller/dealer/admin 화면명세서 PDF의 우측 요구사항 텍스트를 그대로 옮긴다.
- 평면 배치와 점유 관계는 같은 폴더의 `ui_grid.csv`를 기준으로 본다.
- grid/spec/img 연결 정보와 block-requirement 매핑은 같은 폴더의 `ui_context.json`을 기준으로 본다.
