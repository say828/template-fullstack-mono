#!/usr/bin/env python3
import json
import sys
from pathlib import Path


SEARCH_ORDER = (
    ".codex/agentic-dev.json",
    ".claude/agentic-dev.json",
    "sdd/99_toolchain/01_automation/agentic-dev/repo-contract.json",
)


def candidate_paths(start: Path):
    current = start.resolve()
    if current.is_file():
        current = current.parent
    for base in (current, *current.parents):
        for rel in SEARCH_ORDER:
            yield base / rel


def resolve_pointer(path: Path) -> Path:
    data = json.loads(path.read_text(encoding="utf-8"))
    target = data.get("contract_path")
    if isinstance(target, str) and target.strip():
        resolved = (path.parent / target).resolve()
        if not resolved.is_file():
            raise FileNotFoundError(f"contract_path target not found: {resolved}")
        return resolved
    return path.resolve()


def resolve_repo_contract_path(start: Path) -> Path | None:
    for path in candidate_paths(start):
        if path.is_file():
            return resolve_pointer(path)
    return None


def main() -> int:
    start = Path(sys.argv[1]) if len(sys.argv) > 1 else Path.cwd()
    resolved = resolve_repo_contract_path(start)
    if resolved is not None:
        print(resolved)
        return 0
    print(
        "No repo contract found. Checked .codex/agentic-dev.json, "
        ".claude/agentic-dev.json, sdd/99_toolchain/01_automation/agentic-dev/repo-contract.json in current and parent directories.",
        file=sys.stderr,
    )
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
