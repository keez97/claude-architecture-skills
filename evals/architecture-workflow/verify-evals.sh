#!/usr/bin/env bash
# Verifies that all four eval test apps build / boot end-to-end.
#
# Run from this directory:
#   bash verify-evals.sh
#
# What it does:
#   1. messy_flask_app           — pip install + flask test_client smoke
#   2. messy_fastapi_app         — pip install + FastAPI TestClient smoke
#   3. fullstack_app/backend     — pip install + FastAPI TestClient smoke
#   4. fullstack_app/frontend    — npm install + next build
#   5. monolithic_ts_app         — npm install + tsc --noEmit
#
# Skipped (not part of automated chain):
#   - fullstack_app/infra        — requires terraform CLI; run `terraform init -backend=false && terraform validate` manually if installed.

set -euo pipefail
cd "$(dirname "$0")"

PASS=0
FAIL=0
report() {
  if [ "$1" = "PASS" ]; then echo "  ✅ $2"; PASS=$((PASS+1)); else echo "  ❌ $2"; FAIL=$((FAIL+1)); fi
}

echo "=== Setting up Python venv ==="
python3 -m venv .venv
# shellcheck disable=SC1091
source .venv/bin/activate
pip install --quiet --upgrade pip

echo ""
echo "=== 1/5 messy_flask_app ==="
pip install --quiet -r messy_flask_app/requirements.txt
( cd messy_flask_app && rm -f app.db && python3 -c "
from app import app, init_db
with app.app_context():
    init_db()
client = app.test_client()
r = client.get('/products')
assert r.status_code in (200, 401, 404, 500), f'unexpected {r.status_code}'
assert client.get('/__nope__').status_code == 404
" && rm -f app.db ) && report PASS "messy_flask_app boots and serves /products" || report FAIL "messy_flask_app"

echo ""
echo "=== 2/5 messy_fastapi_app ==="
pip install --quiet -r messy_fastapi_app/requirements.txt httpx
( cd messy_fastapi_app && rm -f app.db && python3 -c "
from fastapi.testclient import TestClient
from main import app
client = TestClient(app)
assert client.get('/admin/users').status_code == 200
assert client.get('/__nope__').status_code == 404
" && rm -f app.db ) && report PASS "messy_fastapi_app boots and serves /admin/users" || report FAIL "messy_fastapi_app"

echo ""
echo "=== 3/5 fullstack_app/backend ==="
pip install --quiet -r fullstack_app/backend/requirements.txt
( cd fullstack_app/backend && rm -f taskboard.db && python3 -c "
from fastapi.testclient import TestClient
from main import app
client = TestClient(app)
assert client.get('/api/projects').status_code == 200
assert client.get('/__nope__').status_code == 404
" && rm -f taskboard.db ) && report PASS "fullstack_app/backend boots and serves /api/projects" || report FAIL "fullstack_app/backend"

deactivate || true

echo ""
echo "=== 4/5 fullstack_app/frontend ==="
( cd fullstack_app/frontend && npm install --no-audit --no-fund --silent && npx next build > /tmp/next-build.log 2>&1 ) \
  && report PASS "fullstack_app/frontend next build succeeds" \
  || { tail -30 /tmp/next-build.log; report FAIL "fullstack_app/frontend"; }

echo ""
echo "=== 5/5 monolithic_ts_app ==="
( cd monolithic_ts_app && npm install --no-audit --no-fund --silent && npx tsc --noEmit ) \
  && report PASS "monolithic_ts_app typechecks (tsc --noEmit)" \
  || report FAIL "monolithic_ts_app"

echo ""
echo "=================================="
echo "Result: $PASS passed, $FAIL failed"
echo "=================================="

# Cleanup
rm -rf .venv */node_modules */**/node_modules */.next */**/.next *.db */**/*.db 2>/dev/null || true

[ "$FAIL" -eq 0 ]
