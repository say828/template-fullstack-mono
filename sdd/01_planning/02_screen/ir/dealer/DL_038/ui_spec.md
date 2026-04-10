# DL_038 UI Spec

- screen code: `DL_038`
- screen name: `1:1문의`
- primary route: `/dealer/support/inquiries`
- access: `role:DEALER`
- source spec: `sdd/01_planning/02_screen/ir/dealer/dealer_screen_spec.pdf`
- page number: `39`

## Screen Requirements

### 1. 문의 입력 영역
  - 문의 접수를 위한 사용자 입력 영역
  - 이메일
  - 답변 수신용 이메일 주소
  - 미입력 또는 형식 오류 시 접수 불가
  - 문의 유형
  - 입찰 / 검차·감가 / 인도·정산 / 결제·송금 / 계정·
  - 보안 / 기타
  - 선택값에 따라 CS 분류 코드 자동 매핑됨
  - 문의 제목
  - CS 관리 화면에서 식별되는 대표 제목
  - 문의 내용
  - 문의 상세 서술 입력
  - 최소 입력 글자 수 검증 적용
  - 파일 첨부 (선택)
  - 다중 파일 업로드 가능
  - 파일 형식: JPG, PNG, PDF
  - 최대 10MB 제한
  - 서버 업로드 완료 후 파일 목록 표시
  - 하단 고지 문구
  - 접수 완료 시 등록 이메일로 자동 회신
  - 영업일 기준 최대 1일 이내 응답 예정

### 2. 개인정보 수집·이용 동의
  - 필수 체크 항목
  - 미체크 시 문의 접수 불가
  - 동의 내용은 문의 데이터와 함께 저장됨

### 3. 문의하기 버튼
  - 클릭 시 입력값 검증 → 서버 전송 → 문의 접수 생성
  - 접수 성공 시
  - 접수 완료 알림 메시지 노출
  - 모든 입력 필드 초기화
  - 파일 목록 제거
  - 화면이 최초 상태로 재렌더링
- 운영팀이 확인 후 등록하신 이메일로
  - 답변을 드릴 예정입니다.
  - 확인

## Notes

- 이 문서는 seller/dealer/admin 화면명세서 PDF의 우측 요구사항 텍스트를 그대로 옮긴다.
- 평면 배치와 점유 관계는 같은 폴더의 `ui_grid.csv`를 기준으로 본다.
- grid/spec/img 연결 정보와 block-requirement 매핑은 같은 폴더의 `ui_context.json`을 기준으로 본다.
