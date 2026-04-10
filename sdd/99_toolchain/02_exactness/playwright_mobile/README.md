# Mobile Playwright Exactness

## Role

- This package holds the retained mobile visual baseline and the small live-flow smoke suite for `client/mobile`.

## Structure

- `mobile-visual.spec.js`: route-level visual baseline with seeded mock API data and retained screenshot outputs.
- `mobile-dev-full.e2e.spec.js`: login + protected-route smoke with the same retained fixture set.
- `golden/`: baseline screenshots, seeded on first run if absent.

## Run

- canonical entrypoint:
  - `python3 sdd/99_toolchain/01_automation/run_playwright_exactness.py --suite mobile-workspace-visual --base-url http://127.0.0.1:4302`
  - `python3 sdd/99_toolchain/01_automation/run_playwright_exactness.py --suite mobile-workspace-e2e --base-url http://127.0.0.1:4302`
