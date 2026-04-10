#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage: init_frontend_parity.sh [repo_root] [target]

Bootstrap repo-local frontend parity assets for a cloned template.

Steps:
  1. Ensure repo contract aliases exist
  2. Scaffold ui parity contract
  3. Generate route-gap json/markdown manifests

Optional runtime steps such as reference materialization and proof are intentionally excluded.
EOF
}

if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
  usage
  exit 0
fi

repo_root="$(cd "${1:-$(pwd)}" && pwd)"
frontend_target="${2:-}"
script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

bash "${script_dir}/init_repo_contract.sh" "${repo_root}" >/dev/null

bash "${script_dir}/run_frontend_target.sh" scaffold "${repo_root}" "${frontend_target}"
bash "${script_dir}/run_frontend_target.sh" route_gap "${repo_root}" "${frontend_target}"

echo "frontend_parity_init=ok"
