# {service} screen TODO

- Owner: Codex
- Status: active

## Service Summary

- service:
- canonical source:
- update rule: 이 파일 안에서 화면코드 기준으로 계속 갱신한다.

## Shared Constraints

- source key rule:
- route baseline:
- shared API/modeling note:

## Screen Items

### {screen code} {screen name}

#### Screen Summary

- source key:
- route:
- retained runtime tree:
- checklist / inspection source:
- functional e2e case ids:
- local exactness suite id:
- canonical runner command: `python3 sdd/99_toolchain/01_automation/run_playwright_exactness.py --suite <suite-id> --base-url <url>`

#### Acceptance Criteria

- [ ]
- [ ] relevant builder/design guide baseline is current for this surface
- [ ] Playwright exactness suite exists or is extended in the same task
- [ ] approved screen-linked feature requirement is mapped to retained functional E2E cases
- [ ] persistence/migration impact, if any, is included in the gate
- [ ] verify artifact path (`json/png`) is identified before implementation closes

#### Open TODO

- [ ]

#### Current Notes

- current scope/status notes only
- use Browser Use/manual capture only as supplemental diagnosis when a Playwright suite already exists

#### Latest Verification

- current build/verify references:
- latest exactness command:
- latest exactness artifact:
- latest functional e2e gate:

## Delivery Phases

- `P0`:
- `P1`:
- `P2`:

## Current Notes

- current service-level notes only
