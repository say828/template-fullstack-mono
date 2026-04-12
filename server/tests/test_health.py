from fastapi.testclient import TestClient

from api.app import app


client = TestClient(app)


def test_health() -> None:
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "service": "template-fullstack-mono",
    }


def test_system_info() -> None:
    response = client.get("/api/v1/system/info")

    assert response.status_code == 200
    assert response.json() == {
        "service": "template-fullstack-mono",
        "status": "ready",
    }
