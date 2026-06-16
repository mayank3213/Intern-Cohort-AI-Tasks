#!/usr/bin/env bash
# Idempotent bootstrap: pinned Python via mise, venv, deps, optional test gate.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SERVICE_DIR="${ROOT}/service"
VENV="${SERVICE_DIR}/.venv"
RUN_TEST=1

for arg in "$@"; do
  case "${arg}" in
    --no-test) RUN_TEST=0 ;;
    *) echo "Unknown argument: ${arg}" >&2; exit 1 ;;
  esac
done

log() { echo "==> $*"; }

activate_mise_path() {
  for candidate in \
    "${HOME}/.local/bin/mise" \
    "${HOME}/.local/share/mise/bin/mise" \
    "/opt/homebrew/bin/mise" \
    "/usr/local/bin/mise"; do
    if [[ -x "${candidate}" ]]; then
      export PATH="$(dirname "${candidate}"):${PATH}"
      return 0
    fi
  done
  return 1
}

ensure_mise() {
  activate_mise_path || true
  if command -v mise >/dev/null 2>&1; then
    return 0
  fi

  log "mise not found — installing via https://mise.jdx.dev"
  if ! curl -fsSL --retry 3 --retry-delay 2 https://mise.jdx.dev/install.sh | sh; then
    if command -v brew >/dev/null 2>&1; then
      log "curl install failed — trying: brew install mise"
      brew install mise
    else
      echo "mise install failed — install mise manually: https://mise.jdx.dev" >&2
      exit 1
    fi
  fi

  activate_mise_path
  command -v mise >/dev/null 2>&1 || {
    echo "mise install failed — add mise to PATH and retry" >&2
    exit 1
  }
}

log "Repo bootstrap (D5 demo)"
log "Root: ${ROOT}"

ensure_mise
cd "${ROOT}"
log "Installing pinned tools from .mise.toml"
mise trust -q 2>/dev/null || true
mise install -q
eval "$(mise activate bash)"

PYTHON="$(mise which python)"
log "Using Python: ${PYTHON} ($("${PYTHON}" --version))"

if [[ ! -d "${VENV}" ]]; then
  log "Creating venv at ${VENV}"
  "${PYTHON}" -m venv "${VENV}"
fi

log "Installing Python dependencies"
"${VENV}/bin/pip" install -q --upgrade pip
"${VENV}/bin/pip" install -q -r "${SERVICE_DIR}/requirements-dev.txt"

if [[ "${RUN_TEST}" -eq 1 ]]; then
  log "Running tests"
  cd "${SERVICE_DIR}"
  "${VENV}/bin/pytest" -v
  echo ""
  echo "Bootstrap complete: tools installed, deps installed, tests passed (exit 0)"
else
  echo ""
  echo "Bootstrap complete: tools installed, deps installed (--no-test)"
fi
