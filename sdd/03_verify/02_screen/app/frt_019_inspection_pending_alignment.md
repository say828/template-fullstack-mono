# FRT_019 검차 진행 현황 검증

- Date: 2026-04-09
- Owner: Codex
- Screen: `FRT_019`
- Route: `/seller/vehicles/:vehicleId/detail/inspection-pending`

## Scope

- inspection 상태 차량의 seller 상세 화면이 `sdd/01_planning/02_screen/ir/seller/FRT_019/ui_spec.md`, `ui_grid.csv`, `ui_img.png`와 주요 구조를 맞추는지 확인한다.
- inspection 상태 차량의 `상세 보기`, `검차 일정 확인` 목록 CTA가 `FRT_019`로 이동하는지 확인한다.
- summary panel의 검차 CTA가 workflow 데이터 기반으로 활성/비활성되고 팝업을 호출하는지 확인한다.
- 팝업 안의 `다른 일정 요청`이 route 이동 없이 동일 dialog 내부 step 전환으로 처리되는지 확인한다.
- `일정 승인하기`가 `FRT_022` route로 전이되는지 확인한다.

## Executed Commands

```bash
pnpm --dir client/web exec tsc --noEmit
python3 sdd/99_toolchain/01_automation/run_playwright_exactness.py --suite frt-019-inspection-pending --base-url http://127.0.0.1:5173 --api-base-url http://127.0.0.1:8000/api/v1
docker compose restart server && sleep 3
./scripts/e2e/seller_inspection_flow.sh
```

## Results

- 타입체크: pass
- `frt-019-inspection-pending` exactness: pass
- seller inspection workflow E2E: pass

## Verified Points

- 상단이 `hero media + 검차 진행 현황` 2열 구조로 렌더링됨
- hero 좌상단 배지가 `검차 + 보조 태그` 구조로 노출됨
- summary panel에 `현재 최고 입찰가 / 선택된 딜러 / 검차 일정 / 검차 장소` 노출됨
- `검차 일정 확인` 버튼 클릭 시 `검차 일정 정보` 팝업이 열림
- 차량 기본 정보, 차량 사진 및 옵션, 거래 진행 단계, 최근 활동이 후속 섹션으로 노출됨
- 차량 사진 및 옵션 영역이 썸네일 행 + `+더 보기` 타일 구조로 노출됨
- 최근 활동이 검차 단계 기준 3행 이내로 보강되어 표기됨
- seller 차량 목록의 inspection 상태 `상세 보기`, `검차 일정 확인` CTA가 모두 `detail/inspection-pending`으로 연결됨
- `다른 일정 요청` 클릭 시 동일 dialog shell 안에서 `FRT_021` 입력 컴포넌트로 전환되며 modal width는 480px로 유지됨
- `FRT_021`의 `취소`가 동일 modal 안에서 `FRT_020` 정보 단계로 되돌아감
- `FRT_021`의 `요청 보내기` 성공 후 완료 안내 modal state가 열리고 `확인` 버튼으로 종료됨
- `일정 승인하기`가 seller approve API 이후 `detail/inspection-completed`로 이동하도록 연결됨

## E2E Evidence

- precondition reset: `docker compose restart server && sleep 3` 후 pending demo vehicle `inspection_status=PROPOSED`
- `E2E_RESCHEDULE_STATUS 200`
- `E2E_RESCHEDULE_SUCCESS_COPY_COUNT 1`
- `E2E_RESCHEDULE_CONFIRM_BUTTON_COUNT 1`
- `E2E_RESCHEDULE_ALERTS ["처리 완료다른 검차 일정을 요청했습니다."]`
- `E2E_APPROVE_STATUS 200`
- `E2E_APPROVAL_FINAL_URL http://127.0.0.1:5173/seller/vehicles/31160e11-d3fa-4c09-8122-f6dba71cb842/detail/inspection-completed`
- `E2E_APPROVAL_ALERTS ["처리 완료검차 일정이 확정되었습니다."]`
- `E2E_CONFIRMED_MODAL_COPY_COUNT 1`
- `E2E_CONFIRMED_MODAL_BUTTON_COUNT 1`
