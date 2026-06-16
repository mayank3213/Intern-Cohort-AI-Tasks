def test_health(client) -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_echo(client) -> None:
    response = client.get("/echo/hello-docker")
    assert response.status_code == 200
    assert response.json() == {"message": "hello-docker"}
