#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage: init_repo_contract.sh [repo_root]

Create the canonical toolchain contract if it does not exist.
Also create runtime-friendly aliases:
  - .codex/agentic-dev.json
  - .claude/agentic-dev.json
Print the resulting canonical contract path.
EOF
}

if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
  usage
  exit 0
fi

repo_root="$(cd "${1:-$(pwd)}" && pwd)"
script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
template_path="${script_dir}/assets/repo-contract.template.json"
contract_path="${repo_root}/sdd/99_toolchain/01_automation/agentic-dev/repo-contract.json"
codex_dir="${repo_root}/.codex"
claude_dir="${repo_root}/.claude"
codex_alias_path="${codex_dir}/agentic-dev.json"
claude_alias_path="${claude_dir}/agentic-dev.json"

if [[ ! -f "${template_path}" ]]; then
  echo "Template not found: ${template_path}" >&2
  exit 1
fi

mkdir -p "$(dirname "${contract_path}")" "${codex_dir}" "${claude_dir}"
if [[ ! -f "${contract_path}" ]]; then
  cp "${template_path}" "${contract_path}"
fi

python3 - "${codex_alias_path}" "${claude_alias_path}" <<'PY'
import json
import sys
from pathlib import Path

payload = {"contract_path": "../sdd/99_toolchain/01_automation/agentic-dev/repo-contract.json"}
for raw_path in sys.argv[1:]:
    path = Path(raw_path)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
PY

printf '%s\n' "${contract_path}"
