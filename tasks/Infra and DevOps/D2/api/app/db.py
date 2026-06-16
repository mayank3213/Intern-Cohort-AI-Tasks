import os
from contextlib import contextmanager

import psycopg

DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql://jobs:jobs@127.0.0.1:5432/jobs",
)


@contextmanager
def get_connection():
    with psycopg.connect(DATABASE_URL) as conn:
        yield conn
