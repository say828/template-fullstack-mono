# FRT_019 검차 진행 현황 정합성

- Owner: Codex
- Status: completed

## Scope

- `FRT_019` seller inspection pending detail surface (`/seller/vehicles/:vehicleId/detail/inspection-pending`)를 screen spec page 20 기준으로 구현한다.
- hero media + inspection pending summary + vehicle identity + shared detail sections 구조를 맞춘다.
- 검차 진행 현황 패널의 데이터와 버튼 활성 규칙을 workflow 기반으로 연결한다.
- `검차 일정 확인` 버튼은 `FRT_020` 성격의 읽기 전용 팝업을 호출하도록 맞춘다.
- `다른 일정 요청`은 별도 route 전환이 아니라 같은 dialog 안에서 `FRT_021` 입력 컴포넌트로 전환되도록 맞춘다.
- `일정 승인하기` 완료 시 `FRT_022` route로 전이되도록 inspection confirmed 분기를 연결한다.
- inspection 상태 차량의 `상세 보기`와 `검차 일정 확인` CTA가 모두 `FRT_019`로 이동하도록 seller 차량 목록 분기를 맞춘다.

## Assumptions

- `FRT_019`는 `FRT_020` 검차 일정 팝업의 상위 상세 화면이다.
- `FRT_021`은 `FRT_019` 위 dialog shell 안에서 콘텐츠만 교체되는 modal step으로 본다.
- `검차 일정 확인` 버튼은 `inspection_scheduled_at` 또는 `inspection_location` 등 admin 등록 데이터가 있는 경우에만 활성으로 본다.
- inspection pending detail shell은 `FRT_014` 계열의 shared section 컴포넌트를 재사용한다.

## Acceptance Criteria

- `FRT_019` route가 더 이상 `/inspection`으로 redirect되지 않고 자체 상세 화면을 렌더링한다.
- 상단은 차량 이미지와 `검차 진행 현황` 요약 패널 2열 구조다.
- 요약 패널에 현재 최고 입찰가, 낙찰 딜러, 검차 일정, 검차 장소가 노출된다.
- 검차 일정 데이터가 없을 경우 일정/장소는 `-`, `검차 일정 확인` 버튼은 비활성이다.
- 검차 일정 데이터가 있을 경우 `검차 일정 확인` 버튼 클릭으로 `검차 일정 정보` 팝업이 열린다.
- 팝업의 `다른 일정 요청` 클릭 시 같은 modal shell 안에서 `FRT_021` 입력 UI로 전환되고 너비는 480px 기준을 유지한다.
- `FRT_021`의 `취소`는 modal을 닫지 않고 `FRT_020` 정보 UI로 복귀한다.
- `FRT_021`의 `요청 보내기` 성공 후에는 완료 안내 modal state가 열리고 `확인` 버튼으로 종료된다.
- `일정 승인하기` 클릭 시 seller approve API가 호출되고 `detail/inspection-completed`(`FRT_022`)로 이동한다.
- 본문에는 차량 기본 정보, 차량 사진 및 옵션, 거래 진행 단계, 최근 활동이 화면 순서대로 노출된다.
- seller 차량 목록에서 inspection 상태 차량의 `상세 보기`와 `검차 일정 확인` CTA는 `FRT_019`로 이동한다.

## Execution Checklist

- [x] `FRT_019` spec, grid, target image와 현재 inspection page의 gap을 정리한다.
- [x] `FRT_019` 전용 상세 페이지를 구현하고 route alias를 실제 화면으로 연결한다.
- [x] inspection 상태의 목록 CTA(`상세 보기`, `검차 일정 확인`) href 분기를 `FRT_019`로 연결한다.
- [x] 요약 패널 CTA를 `FRT_020` 성격의 팝업 호출로 맞추고 `FRT_021`을 modal 내부 step으로 연결한다.
- [x] `FRT_021` 제출 완료 안내와 `확인` 종료 흐름을 같은 dialog 안에 연결한다.
- [x] inspection 승인 후 `FRT_022`로 전이되는 route/status 분기를 연결한다.
- [x] exactness / 타입체크 / verify 문서를 갱신한다.

## Current Notes

- 현재 `/seller/vehicles/:vehicleId/inspection` page는 스펙상 `FRT_020` 성격의 일정 확인/재요청 UI에 더 가깝고, `FRT_019` 상세 shell은 아직 없다.
- `FRT_019`는 새 `SellerInspectionPendingDetailPage`로 분리했고, `detail/inspection-pending` alias를 실제 화면으로 연결했다.
- inspection 상태 차량의 seller list `상세 보기`와 `검차 일정 확인` CTA는 이제 `FRT_019`로 이동한다.
- 요약 패널의 `검차 일정 확인`은 더 이상 직접 route 이동하지 않고, 화면 위에서 `검차 일정 정보` 팝업을 연다.
- `다른 일정 요청`은 `FRT_021` route로 나가지 않고 동일한 dialog 안에서 내용만 교체한다.
- `요청 보내기` 성공 후에도 즉시 page alert로 끝나지 않고, 완료 안내 modal step을 거쳐 `확인`으로 닫는다.
- seller가 일정을 승인하면 `detail/inspection-completed` route로 이동해 `FRT_022`를 보여준다.

## Validation

- `pnpm --dir client/web exec tsc --noEmit`
- `python3 sdd/99_toolchain/01_automation/run_playwright_exactness.py --suite frt-019-inspection-pending --base-url http://127.0.0.1:5173 --api-base-url http://127.0.0.1:8000/api/v1`
- `docker compose restart server && sleep 3`
- `./scripts/e2e/seller_inspection_flow.sh`
