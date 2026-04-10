#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage: bootstrap_frontend_parity.sh [repo_root] [target]

Run first-time frontend parity bootstrap for a cloned template.

Steps:
  1. init repo contract and route-gap assets
  2. build frontend
  3. start preview server
  4. materialize reference assets
  5. run plan_audit gate
  6. run proof gate
EOF
}

if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
  usage
  exit 0
fi

repo_root="$(cd "${1:-$(pwd)}" && pwd)"
frontend_target="${2:-}"
script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
target_payload="$(python3 "${script_dir}/resolve_frontend_target.py" "${repo_root}" "${frontend_target}")"
read_target_value() {
  local key="$1"
  python3 - "${target_payload}" "${key}" <<'PY'
import json
import sys

payload = json.loads(sys.argv[1])
key = sys.argv[2]
value = payload
for part in key.split("."):
    if not isinstance(value, dict):
        raise SystemExit(1)
    value = value.get(part)
if value is None:
    raise SystemExit(1)
print(value if isinstance(value, str) else json.dumps(value, ensure_ascii=False))
PY
}
target_name="$(read_target_value "name")"
target_dir="$(read_target_value "target.dir")"
preview_url="$(read_target_value "target.preview_url")"
preview_log="${repo_root}/sdd/03_verify/10_test/ui_parity/${target_name}-preview.log"
preview_pid=""

cleanup() {
  if [[ -n "${preview_pid}" ]] && kill -0 "${preview_pid}" >/dev/null 2>&1; then
    kill "${preview_pid}" >/dev/null 2>&1 || true
    wait "${preview_pid}" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT

bash "${script_dir}/init_frontend_parity.sh" "${repo_root}" "${frontend_target}"

cd "${repo_root}"
mkdir -p "$(dirname "${preview_log}")"
bash "${script_dir}/run_frontend_target.sh" build "${repo_root}" "${frontend_target}"
npm --prefix "${target_dir}" run preview >"${preview_log}" 2>&1 &
preview_pid="$!"
for _ in $(seq 1 30); do
  if curl -fsS "${preview_url}" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done
if ! curl -fsS "${preview_url}" >/dev/null 2>&1; then
  echo "Preview server did not become ready: ${preview_url}" >&2
  echo "Preview log: ${preview_log}" >&2
  exit 1
fi
bash "${script_dir}/run_frontend_target.sh" materialize_references "${repo_root}" "${frontend_target}"

bash "${script_dir}/run_repo_phase.sh" plan_audit "${repo_root}" "${frontend_target}"
bash "${script_dir}/run_repo_phase.sh" proof "${repo_root}" "${frontend_target}"

echo "frontend_parity_bootstrap=ok"
