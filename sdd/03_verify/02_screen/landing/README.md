# Landing Screen Verification

- current status: `pass`
- retained references: `sdd/02_plan/03_architecture/spec_traceability.md`
- direct verification:
  - `pnpm --dir client/web build`
  - `python3 sdd/99_toolchain/01_automation/validate_template_screen_ir.py --service seller`
  - `python3 sdd/99_toolchain/01_automation/run_playwright_exactness.py --suite frt-005-signup-type --base-url http://127.0.0.1:3003`
  - `python3 sdd/99_toolchain/01_automation/run_browser_use_diagnostic.py --suite frt-005-signup-type --base-url http://127.0.0.1:3003`
- route checks: `/login?role=seller`, `/login?role=dealer`, `/forgot-password?role=seller`, `/forgot-password?role=dealer`, `/signup`
- layout check: `/`에서 role section이 hero 하단 위로 올라오고, seller/dealer card가 반투명 panel로 겹쳐 보이는지 확인 필요
- exactness result: `FRT_005` Playwright suite pass, Browser Use diagnostic pass, artifacts at `sdd/99_toolchain/02_exactness/results/frt-005-signup-type-*`
- regression scope: `/`, `/login`, `/forgot-password`, `/signup`, public header shell, seller/dealer auth role selector
- residual risk: landing은 markdown spec 기반이라 시각 diff baseline보다 route/content drift 점검이 중요하고, 상세 pixel exactness는 screen IR surface를 기준으로 후속 보정한다. Browser Use는 구조 진단 evidence로만 사용한다.
