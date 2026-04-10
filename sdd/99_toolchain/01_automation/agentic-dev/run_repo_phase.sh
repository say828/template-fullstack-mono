#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage: run_repo_phase.sh <phase> [repo_root] [target]

Run a repo-local command from the nearest repo contract.

Supported phases:
  plan_audit
  build
  proof
  deploy_dev
  verify_dev
  full_dev
EOF
}

if [[ $# -lt 1 ]]; then
  usage >&2
  exit 1
fi

phase="$1"
repo_root="${2:-$(pwd)}"
repo_root="$(cd "${repo_root}" && pwd)"
frontend_target="${3:-}"
script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
resolver_path="${script_dir}/resolve_repo_contract.py"
frontend_resolver_path="${script_dir}/resolve_frontend_target.py"
proof_schema_path="${script_dir}/../ui-parity/contracts/proof-result.schema.json"
route_gap_schema_path="${script_dir}/../ui-parity/contracts/route-gap-report.schema.json"
schema_validator_path="${script_dir}/validate_json_schema.py"

resolve_contract() {
  "${resolver_path}" "${repo_root}"
}

load_contract_value() {
  local contract_path="$1"
  local key="$2"
  python3 - "${contract_path}" "${key}" <<'PY'
import json
import sys

contract_path, key = sys.argv[1], sys.argv[2]
with open(contract_path, "r", encoding="utf-8") as handle:
    data = json.load(handle)

keys = key.split(".")
value = data
for part in keys:
    if not isinstance(value, dict):
        raise SystemExit(1)
    value = value.get(part)

if not isinstance(value, str) or not value.strip():
    raise SystemExit(1)

print(value.strip())
PY
}

run_single_phase() {
  local contract_path="$1"
  local repo_root_path="$2"
  local single_phase="$3"
  local command
  command="$(load_contract_value "${contract_path}" "commands.${single_phase}")" || {
    echo "Phase command not found in ${contract_path}: ${single_phase}" >&2
    exit 1
  }

  printf 'Running phase `%s` from %s\n' "${single_phase}" "${contract_path}"
  (
    cd "${repo_root_path}"
    if [[ -n "${frontend_target}" ]]; then
      export FRONTEND_TARGET="${frontend_target}"
    fi
    eval "${command}"
  )

  if [[ "${single_phase}" == "plan_audit" ]]; then
    local route_gap_output
    route_gap_output="$(python3 "${frontend_resolver_path}" "${repo_root_path}" "${frontend_target}" | python3 -c 'import json,sys; print(json.load(sys.stdin)["target"]["route_gap_output"])')" || \
    route_gap_output="$(load_contract_value "${contract_path}" "artifacts.route_gap_output")" || {
      echo "Route gap artifact path not found in ${contract_path}" >&2
      exit 1
    }
    if [[ ! -f "${repo_root_path}/${route_gap_output}" ]]; then
      echo "Expected route gap artifact missing: ${repo_root_path}/${route_gap_output}" >&2
      exit 1
    fi
    python3 "${schema_validator_path}" "${route_gap_schema_path}" "${repo_root_path}/${route_gap_output}"
    python3 "${script_dir}/analyze_route_gap.py" --gate "${repo_root_path}/${route_gap_output}"
  fi

  if [[ "${single_phase}" == "proof" || "${single_phase}" == "verify_dev" ]]; then
    local proof_output
    proof_output="$(python3 "${frontend_resolver_path}" "${repo_root_path}" "${frontend_target}" | python3 -c 'import json,sys; print(json.load(sys.stdin)["target"]["proof_output"])')" || \
    proof_output="$(load_contract_value "${contract_path}" "artifacts.proof_output")" || {
      echo "Proof artifact path not found in ${contract_path}" >&2
      exit 1
    }
    if [[ ! -f "${repo_root_path}/${proof_output}" ]]; then
      echo "Expected proof artifact missing: ${repo_root_path}/${proof_output}" >&2
      exit 1
    fi
    python3 "${schema_validator_path}" "${proof_schema_path}" "${repo_root_path}/${proof_output}"
    if [[ "${single_phase}" == "proof" ]]; then
      python3 "${script_dir}/analyze_proof_results.py" --gate "${repo_root_path}/${proof_output}"
    fi
  fi
}

if [[ ! -f "${resolver_path}" ]]; then
  echo "Missing contract resolver: ${resolver_path}" >&2
  exit 1
fi

contract_path="$(resolve_contract)" || exit 1

case "${phase}" in
  plan_audit|build|proof|deploy_dev|verify_dev)
    run_single_phase "${contract_path}" "${repo_root}" "${phase}"
    ;;
  full_dev)
    run_single_phase "${contract_path}" "${repo_root}" plan_audit
    run_single_phase "${contract_path}" "${repo_root}" build
    run_single_phase "${contract_path}" "${repo_root}" proof
    run_single_phase "${contract_path}" "${repo_root}" deploy_dev
    run_single_phase "${contract_path}" "${repo_root}" verify_dev
    ;;
  *)
    echo "Unsupported phase: ${phase}" >&2
    usage >&2
    exit 1
    ;;
esac
