INSERT INTO jobs (id, payload, status, result)
VALUES (
    'seed-welcome',
    'hello from seed data',
    'done',
    'HELLO FROM SEED DATA'
)
ON CONFLICT (id) DO NOTHING;
