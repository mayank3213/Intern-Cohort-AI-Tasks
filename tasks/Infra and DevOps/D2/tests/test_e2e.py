import os
import time

import httpx
import pytest

API_BASE_URL = os.environ.get("API_BASE_URL", "http://127.0.0.1:8080").rstrip("/")
POLL_TIMEOUT_SECONDS = float(os.environ.get("E2E_POLL_TIMEOUT", "30"))


@pytest.fixture(scope="module")
def client() -> httpx.Client:
    with httpx.Client(base_url=API_BASE_URL, timeout=10.0) as http:
        yield http


def test_health(client: httpx.Client) -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_seeded_job_readable(client: httpx.Client) -> None:
    response = client.get("/jobs/seeded")
    assert response.status_code == 200
    body = response.json()
    assert body["id"] == "seed-welcome"
    assert body["status"] == "done"
    assert body["result"] == "HELLO FROM SEED DATA"


def test_api_worker_pipeline(client: httpx.Client) -> None:
    create = client.post("/jobs", json={"payload": "docker compose e2e"})
    assert create.status_code == 201
    job = create.json()
    job_id = job["id"]
    assert job["status"] == "pending"

    deadline = time.time() + POLL_TIMEOUT_SECONDS
    last = job
    while time.time() < deadline:
        read = client.get(f"/jobs/{job_id}")
        assert read.status_code == 200
        last = read.json()
        if last["status"] == "done":
            break
        time.sleep(1)

    assert last["status"] == "done", f"job {job_id} still {last['status']} after {POLL_TIMEOUT_SECONDS}s"
    assert last["result"] == "DOCKER COMPOSE E2E"
