# Exactness Package

## Scope

- `02_exactness`는 Playwright exactness, Browser Use 보조 진단, retained screenshot/json artifact를 담는 정식 toolchain package다.
- `01_automation`은 canonical entrypoint와 registry를 소유하고, `02_exactness`는 실제 source/evidence package를 소유한다.

## Structure

- `playwright/`: Playwright suite source slot, package manifest, config, and golden snapshots.
- `browser_use/`: Browser Use 기반 보조 진단 runner.
- `results/`: retained screenshot/json artifact.

## Rule

- exactness source는 `research/`, `pocs/`, ad-hoc runtime folder에 두지 않는다.
- canonical invocation은 `python3 sdd/99_toolchain/01_automation/run_playwright_exactness.py ...`를 사용한다.
- Browser Use는 primary exactness gate가 아니라 진단/보조 evidence다.
- local cache, runtime temp, install artifact는 versioned source에 포함하지 않는다.
