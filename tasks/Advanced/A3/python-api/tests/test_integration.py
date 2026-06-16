import json
import os
import shutil
import subprocess
import time
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

ROOT = Path(__file__).resolve().parents[2]
RUST_DIR = ROOT / "rust-scorer"
WORKER_DIR = ROOT / "node-worker"


def cargo_available() -> bool:
    return shutil.which("cargo") is not None


def build_rust_scorer() -> Path:
    subprocess.run(
        ["cargo", "build", "--release", "--quiet"],
        cwd=RUST_DIR,
        check=True,
    )
    binary = RUST_DIR / "target" / "release" / "fraud-scorer"
    assert binary.exists(), f"missing scorer binary at {binary}"
    return binary


@pytest.fixture(scope="module")
def scorer_bin() -> Path:
    if not cargo_available():
        pytest.skip("cargo not installed")
    return build_rust_scorer()


@pytest.mark.skipif(not cargo_available(), reason="cargo not installed")
def test_end_to_end_ingest_worker_score(
    tmp_path: Path,
    scorer_bin: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    data_dir = tmp_path / "queue"
    data_dir.mkdir()
    monkeypatch.setenv("FRAUD_DATA_DIR", str(data_dir))

    from app.main import app

    client = TestClient(app)

    payload = {
        "transaction_id": "tx-e2e-001",
        "amount": 6200,
        "currency": "USD",
        "merchant_category": "gambling",
        "country": "CA",
        "device_id": "device-e2e",
        "timestamp": "2025-06-17T04:00:00Z",
    }

    ingest = client.post("/transactions", json=payload)
    assert ingest.status_code == 202

    pending = data_dir / "pending" / "tx-e2e-001.json"
    assert pending.exists()

    env = os.environ.copy()
    env["FRAUD_DATA_DIR"] = str(data_dir)
    env["FRAUD_SCORER_BIN"] = str(scorer_bin)

    result = subprocess.run(
        [
            "node",
            "-e",
            "import('./src/worker.js').then(m => m.processPendingOnce()).then(r => console.log(JSON.stringify(r)))",
        ],
        cwd=WORKER_DIR,
        env=env,
        capture_output=True,
        text=True,
        check=True,
    )

    scores = json.loads(result.stdout.strip())
    assert len(scores) == 1
    assert scores[0]["transaction_id"] == "tx-e2e-001"
    assert scores[0]["risk_level"] == "HIGH"

    completed = data_dir / "completed" / "tx-e2e-001.json"
    assert completed.exists()
    assert not pending.exists()

    status = client.get("/transactions/tx-e2e-001")
    assert status.status_code == 200
    body = status.json()
    assert body["status"] == "scored"
    assert body["risk_score"]["risk_level"] == "HIGH"
    assert body["risk_score"]["risk_score"] >= 60
