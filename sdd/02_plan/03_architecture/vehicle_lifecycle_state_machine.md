# Vehicle Lifecycle State Machine

- Owner: Codex
- Status: completed

## Scope

- 차량, 입찰, 거래 워크플로우에 흩어진 상태를 seller 차량 라이프사이클 기준으로 정리한다.
- 백엔드에서 낙찰, 유찰, 검차 이후 단계를 일관된 상태 전이 규칙으로 강제한다.
- 프론트 seller 화면이 같은 lifecycle 규칙으로 목록/상세/입찰자 선택 화면을 해석하도록 맞춘다.

## Assumptions

- `vehicles` context는 등록 매물의 원시 상태를 가진다.
- `bidding` context는 입찰 종료와 낙찰 확정의 소유자다.
- `trades` context는 낙찰 이후 검차부터 완료까지의 단계 전이를 소유한다.
- seller UI의 상태 탭은 `입찰 중 / 입찰 마감 / 검차 / 감가 협의 / 인도·정산 / 거래 완료`를 기준으로 유지한다.

## Acceptance Criteria

- 백엔드에 차량 라이프사이클 enum과 전이 표가 존재한다.
- 판매자의 명시적 낙찰 선택은 희망가 미달이어도 유찰로 바뀌지 않는다.
- 낙찰 확정 직후 거래 워크플로우가 즉시 생성되어 다음 상태가 `검차`로 전환된다.
- trade stage 변경은 허용된 전이만 통과한다.
- seller 차량 목록, 마감 상세, 입찰자 선택, 입찰중 상세 화면이 공통 lifecycle helper를 사용한다.
- 상태 해석 불일치 시 UI는 임의 폴백이 아니라 `상태 없음`으로 노출한다.

## Execution Checklist

- [x] 기능명세서와 seller 화면명세서에서 차량 라이프사이클 요구사항을 재확인한다.
- [x] 백엔드 공용 lifecycle/state machine 모듈을 추가한다.
- [x] 입찰 마감 로직을 lifecycle 규칙으로 재정렬한다.
- [x] 낙찰 확정 시 거래 워크플로우를 같은 요청 안에서 생성한다.
- [x] trade stage 변경에 허용 전이 검증을 추가한다.
- [x] seller 프론트 화면을 공통 lifecycle helper 기준으로 정리한다.
- [x] 테스트와 runtime 검증을 수행하고 verify 문서를 갱신한다.

## Current Notes

- 이전 구현은 `vehicle.status`, `bidding_ends_at`, `winning_dealer_id`, `trade_workflow.current_stage`를 각 화면과 서비스가 제각각 해석했다.
- 이번 정리는 seller 기준 UI 상태를 `BIDDING / BIDDING_CLOSED / FAILED / INSPECTION / DEPRECIATION / DELIVERY_SETTLEMENT / COMPLETED / TRADE_CANCELLED / STATUS_UNSET`로 명시했다.
- `STATUS_UNSET`은 조합이 맞지 않는 데이터를 숨기지 않고 드러내기 위한 drift 표면이다.

## Validation

- `cd server && .venv/bin/python -m pytest tests/test_bidding_winner_selection.py tests/test_vehicle_lifecycle_state_machine.py`
- `pnpm --dir client/web exec tsc --noEmit`
- `python3 sdd/99_toolchain/01_automation/run_playwright_exactness.py --suite frt-018-winner-select --base-url http://127.0.0.1:5173 --api-base-url http://127.0.0.1:8000/api/v1`
