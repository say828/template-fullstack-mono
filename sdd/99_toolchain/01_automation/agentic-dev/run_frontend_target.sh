#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage: run_frontend_target.sh <action> [repo_root] [target]

Actions:
  build
  preview
  scaffold
  route_gap
  materialize_references
  proof
EOF
}

if [[ $# -lt 1 ]]; then
  usage >&2
  exit 1
fi

action="$1"
repo_root="$(cd "${2:-$(pwd)}" && pwd)"
target_name="${3:-${FRONTEND_TARGET:-}}"
script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
resolver_path="${script_dir}/resolve_frontend_target.py"
payload="$(python3 "${resolver_path}" "${repo_root}" "${target_name}")"

read_target_value() {
  local key="$1"
  python3 - "${payload}" "${key}" <<'PY'
import json
import sys

payload = json.loads(sys.argv[1])
key = sys.argv[2]
value = payload
for part in key.split("."):
    if not isinstance(value, dict):
        raise SystemExit(1)
    value = value.get(part)
if isinstance(value, (dict, list)):
    print(json.dumps(value, ensure_ascii=False))
elif value is None:
    raise SystemExit(1)
else:
    print(str(value))
PY
}

target_id="$(read_target_value "name")"
target_dir="$(read_target_value "target.dir")"
adapter_path="$(read_target_value "target.adapter_path")"
screens_path="$(read_target_value "target.screens_path")"
routes_path="$(read_target_value "target.routes_path")"
parity_contract_path="$(read_target_value "target.parity_contract_path")"
route_gap_output="$(read_target_value "target.route_gap_output")"
route_gap_markdown_output="$(read_target_value "target.route_gap_markdown_output")"
proof_output="$(read_target_value "target.proof_output")"

cd "${repo_root}"

case "${action}" in
  build)
    npm --prefix "${target_dir}" run build
    ;;
  preview)
    npm --prefix "${target_dir}" run preview
    ;;
  scaffold)
    node sdd/99_toolchain/01_automation/ui-parity/cli/scaffold-contract.mjs \
      --adapter "${adapter_path}" \
      --out "${parity_contract_path}"
    ;;
  route_gap)
    node sdd/99_toolchain/01_automation/ui-parity/cli/route-gap-report.mjs \
      --service "${target_id}" \
      --screens "${screens_path}" \
      --routes "${routes_path}" \
      --out "${route_gap_output}" \
      --markdown-out "${route_gap_markdown_output}"
    ;;
  materialize_references)
    node sdd/99_toolchain/01_automation/ui-parity/cli/materialize-reference-assets.mjs \
      --adapter "${adapter_path}" \
      --contract "${parity_contract_path}"
    ;;
  proof)
    node sdd/99_toolchain/01_automation/ui-parity/cli/run-proof.mjs \
      --adapter "${adapter_path}" \
      --contract "${parity_contract_path}" \
      --out "${proof_output}"
    ;;
  *)
    echo "Unsupported frontend action: ${action}" >&2
    usage >&2
    exit 1
    ;;
esac
