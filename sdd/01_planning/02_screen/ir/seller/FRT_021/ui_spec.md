# FRT_021 UI Spec

- screen code: `FRT_021`
- screen name: `다른일정요청`
- primary route: `/seller/vehicles/:vehicleId/inspection/reschedule`
- access: `role:SELLER`
- source spec: `sdd/01_planning/02_screen/ir/seller/seller_screen_spec.pdf`
- page number: `22`

## Screen Requirements

### 1. 현재 제안된 검차 일정 요약 영역
  - 어드민이 제안한 기존 검차 일정, 담당 평가사, 검차 장소,
  - 담당 연락처가 기준 정보로 노출됨.
  - 본 영역은 참고 정보로만 제공되며 수정 불가 상태로 유
  - 지됨.
  - 이 정보는 새로운 일정 요청 판단의 기준 비교값으로 사
  - 용됨.

### 2. 새 검차 일정 요청 입력 영역
  - 희망 날짜, 희망 시간대, 선호 검차 지역, 특이사항·요청사
  - 항 입력 필드 노출됨.
  - 모든 입력값은 새로운 검차 일정 제안 데이터로 저장 대
  - 상이 됨.
  - 본 영역 입력 완료 여부가 요청 제출 가능 판단 기준으로
  - 사용됨.

### 3. 취소 버튼
  - 클릭 시 본 화면 종료됨.
  - 검차 일정 정보 팝업(FRT_020)으로 복귀됨.
  - 검차 일정 상태에는 변경 없음.

### 4. 요청 보내기 버튼
  - 클릭 시 입력된 새 검차 일정 요청이 서버에 전송됨.
  - 기존 검차 일정 제안은 무효 상태로 전환됨.
- 평가사 일정을 확인한 뒤 승인하거나
- 새로운 일정을 다시 제안할 수 있습니다.
- 확정된 일정은 알림으로 안내해 드릴게요.
  - 확인

## Notes

- 이 문서는 seller/dealer/admin 화면명세서 PDF의 우측 요구사항 텍스트를 그대로 옮긴다.
- 평면 배치와 점유 관계는 같은 폴더의 `ui_grid.csv`를 기준으로 본다.
- grid/spec/img 연결 정보와 block-requirement 매핑은 같은 폴더의 `ui_context.json`을 기준으로 본다.
