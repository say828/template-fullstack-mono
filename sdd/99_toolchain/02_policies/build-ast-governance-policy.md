# Build AST Governance Policy

## Purpose

runtime assembly current-state는 `sdd/03_verify/03_architecture`에 두고, planning-side rules는 `sdd/02_plan/03_architecture`에서 관리한다.

## Rules

- service runtime-assembly summary는 실제 entrypoint부터 읽혀야 한다.
- 기본 설명 순서는 `entry -> provider/router -> auth/session gate -> shell -> route leaf -> backend contract leaf`다.
- shared shell, auth/session, data contract, transport split은 route leaf 이후 cross-cutting link로 연결한다.
- retained assembly evidence에는 dated memo, Ralph iteration narrative, run id, turn-specific 회고를 남기지 않는다.
- 구조 current-state 적합성은 `scripts/dev/audit_sdd_build_ast.py`로 검증하고 결과는 `sdd/03_verify/03_architecture`에 유지한다.
- downstream 저장소는 이 정책과 audit script를 함께 복제해야 한다.

## Canonical References

- `AGENTS.md`
- `scripts/dev/audit_sdd_build_ast.py`
- `sdd/01_planning/03_architecture/README.md`
- `sdd/02_plan/03_architecture/README.md`
- `sdd/03_verify/03_architecture/README.md`
- `sdd/03_verify/03_architecture/toolchain_governance.md`
