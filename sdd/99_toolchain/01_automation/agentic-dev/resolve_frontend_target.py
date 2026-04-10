#!/usr/bin/env python3
import json
import sys
from pathlib import Path

from resolve_repo_contract import resolve_repo_contract_path


def main() -> int:
    if len(sys.argv) < 2:
        print("Usage: resolve_frontend_target.py <repo_root> [target]", file=sys.stderr)
        return 1

    repo_root = Path(sys.argv[1]).resolve()
    target_name = sys.argv[2].strip() if len(sys.argv) > 2 and sys.argv[2].strip() else None
    contract_path = resolve_repo_contract_path(repo_root)
    if contract_path is None:
        print("Frontend contract not found via .codex/.claude/toolchain contract search order.", file=sys.stderr)
        return 1

    contract = json.loads(contract_path.read_text(encoding="utf-8"))
    frontend = contract.get("frontend")
    if not isinstance(frontend, dict):
        print(f"Missing frontend block in {contract_path}", file=sys.stderr)
        return 1

    default_target = frontend.get("default_target")
    targets = frontend.get("targets")
    if not isinstance(default_target, str) or not default_target.strip():
        print(f"Missing frontend.default_target in {contract_path}", file=sys.stderr)
        return 1
    if not isinstance(targets, dict):
        print(f"Missing frontend.targets in {contract_path}", file=sys.stderr)
        return 1

    selected = target_name or default_target
    target = targets.get(selected)
    if not isinstance(target, dict):
        print(f"Unknown frontend target: {selected}", file=sys.stderr)
        return 1

    payload = {
        "name": selected,
        "default_target": default_target,
        "target": target,
    }
    print(json.dumps(payload, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
