# FRT_022 검차 일정 확정 정합성

- Owner: Codex
- Status: completed

## Scope

- `FRT_022` seller inspection confirmed detail surface (`/seller/vehicles/:vehicleId/detail/inspection-completed`)를 screen spec page 23 기준으로 구현한다.
- inspection confirmed 상태에서 seller 차량 목록과 상세 CTA가 `FRT_022`를 가리키도록 분기한다.
- `검차 일정 확인` 버튼은 확정 일정 확인 팝업 `FRT_023`을 같은 detail 화면 위에서 연다.
- 기존 `/inspection` alias route는 canonical detail route로 정리한다.

## Assumptions

- `inspection_status === CONFIRMED`는 여전히 `current_stage === INSPECTION`인 seller workflow다.
- `FRT_022`는 `FRT_019`와 동일한 상세 shell을 공유하되 summary copy, CTA, modal step만 확정 상태에 맞게 바꾼다.
- `FRT_023`은 읽기 전용 확인 팝업이며 상태 변경 동작은 없다.

## Acceptance Criteria

- inspection confirmed 차량의 seller 목록 `상세 보기`, `검차 일정 확인` CTA가 `detail/inspection-completed`로 이동한다.
- `FRT_022` 요약 패널은 현재 최고 입찰가, 선택된 딜러, 확정된 검차 일정, 검차 장소를 노출한다.
- `검차 일정 확인` 버튼 클릭 시 `FRT_023` 읽기 전용 팝업이 열리고, `확인` 버튼으로 팝업이 닫힌다.
- pending route로 confirmed 차량에 진입하면 `FRT_022`로 canonical redirect된다.
- legacy `/seller/vehicles/:vehicleId/inspection` route는 direct modal page가 아니라 canonical detail route alias로만 동작한다.

## Execution Checklist

- [x] inspection confirmed 상세 route와 page 구현을 추가한다.
- [x] modal content에 `FRT_023` 읽기 전용 확인 레이어를 추가한다.
- [x] seller 차량 목록 inspection branching을 `inspection_status` 기반 pending/completed로 세분화한다.
- [x] legacy inspection route를 canonical detail alias로 축소한다.
- [x] 타입체크 / verify 문서를 갱신한다.

## Validation

- `pnpm --dir client/web exec tsc --noEmit`
- `pnpm --dir client/web build`
- `docker compose restart server && sleep 3`
- `./scripts/e2e/seller_inspection_flow.sh`
