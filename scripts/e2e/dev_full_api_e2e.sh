#!/usr/bin/env bash
set -Eeuo pipefail

API_BASE_URL="${DEV_API_BASE_URL:-http://127.0.0.1:8000/api/v1}"
HEALTH_URL="${DEV_HEALTH_URL:-http://127.0.0.1:8000/health}"
ADMIN_EMAIL="${DEV_ADMIN_EMAIL:-admin@template.com}"
ADMIN_PASSWORD="${DEV_ADMIN_PASSWORD:-Admin123!}"
RESULT_JSON_PATH="${DEV_E2E_RESULT_JSON:-}"

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

log() {
  printf '\n[%s] %s\n' "$(date '+%H:%M:%S')" "$*"
}

json_read() {
  local path="$1"
  local payload
  payload="$(cat)"
  JSON_PAYLOAD="$payload" python3 - "$path" <<'PY'
import json
import os
import sys

path = sys.argv[1]
obj = json.loads(os.environ.get("JSON_PAYLOAD", "{}") or "{}")
cur = obj
for token in path.split("."):
    if token == "":
        continue
    if isinstance(cur, list):
        cur = cur[int(token)]
    else:
        cur = cur[token]
if isinstance(cur, (dict, list)):
    print(json.dumps(cur, ensure_ascii=False))
else:
    print(cur)
PY
}

api_json() {
  local method="$1"
  local url="$2"
  local data="${3:-}"
  local token="${4:-}"

  local out="$TMP_DIR/resp.json"
  local -a cmd
  cmd=(curl -sS -o "$out" -w "%{http_code}" -X "$method" "$url")

  if [[ -n "$token" ]]; then
    cmd+=(-H "Authorization: Bearer $token")
  fi
  if [[ -n "$data" ]]; then
    cmd+=(-H "Content-Type: application/json" --data "$data")
  fi

  local code
  code="$("${cmd[@]}")"
  if [[ "$code" -lt 200 || "$code" -ge 300 ]]; then
    echo "[ERROR] ${method} ${url} -> HTTP ${code}" >&2
    cat "$out" >&2 || true
    return 1
  fi
  cat "$out"
}

api_form() {
  local method="$1"
  local url="$2"
  local token="$3"
  shift 3

  local out="$TMP_DIR/resp.json"
  local -a cmd
  cmd=(curl -sS -o "$out" -w "%{http_code}" -X "$method" "$url")
  if [[ -n "$token" ]]; then
    cmd+=(-H "Authorization: Bearer $token")
  fi
  cmd+=("$@")

  local code
  code="$("${cmd[@]}")"
  if [[ "$code" -lt 200 || "$code" -ge 300 ]]; then
    echo "[ERROR] ${method} ${url} -> HTTP ${code}" >&2
    cat "$out" >&2 || true
    return 1
  fi
  cat "$out"
}

wait_for_health() {
  log "DEV 백엔드 health 체크: ${HEALTH_URL}"
  for _ in $(seq 1 60); do
    if curl -fsS "$HEALTH_URL" >/dev/null 2>&1; then
      echo "[OK] health ready"
      return 0
    fi
    sleep 2
  done
  echo "[ERROR] DEV 백엔드 health check timeout" >&2
  return 1
}

log "E2E 시작"
wait_for_health

RUN_ID="$(date +%s)"
SELLER_EMAIL="seller.${RUN_ID}@example.com"
DEALER1_EMAIL="dealer1.${RUN_ID}@example.com"
DEALER2_EMAIL="dealer2.${RUN_ID}@example.com"
PASSWORD="DevPass123!@#"
PASSWORD_NEXT="DevPass123!@#_N"
BIZ_1="BIZ-${RUN_ID}-01"
BIZ_2="BIZ-${RUN_ID}-02"

echo "business-license" >"$TMP_DIR/business-license.txt"
echo "dealer-license" >"$TMP_DIR/dealer-license.txt"
echo "id-card" >"$TMP_DIR/id-card.txt"
echo "inquiry-attachment" >"$TMP_DIR/inquiry.txt"

log "판매자 회원가입"
api_json "POST" "${API_BASE_URL}/auth/register/seller" "{
  \"full_name\":\"DEV Seller ${RUN_ID}\",
  \"email\":\"${SELLER_EMAIL}\",
  \"password\":\"${PASSWORD}\",
  \"phone\":\"010-1000-1000\",
  \"country\":\"KR\"
}" >/dev/null

log "딜러 2명 회원가입"
api_form "POST" "${API_BASE_URL}/dealers/register" "" \
  -F "full_name=DEV Dealer 1 ${RUN_ID}" \
  -F "email=${DEALER1_EMAIL}" \
  -F "password=${PASSWORD}" \
  -F "phone=010-2000-2000" \
  -F "country=KR" \
  -F "business_number=${BIZ_1}" \
  -F "business_license=@${TMP_DIR}/business-license.txt;type=text/plain" \
  -F "dealer_license=@${TMP_DIR}/dealer-license.txt;type=text/plain" \
  -F "id_card=@${TMP_DIR}/id-card.txt;type=text/plain" >/dev/null

api_form "POST" "${API_BASE_URL}/dealers/register" "" \
  -F "full_name=DEV Dealer 2 ${RUN_ID}" \
  -F "email=${DEALER2_EMAIL}" \
  -F "password=${PASSWORD}" \
  -F "phone=010-3000-3000" \
  -F "country=KR" \
  -F "business_number=${BIZ_2}" \
  -F "business_license=@${TMP_DIR}/business-license.txt;type=text/plain" \
  -F "dealer_license=@${TMP_DIR}/dealer-license.txt;type=text/plain" \
  -F "id_card=@${TMP_DIR}/id-card.txt;type=text/plain" >/dev/null

log "관리자 로그인 + 딜러 승인"
ADMIN_LOGIN="$(api_json "POST" "${API_BASE_URL}/auth/login" "{
  \"email\":\"${ADMIN_EMAIL}\",
  \"password\":\"${ADMIN_PASSWORD}\",
  \"role\":\"ADMIN\"
}")"
ADMIN_TOKEN="$(echo "$ADMIN_LOGIN" | json_read "access_token")"

PENDING="$(api_json "GET" "${API_BASE_URL}/admin/dealers/pending" "" "$ADMIN_TOKEN")"
DEALER1_ID="$(PENDING_JSON="$PENDING" python3 - "$DEALER1_EMAIL" <<'PY'
import json
import os
import sys

email = sys.argv[1]
rows = json.loads(os.environ.get("PENDING_JSON", "[]") or "[]")
for row in rows:
    if row.get("email") == email:
        print(row.get("id", ""))
        break
PY
)"
DEALER2_ID="$(PENDING_JSON="$PENDING" python3 - "$DEALER2_EMAIL" <<'PY'
import json
import os
import sys

email = sys.argv[1]
rows = json.loads(os.environ.get("PENDING_JSON", "[]") or "[]")
for row in rows:
    if row.get("email") == email:
        print(row.get("id", ""))
        break
PY
)"

if [[ -z "${DEALER1_ID}" || -z "${DEALER2_ID}" ]]; then
  echo "[ERROR] 승인 대상 딜러를 찾지 못했습니다." >&2
  exit 1
fi

api_json "POST" "${API_BASE_URL}/admin/dealers/${DEALER1_ID}/approve" "{}" "$ADMIN_TOKEN" >/dev/null
api_json "POST" "${API_BASE_URL}/admin/dealers/${DEALER2_ID}/approve" "{}" "$ADMIN_TOKEN" >/dev/null

log "판매자/딜러 로그인"
SELLER_LOGIN="$(api_json "POST" "${API_BASE_URL}/auth/login" "{
  \"email\":\"${SELLER_EMAIL}\",
  \"password\":\"${PASSWORD}\",
  \"role\":\"SELLER\"
}")"
SELLER_TOKEN="$(echo "$SELLER_LOGIN" | json_read "access_token")"

DEALER1_LOGIN="$(api_json "POST" "${API_BASE_URL}/auth/login" "{
  \"email\":\"${DEALER1_EMAIL}\",
  \"password\":\"${PASSWORD}\",
  \"role\":\"DEALER\"
}")"
DEALER1_TOKEN="$(echo "$DEALER1_LOGIN" | json_read "access_token")"

DEALER2_LOGIN="$(api_json "POST" "${API_BASE_URL}/auth/login" "{
  \"email\":\"${DEALER2_EMAIL}\",
  \"password\":\"${PASSWORD}\",
  \"role\":\"DEALER\"
}")"
DEALER2_TOKEN="$(echo "$DEALER2_LOGIN" | json_read "access_token")"

log "고객지원/설정 API"
api_json "GET" "${API_BASE_URL}/support/notices" >/dev/null
api_json "GET" "${API_BASE_URL}/support/faqs" >/dev/null
api_json "POST" "${API_BASE_URL}/admin/support/notices" "{
  \"category\":\"SERVICE\",
  \"title\":\"DEV 점검 공지 ${RUN_ID}\",
  \"content\":\"DEV E2E 공지 생성 테스트\",
  \"is_pinned\":false
}" "$ADMIN_TOKEN" >/dev/null
api_json "POST" "${API_BASE_URL}/admin/support/faqs" "{
  \"category\":\"GENERAL\",
  \"question\":\"DEV FAQ ${RUN_ID}?\",
  \"answer\":\"DEV FAQ 생성 테스트\",
  \"sort_order\":90,
  \"is_active\":true
}" "$ADMIN_TOKEN" >/dev/null

api_form "POST" "${API_BASE_URL}/support/inquiries" "$SELLER_TOKEN" \
  -F "category=GENERAL" \
  -F "title=DEV 문의 ${RUN_ID}" \
  -F "content=DEV E2E 문의 접수 테스트" \
  -F "agreed_to_policy=true" \
  -F "attachments=@${TMP_DIR}/inquiry.txt;type=text/plain" >/dev/null
api_json "GET" "${API_BASE_URL}/support/inquiries/me" "" "$SELLER_TOKEN" >/dev/null
NOTIFS="$(api_json "GET" "${API_BASE_URL}/support/notifications/me" "" "$SELLER_TOKEN")"
FIRST_NOTIF_ID="$(NOTIFS_JSON="$NOTIFS" python3 - <<'PY'
import json
import os

rows = json.loads(os.environ.get("NOTIFS_JSON", "[]") or "[]")
print(rows[0]["id"] if rows else "")
PY
)"
if [[ -n "$FIRST_NOTIF_ID" ]]; then
  api_json "POST" "${API_BASE_URL}/support/notifications/${FIRST_NOTIF_ID}/read" "" "$SELLER_TOKEN" >/dev/null
fi
api_json "POST" "${API_BASE_URL}/support/notifications/read-all" "" "$SELLER_TOKEN" >/dev/null

api_json "GET" "${API_BASE_URL}/settings/me" "" "$SELLER_TOKEN" >/dev/null
api_json "PUT" "${API_BASE_URL}/settings/me/profile" "{
  \"full_name\":\"DEV Seller ${RUN_ID} Updated\",
  \"phone\":\"010-1111-2222\",
  \"country\":\"KR\"
}" "$SELLER_TOKEN" >/dev/null
api_json "PUT" "${API_BASE_URL}/settings/me/preferences" "{
  \"language\":\"ko\",
  \"region\":\"KR\",
  \"notify_bidding\":true,
  \"notify_settlement\":true,
  \"notify_marketing\":false,
  \"notify_support\":true
}" "$SELLER_TOKEN" >/dev/null
api_json "PUT" "${API_BASE_URL}/settings/me/password" "{
  \"current_password\":\"${PASSWORD}\",
  \"new_password\":\"${PASSWORD_NEXT}\"
}" "$SELLER_TOKEN" >/dev/null
api_json "POST" "${API_BASE_URL}/auth/login" "{
  \"email\":\"${SELLER_EMAIL}\",
  \"password\":\"${PASSWORD_NEXT}\",
  \"role\":\"SELLER\"
}" >/dev/null

log "입찰/정산 API"
VEHICLE1="$(api_json "POST" "${API_BASE_URL}/vehicles" "{
  \"title\":\"DEV 차량 A ${RUN_ID}\",
  \"make\":\"Hyundai\",
  \"model\":\"Sonata\",
  \"year\":2022,
  \"mileage_km\":12000,
  \"license_plate\":\"12가3456\",
  \"fuel_type\":\"GASOLINE\",
  \"transaction_type\":\"DOMESTIC\",
  \"reserve_price\":1000000,
  \"min_bid_increment\":100000,
  \"bidding_hours\":72,
  \"currency\":\"KRW\"
}" "$SELLER_TOKEN")"
VEHICLE1_ID="$(echo "$VEHICLE1" | json_read "id")"

VEHICLE2="$(api_json "POST" "${API_BASE_URL}/vehicles" "{
  \"title\":\"DEV 차량 B ${RUN_ID}\",
  \"make\":\"Kia\",
  \"model\":\"K5\",
  \"year\":2021,
  \"mileage_km\":18000,
  \"license_plate\":\"34나5678\",
  \"fuel_type\":\"GASOLINE\",
  \"transaction_type\":\"DOMESTIC\",
  \"reserve_price\":1500000,
  \"min_bid_increment\":100000,
  \"bidding_hours\":72,
  \"currency\":\"KRW\"
}" "$SELLER_TOKEN")"
VEHICLE2_ID="$(echo "$VEHICLE2" | json_read "id")"

api_json "GET" "${API_BASE_URL}/market/listings" "" "$DEALER1_TOKEN" >/dev/null
api_json "POST" "${API_BASE_URL}/market/listings/${VEHICLE1_ID}/bids" "{\"amount\":1100000}" "$DEALER1_TOKEN" >/dev/null
api_json "PATCH" "${API_BASE_URL}/market/listings/${VEHICLE1_ID}/bids/me" "{\"amount\":1200000}" "$DEALER1_TOKEN" >/dev/null
api_json "DELETE" "${API_BASE_URL}/market/listings/${VEHICLE1_ID}/bids/me" "" "$DEALER1_TOKEN" >/dev/null
api_json "POST" "${API_BASE_URL}/market/listings/${VEHICLE1_ID}/bids" "{\"amount\":1600000}" "$DEALER2_TOKEN" >/dev/null
api_json "POST" "${API_BASE_URL}/seller/vehicles/${VEHICLE1_ID}/bidding/close" "{\"force_close\":true}" "$SELLER_TOKEN" >/dev/null
api_json "POST" "${API_BASE_URL}/seller/vehicles/${VEHICLE2_ID}/bidding/close" "{\"force_close\":true}" "$SELLER_TOKEN" >/dev/null

log "거래 상태머신 API(검차/감가/인도/송금/정산)"
INSPECTION_AT="$(python3 - <<'PY'
from datetime import datetime, timedelta, timezone
print((datetime.now(timezone.utc) + timedelta(days=1)).isoformat())
PY
)"
DELIVERY_AT="$(python3 - <<'PY'
from datetime import datetime, timedelta, timezone
print((datetime.now(timezone.utc) + timedelta(days=2)).isoformat())
PY
)"

api_json "GET" "${API_BASE_URL}/seller/vehicles/${VEHICLE1_ID}/trade-workflow" "" "$SELLER_TOKEN" >/dev/null
api_json "POST" "${API_BASE_URL}/admin/vehicles/${VEHICLE1_ID}/inspection/propose" "{
  \"scheduled_at\":\"${INSPECTION_AT}\",
  \"location\":\"Template 검차센터(서울 성수)\",
  \"assignee\":\"DEV 평가사\",
  \"contact\":\"02-0000-0000\"
}" "$ADMIN_TOKEN" >/dev/null
api_json "POST" "${API_BASE_URL}/seller/vehicles/${VEHICLE1_ID}/inspection/approve" "" "$SELLER_TOKEN" >/dev/null
api_json "POST" "${API_BASE_URL}/admin/vehicles/${VEHICLE1_ID}/inspection/complete" "{
  \"report_url\":\"https://assets.example.com/reports/${RUN_ID}.pdf\",
  \"summary\":\"DEV 검차 완료\"
}" "$ADMIN_TOKEN" >/dev/null

api_json "POST" "${API_BASE_URL}/dealer/vehicles/${VEHICLE1_ID}/depreciation/propose" "{
  \"items\":[
    {\"code\":\"BODY\",\"label\":\"외판 손상\",\"amount\":100000,\"note\":\"범퍼 스크래치\"},
    {\"code\":\"TIRE\",\"label\":\"타이어 마모\",\"amount\":50000,\"note\":\"교체 권장\"}
  ],
  \"comment\":\"1차 감가 제안\"
}" "$DEALER2_TOKEN" >/dev/null

api_json "POST" "${API_BASE_URL}/seller/vehicles/${VEHICLE1_ID}/depreciation/renegotiate" "{
  \"reason\":\"감가 항목 조정 요청\",
  \"target_price\":1580000
}" "$SELLER_TOKEN" >/dev/null

api_json "POST" "${API_BASE_URL}/dealer/vehicles/${VEHICLE1_ID}/depreciation/propose" "{
  \"items\":[
    {\"code\":\"BODY\",\"label\":\"외판 손상\",\"amount\":70000,\"note\":\"부분 수리\"},
    {\"code\":\"TIRE\",\"label\":\"타이어 마모\",\"amount\":30000,\"note\":\"부분 교체\"}
  ],
  \"comment\":\"재협의 반영 감가 제안\"
}" "$DEALER2_TOKEN" >/dev/null

api_json "POST" "${API_BASE_URL}/seller/vehicles/${VEHICLE1_ID}/depreciation/approve" "" "$SELLER_TOKEN" >/dev/null
api_json "POST" "${API_BASE_URL}/dealer/vehicles/${VEHICLE1_ID}/delivery/schedule" "{
  \"scheduled_at\":\"${DELIVERY_AT}\",
  \"method\":\"오프라인 인도\",
  \"location\":\"인천 물류센터\"
}" "$DEALER2_TOKEN" >/dev/null
api_json "POST" "${API_BASE_URL}/seller/vehicles/${VEHICLE1_ID}/delivery/confirm" "" "$SELLER_TOKEN" >/dev/null
api_json "POST" "${API_BASE_URL}/dealer/vehicles/${VEHICLE1_ID}/delivery/confirm" "" "$DEALER2_TOKEN" >/dev/null
api_json "POST" "${API_BASE_URL}/dealer/vehicles/${VEHICLE1_ID}/remittance/submit" "{
  \"amount\":1500000,
  \"bank_account\":\"Template-DEV-ACCOUNT\",
  \"reference\":\"TX-${RUN_ID}\"
}" "$DEALER2_TOKEN" >/dev/null
api_json "POST" "${API_BASE_URL}/admin/vehicles/${VEHICLE1_ID}/remittance/confirm" "" "$ADMIN_TOKEN" >/dev/null
api_json "POST" "${API_BASE_URL}/admin/vehicles/${VEHICLE1_ID}/settlement/complete" "{
  \"settlement_amount\":1500000
}" "$ADMIN_TOKEN" >/dev/null

ACCOUNT_CREATE="$(api_json "POST" "${API_BASE_URL}/seller/settlement/accounts" "{
  \"bank_name\":\"국민은행\",
  \"account_number\":\"110-000-0000\",
  \"account_holder\":\"DEV Seller ${RUN_ID}\",
  \"is_primary\":true
}" "$SELLER_TOKEN")"
ACCOUNT_ID="$(echo "$ACCOUNT_CREATE" | json_read "id")"
api_json "PATCH" "${API_BASE_URL}/seller/settlement/accounts/${ACCOUNT_ID}" "{
  \"bank_name\":\"신한은행\",
  \"account_number\":\"110-000-1111\",
  \"account_holder\":\"DEV Seller ${RUN_ID}\",
  \"is_primary\":true
}" "$SELLER_TOKEN" >/dev/null

api_json "GET" "${API_BASE_URL}/seller/settlement/accounts" "" "$SELLER_TOKEN" >/dev/null
api_json "GET" "${API_BASE_URL}/seller/settlement/records" "" "$SELLER_TOKEN" >/dev/null
api_json "GET" "${API_BASE_URL}/admin/settlement/records" "" "$ADMIN_TOKEN" >/dev/null

log "회원탈퇴 요청 API"
api_json "POST" "${API_BASE_URL}/settings/me/withdrawal" "{
  \"reason\":\"DEV E2E 회원탈퇴 요청 테스트\"
}" "$DEALER2_TOKEN" >/dev/null

if [[ -n "$RESULT_JSON_PATH" ]]; then
  mkdir -p "$(dirname "$RESULT_JSON_PATH")"
  cat >"$RESULT_JSON_PATH" <<JSON
{
  "generated_at": "$(date -u '+%Y-%m-%dT%H:%M:%SZ')",
  "api_base_url": "${API_BASE_URL}",
  "health_url": "${HEALTH_URL}",
  "run_id": "${RUN_ID}",
  "seller_email": "${SELLER_EMAIL}",
  "dealer_emails": ["${DEALER1_EMAIL}", "${DEALER2_EMAIL}"],
  "vehicle_ids": ["${VEHICLE1_ID}", "${VEHICLE2_ID}"],
  "settlement_account_id": "${ACCOUNT_ID}",
  "note": "DEV DB seeded by dev_full_api_e2e.sh"
}
JSON
fi

log "E2E 완료: 전체 주요 API 시나리오 성공"
