# screen artifact factory governance

- decision check: active SDD 문서가 화면 명세서 기반 artifact factory와 Playwright exactness package를 canonical/retained split으로 선언한다.
- legacy check: `ui_parity`와 `agentic-dev`는 active 문서에서 retained legacy/debug로만 남는다.
- preflight check: `python3 sdd/99_toolchain/01_automation/run_sdd_preflight.py --list` 결과가 validation header guard와 current runnable automation을 보여준다.
- file-tree check: `sdd/99_toolchain/02_exactness/`, `02_policies/`, `03_templates/`, and mobile screen IR/design guide source packages are present in the canonical root.
- residual risk: exactness suite coverage is imported and available, but repo-specific retained suite selection still needs to be pruned to template's active screen matrix.
