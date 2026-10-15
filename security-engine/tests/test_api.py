import os

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def setup_function():
    os.environ["ENGINE_API_KEY"] = "test-secret-key"
    os.environ["ALLOWED_TARGETS"] = "example.com"


def test_health_is_public():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_repo_check_requires_api_key():
    response = client.post("/v1/repo-check", json={"files": [{"path": "app.py", "content": "eval(user_input)"}]})
    assert response.status_code == 401


def test_repo_check_finds_eval_and_redacts_secret():
    response = client.post(
        "/v1/repo-check",
        headers={"X-Engine-Key": "test-secret-key"},
        json={"files": [{"path": "src/app.ts", "content": 'const password = "supersecretvalue123";\neval(input);'}]},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["files_checked"] == 1
    assert len(data["findings"]) == 2
    assert "supersecretvalue123" not in str(data)
    assert any(item["id"].startswith("dynamic-eval:") for item in data["findings"])


def test_repo_check_rejects_path_traversal():
    response = client.post(
        "/v1/repo-check",
        headers={"X-Engine-Key": "test-secret-key"},
        json={"files": [{"path": "../secrets.txt", "content": "nothing"}]},
    )
    assert response.status_code == 422


def test_web_check_requires_explicit_authorization():
    response = client.post(
        "/v1/web-check",
        headers={"X-Engine-Key": "test-secret-key"},
        json={"host": "example.com", "authorized": False},
    )
    assert response.status_code == 403


def test_web_check_requires_allowlist():
    response = client.post(
        "/v1/web-check",
        headers={"X-Engine-Key": "test-secret-key"},
        json={"host": "not-allowlisted.example", "authorized": True},
    )
    assert response.status_code == 403
