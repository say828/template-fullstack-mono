# agentic toolchain port

- Owner: Codex
- Status: active

## Scope

- `../agentic-dev`와 `../passv`에서 만든 agentic coding architecture를 `template`의 `sdd/99_toolchain`과 architecture docs로 이식한다.
- UI fidelity, screen exactness, parity harness, design guide builder, asset builder, exactness runner, policy, template, and retained verification scaffolding를 현재 repo에 맞게 합친다.
- current repo에 이미 존재하는 generic builder는 유지하고, 상위 repo에서 더 완전한 source-only architecture를 보강한다.

## Assumptions

- 이 작업은 runtime app behavior 변경이 아니라 toolchain/architecture import가 주 대상이다.
- source-of-truth는 코드와 markdown 같은 source file이며, 대량의 verification result corpus는 source architecture가 아니므로 제외한다.
- current repo의 existing `spec_asset_builder.py`, `screen_design_guide_builder.py`, `run_sdd_preflight.py` 계열은 덮어쓰지 않고 source merge 기준으로 정렬한다.

## Acceptance Criteria

- `sdd/99_toolchain/02_policies`, `03_templates`, `02_exactness`, and expanded `01_automation` source packages가 current repo에 존재한다.
- Playwright exactness, ui-parity, and mobile screen toolchain source files are present without caches or generated result corpora.
- `sdd/01_planning/03_architecture`, `sdd/02_plan/03_architecture`, and `sdd/03_verify/03_architecture` toolchain docs describe the imported architecture accurately.
- canonical automation and validation docs point at the imported toolchain paths rather than stale placeholder-only paths.

## Execution Checklist

- [x] Inspect current architecture and source repo toolchains.
- [ ] Merge source-only automation, policy, template, and exactness files from `agentic-dev` and `passv`.
- [ ] Update architecture planning and verification docs to reflect the imported architecture.
- [ ] Verify syntax and file-tree integrity for imported source files.
- [ ] Record retained verification summaries.

## Current Notes

- `template` already has a partial generic screen-spec toolchain; the import work is additive and should preserve existing local customizations where possible.
- The imported architecture will include source code and durable docs, not bulky `results/`, `node_modules/`, or `__pycache__/` trees.

## Validation

- `find sdd/99_toolchain -maxdepth 3 -type f | sort`
- `python3 -m py_compile sdd/99_toolchain/01_automation/*.py sdd/99_toolchain/01_automation/agentic-dev/*.py`
- `python3 -m py_compile sdd/99_toolchain/01_automation/build_mobile_screen_ir.py sdd/99_toolchain/01_automation/validate_mobile_screen_ir.py`
- `node --check sdd/99_toolchain/01_automation/capture_screen_assets.mjs`
- `node --check sdd/99_toolchain/01_automation/ui-parity/cli/run-proof.mjs`
