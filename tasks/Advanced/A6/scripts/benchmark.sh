#!/usr/bin/env bash
# Baseline benchmark for A6 FileScanner (before fix).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FIXTURE_DIR="$ROOT/fixture/fixtures/scanner_tree"
GENERATOR="$ROOT/fixture/generate_fixture.php"
BENCH="$ROOT/fixture/bench_scanner.php"

DEPTH="${BENCH_DEPTH:-5}"
BREADTH="${BENCH_BREADTH:-4}"
FILES_PER_DIR="${BENCH_FILES_PER_DIR:-10}"
ITERATIONS="${BENCH_ITERATIONS:-5}"

require() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "ERROR: '$1' required"
    exit 1
  }
}

require php

if [[ ! -d "$FIXTURE_DIR" ]]; then
  echo "==> Generating fixture (depth=$DEPTH breadth=$BREADTH files_per_dir=$FILES_PER_DIR)"
  php "$GENERATOR" "$FIXTURE_DIR" "$DEPTH" "$BREADTH" "$FILES_PER_DIR"
fi

echo "==> Baseline benchmark ($ITERATIONS iterations)"
php "$BENCH" --fixture="$FIXTURE_DIR" --iterations="$ITERATIONS"
