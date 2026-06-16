#!/usr/bin/env bash
# Mirrors .github/workflows/ci.yml stages for local proof (no act required).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SERVICE_DIR="${ROOT}/service"
IMAGE_NAME="${IMAGE_NAME:-d3-echo-api}"
PYTHON_VERSIONS="${PYTHON_VERSIONS:-3.11 3.12}"

cd "${SERVICE_DIR}"

echo "==> Stage 1: lint"
python3 -m pip install -q ruff==0.9.2
python3 -m ruff check app tests
echo "lint: OK"

echo "==> Stage 2: test (matrix: ${PYTHON_VERSIONS})"
for py in ${PYTHON_VERSIONS}; do
  echo "--- python ${py} ---"
  if command -v "python${py}" >/dev/null 2>&1; then
    PY="python${py}"
  elif [[ "${py}" == "$(python3 -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")')" ]]; then
    PY="python3"
  else
    echo "WARN: python${py} not found; using python3 for this axis"
    PY="python3"
  fi
  "${PY}" -m pip install -q -r requirements-dev.txt
  "${PY}" -m pytest -v
done
echo "test: OK"

echo "==> Stage 3: build-image"
SHORT_SHA="$(git -C "${ROOT}" rev-parse --short HEAD 2>/dev/null || echo local)"
BRANCH="$(git -C "${ROOT}" rev-parse --abbrev-ref HEAD 2>/dev/null || echo local)"
BRANCH_SLUG="${BRANCH//\//-}"

docker build -t "${IMAGE_NAME}:sha-${SHORT_SHA}" -t "${IMAGE_NAME}:${BRANCH_SLUG}" .
echo "build-image: OK"
docker images | grep -E "^${IMAGE_NAME}|REPOSITORY" || docker images

echo ""
echo "CI local run: PASSED (exit 0)"
