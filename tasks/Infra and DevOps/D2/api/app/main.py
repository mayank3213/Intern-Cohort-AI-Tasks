import logging
import os
from uuid import uuid4

from fastapi import FastAPI, HTTPException, status
from pydantic import BaseModel, Field

from app.db import get_connection

logging.basicConfig(
    level=os.environ.get("LOG_LEVEL", "info").upper(),
    format="%(asctime)s %(levelname)s [api] %(message)s",
)
logger = logging.getLogger("api")

app = FastAPI(title="D2 Job API", version="1.0.0")


class JobCreate(BaseModel):
    payload: str = Field(min_length=1, max_length=500)


class JobResponse(BaseModel):
    id: str
    payload: str
    status: str
    result: str | None = None


@app.get("/health")
def health() -> dict[str, str]:
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT 1")
    return {"status": "ok"}


@app.get("/jobs/seeded")
def read_seeded_job() -> JobResponse:
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT id, payload, status, result
                FROM jobs
                WHERE id = 'seed-welcome'
                """
            )
            row = cur.fetchone()
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="seed job missing")
    return JobResponse(id=row[0], payload=row[1], status=row[2], result=row[3])


@app.post("/jobs", response_model=JobResponse, status_code=status.HTTP_201_CREATED)
def create_job(body: JobCreate) -> JobResponse:
    job_id = f"job-{uuid4().hex[:12]}"
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO jobs (id, payload, status)
                VALUES (%s, %s, 'pending')
                RETURNING id, payload, status, result
                """,
                (job_id, body.payload),
            )
            row = cur.fetchone()
        conn.commit()
    logger.info("created job %s status=pending payload=%r", row[0], row[1])
    return JobResponse(id=row[0], payload=row[1], status=row[2], result=row[3])


@app.get("/jobs/{job_id}", response_model=JobResponse)
def read_job(job_id: str) -> JobResponse:
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT id, payload, status, result
                FROM jobs
                WHERE id = %s
                """,
                (job_id,),
            )
            row = cur.fetchone()
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="job not found")
    logger.info("GET /jobs/%s status=%s", job_id, row[2])
    return JobResponse(id=row[0], payload=row[1], status=row[2], result=row[3])
