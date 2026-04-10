# UI Parity Tooling

이 디렉터리는 repo-local UI parity 실행 도구의 공통 정본이다.

## Layout

- `core/`: 결과 생성과 공통 유틸
- `cli/`: scaffold, proof, route-gap 진입점
- `contracts/`: output/metadata schema
- `interfaces/`: 실행 계약과 산출물 규약
- `runtime/`: 브라우저 런타임 adapter

## Usage

```bash
node sdd/99_toolchain/01_automation/ui-parity/cli/scaffold-contract.mjs \
  --adapter app/example/scripts/ui-parity-adapter.mjs \
  --out sdd/02_plan/10_test/templates/ui_parity_contract.yaml

node sdd/99_toolchain/01_automation/ui-parity/cli/run-proof.mjs \
  --adapter app/example/scripts/ui-parity-adapter.mjs \
  --contract sdd/02_plan/10_test/templates/ui_parity_contract.yaml \
  --out sdd/03_verify/10_test/ui_parity/example_latest.json
```

## Related Contracts

- [UI Parity Proof Interface](interfaces/ui-parity-proof-interface.md)
- [UI Parity Route Gap Interface](interfaces/ui-parity-route-gap-interface.md)
