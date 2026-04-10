# Vehicle Lifecycle State Machine Verification

- Date: 2026-04-09
- Owner: Codex
- Scope: seller 차량 상태 전이, 낙찰 확정 후 거래 시작, seller 화면 상태 해석 일원화

## Test Scenarios

- `E2E-LIFECYCLE-001`
  - 목적: 판매자가 특정 입찰을 선택해 마감하면 선택한 딜러가 낙찰되고 거래 워크플로우가 즉시 시작되는지 확인한다.
  - 기대 결과: 차량은 `SOLD`, 선택 입찰은 `WON`, 거래 워크플로우는 `INSPECTION` 상태가 된다.

- `E2E-LIFECYCLE-002`
  - 목적: 선택한 입찰가가 희망가보다 낮아도 판매자의 명시 선택이 유찰로 뒤집히지 않는지 확인한다.
  - 기대 결과: 차량은 유찰이 아니라 낙찰 처리되고 `INSPECTION` 단계가 생성된다.

- `E2E-LIFECYCLE-003`
  - 목적: trade stage가 정의된 순서대로만 전이되는지 확인한다.
  - 기대 결과: 정상 전이는 통과하고, 불연속 점프는 예외로 차단된다.

- `E2E-LIFECYCLE-004`
  - 목적: runtime seller `FRT_018` 화면이 닫힌 입찰 차량에서 여전히 선택 가능 상태로 렌더링되는지 확인한다.
  - 기대 결과: 딜러 선택 버튼이 활성이고, 선택 후 `선택 완료하기`가 활성된다.

## Executed Commands

```bash
cd server && .venv/bin/python -m pytest tests/test_bidding_winner_selection.py tests/test_vehicle_lifecycle_state_machine.py
pnpm --dir client/web exec tsc --noEmit
python3 sdd/99_toolchain/01_automation/run_playwright_exactness.py --suite frt-018-winner-select --base-url http://127.0.0.1:5173 --api-base-url http://127.0.0.1:8000/api/v1
python3 - <<'PY'
import requests
base='http://127.0.0.1:8000/api/v1'
r=requests.post(base+'/auth/login', json={'email':'sl@template.com','password':'test1234','role':'SELLER'})
r.raise_for_status()
token=r.json()['access_token']
rows=requests.get(base+'/vehicles/my', headers={'Authorization':f'Bearer {token}'}).json()
for row in rows[:6]:
    print(row['license_plate'], row['status'], row.get('lifecycle_state'))
PY
```

## Results

- `E2E-LIFECYCLE-001`: pass
- `E2E-LIFECYCLE-002`: pass
- `E2E-LIFECYCLE-003`: pass
- `E2E-LIFECYCLE-004`: pass

## Runtime Sample

- `11가 1301` `ACTIVE / BIDDING`
- `11가 1302` `ACTIVE / BIDDING_CLOSED`
- `11가 1303` `SOLD / INSPECTION`
- `11가 1304` `SOLD / DEPRECIATION`
- `11가 1307` `SOLD / DELIVERY_SETTLEMENT`
- `11가 1308` `SOLD / COMPLETED`

## Notes

- backend는 `shared.domain.vehicle_lifecycle`를 통해 라이프사이클과 trade stage 전이를 공식화했다.
- seller list/detail/winner 화면은 `client/web/src/lib/sellerVehicleLifecycle.ts` 기준으로 상태를 해석한다.
- 상태 조합이 맞지 않으면 UI는 임의 상태 대신 `상태 없음`을 노출하도록 유지했다.
