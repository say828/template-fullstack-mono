# verification harness

## Status

- pass

## Retained Checks

- verify harness는 stable current artifact path를 사용한다.
- UI parity reference asset과 proof output은 current durable location을 사용한다.
- screen local exactness는 `python3 sdd/99_toolchain/01_automation/run_playwright_exactness.py --suite <suite-id> --base-url <url>`를 canonical harness entrypoint로 사용한다.
- regression verification scope는 별도 durable baseline에서 선택하고, harness는 selected surface 중 automation 가능한 slice를 담당한다.
- functional E2E gate는 checklist source, requirement-to-test-case traceability, full-layer runtime evidence를 함께 남긴다.
- migration/schema 영향 기능은 migration apply와 schema parity evidence가 없으면 harness complete로 보지 않는다.
- browser-agent observation summary는 `sdd/99_toolchain/03_templates/browser_agent_verification_template.md`를 canonical template로 사용하고, retained proof를 대체하지 않는다.

## Residual Risk

- harness CLI default path가 legacy verify folder를 다시 가리키면 drift가 생긴다.
- regression surface selector 자동화가 없어 shared-impact 판정은 문서와 reviewer 판단에 의존한다.
