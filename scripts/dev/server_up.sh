#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

echo "[LOCAL] runtime stack 기동(mysql + server + template + admin)"
docker compose up -d --build mysql server template admin
echo "[LOCAL] runtime stack 상태"
docker compose ps
