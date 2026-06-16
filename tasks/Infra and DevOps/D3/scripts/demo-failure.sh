#!/usr/bin/env bash
# Applies a deliberate test failure, runs CI, captures exit code, then reverts.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TEST_FILE="${ROOT}/service/tests/test_health.py"
BACKUP="${TEST_FILE}.bak"

cp "${TEST_FILE}" "${BACKUP}"

cleanup() {
  mv "${BACKUP}" "${TEST_FILE}"
}
trap cleanup EXIT

# Deliberate regression: break assertion in test_health_returns_ok
python3 - "${TEST_FILE}" <<'PY'
from pathlib import Path
import sys
path = Path(sys.argv[1])
text = path.read_text()
text = text.replace(
    'assert response.json() == {"status": "ok"}',
    'assert response.json() == {"status": "broken"}',
)
path.write_text(text)
PY

cd "${ROOT}"
set +e
./scripts/run-ci-local.sh
EXIT=$?
set -e

echo ""
if [[ "${EXIT}" -ne 0 ]]; then
  echo "Failure demo: FAILED as expected (exit ${EXIT})"
else
  echo "Failure demo: ERROR — pipeline should have failed"
  exit 1
fi
