import logging
import os
import time

import psycopg

DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql://jobs:jobs@db:5432/jobs",
)
POLL_SECONDS = float(os.environ.get("WORKER_POLL_SECONDS", "2"))

logging.basicConfig(
    level=os.environ.get("LOG_LEVEL", "info").upper(),
    format="%(asctime)s %(levelname)s [worker] %(message)s",
)
logger = logging.getLogger("worker")


def transform_payload(payload: str) -> str:
    return payload.strip().upper()


def process_pending_once(conn: psycopg.Connection) -> int:
    processed = 0
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT id, payload
            FROM jobs
            WHERE status = 'pending'
            ORDER BY created_at
            FOR UPDATE SKIP LOCKED
            LIMIT 5
            """
        )
        rows = cur.fetchall()

        for job_id, payload in rows:
            logger.info("processing job %s", job_id)
            cur.execute(
                "UPDATE jobs SET status = 'processing', updated_at = NOW() WHERE id = %s",
                (job_id,),
            )
            result = transform_payload(payload)
            cur.execute(
                """
                UPDATE jobs
                SET status = 'done', result = %s, updated_at = NOW()
                WHERE id = %s
                """,
                (result, job_id),
            )
            logger.info("completed job %s result=%r", job_id, result)
            processed += 1

    if processed:
        conn.commit()
    return processed


def main() -> None:
    logger.info("worker started poll=%ss db=%s", POLL_SECONDS, DATABASE_URL.split("@")[-1])
    while True:
        try:
            with psycopg.connect(DATABASE_URL) as conn:
                count = process_pending_once(conn)
                if count:
                    logger.info("batch processed %s job(s)", count)
        except psycopg.OperationalError as exc:
            logger.warning("database not ready: %s", exc)
        except Exception as exc:
            logger.exception("worker error: %s", exc)
        time.sleep(POLL_SECONDS)


if __name__ == "__main__":
    main()
