import shutil
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def data_root(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> Path:
    pending = tmp_path / "pending"
    completed = tmp_path / "completed"
    pending.mkdir()
    completed.mkdir()
    monkeypatch.setenv("FRAUD_DATA_DIR", str(tmp_path))
    return tmp_path


@pytest.fixture
def client(data_root: Path) -> TestClient:
    return TestClient(app)


@pytest.fixture(autouse=True)
def clean_data(data_root: Path) -> None:
    yield
    for sub in ("pending", "completed"):
        folder = data_root / sub
        if folder.exists():
            shutil.rmtree(folder)
            folder.mkdir()
