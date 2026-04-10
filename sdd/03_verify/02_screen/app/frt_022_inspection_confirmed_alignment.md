# FRT_022 검차 일정 확정 검증

- Date: 2026-04-10
- Owner: Codex
- Screen: `FRT_022`
- Route: `/seller/vehicles/:vehicleId/detail/inspection-completed`

## Scope

- inspection confirmed 상태 seller 상세 화면이 `sdd/01_planning/02_screen/ir/seller/FRT_022/ui_spec.md`, `FRT_023/ui_spec.md`와 핵심 상호작용을 맞추는지 확인한다.
- inspection confirmed 차량이 seller 목록에서 `detail/inspection-completed` route로 연결되는지 확인한다.
- `검차 일정 확인` CTA가 읽기 전용 `FRT_023` 팝업을 띄우고 닫기 동작만 수행하는지 확인한다.

## Executed Commands

```bash
pnpm --dir client/web exec tsc --noEmit
pnpm --dir client/web build
docker compose restart server && sleep 3
./scripts/e2e/seller_inspection_flow.sh
```

## Results

- 타입체크: pass
- 프런트 빌드: pass
- seller inspection workflow E2E: pass

## Verified Points

- inspection confirmed 상태에서 canonical route가 `detail/inspection-completed`로 분기됨
- `FRT_022` 요약 패널에 확정된 검차 일정과 검차 장소가 노출됨
- `검차 일정 확인` 클릭 시 `FRT_023` 읽기 전용 팝업이 열리고 `확인` 버튼으로 닫힘
- `/seller/vehicles/:vehicleId/inspection` legacy route는 직접 modal 화면을 렌더링하지 않고 canonical detail route alias로 동작함

## E2E Evidence

- `E2E_APPROVE_STATUS 200`
- `E2E_APPROVAL_FINAL_URL http://127.0.0.1:5173/seller/vehicles/31160e11-d3fa-4c09-8122-f6dba71cb842/detail/inspection-completed`
- `E2E_APPROVAL_ALERTS ["처리 완료검차 일정이 확정되었습니다."]`
- `E2E_CONFIRMED_MODAL_COPY_COUNT 1`
- `E2E_CONFIRMED_MODAL_BUTTON_COUNT 1`
