"""Integration tests for Deadlock and Banker's Algorithm API endpoints."""

from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


def test_api_list_workloads():
    response = client.get("/api/v1/deadlock/workloads")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 6
    preset_ids = [p["id"] for p in data]
    assert "silberschatz_banker_safe" in preset_ids
    assert "silberschatz_request_granted" in preset_ids
    assert "silberschatz_request_denied" in preset_ids
    assert "single_instance_deadlock_cycle" in preset_ids
    assert "multi_instance_cycle_no_deadlock" in preset_ids
    assert "multi_instance_genuine_deadlock" in preset_ids


def test_api_get_workload_by_id():
    response = client.get("/api/v1/deadlock/workloads/silberschatz_banker_safe")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == "silberschatz_banker_safe"
    assert data["expected_is_safe"] is True
    assert data["expected_safe_sequence"] == ["P1", "P3", "P0", "P2", "P4"]

    # 404 for unknown preset
    res_404 = client.get("/api/v1/deadlock/workloads/unknown_preset_id")
    assert res_404.status_code == 404


def test_api_safety_endpoint_success():
    payload = {
        "processes": ["P0", "P1"],
        "resource_types": ["R0"],
        "total": [4],
        "available": [1],
        "allocation": [[2], [1]],
        "maximum": [[3], [2]],
    }
    response = client.post("/api/v1/deadlock/safety", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["is_safe"] is True
    assert len(data["safe_sequence"]) == 2
    assert "timeline" in data
    assert "events" in data
    assert "metrics" in data
    assert "rag_snapshot" in data


def test_api_safety_endpoint_validation_error():
    # Invariant violation: Alloc sum (3+1=4) + Available (2) = 6 != Total (5)
    payload = {
        "processes": ["P0", "P1"],
        "resource_types": ["R0"],
        "total": [5],
        "available": [2],
        "allocation": [[3], [1]],
        "maximum": [[4], [2]],
    }
    response = client.post("/api/v1/deadlock/safety", json=payload)
    assert response.status_code == 422
    assert "Conservation violation" in response.text


def test_api_request_endpoint_granted():
    payload = {
        "processes": ["P0", "P1"],
        "resource_types": ["R0"],
        "total": [4],
        "available": [1],
        "allocation": [[2], [1]],
        "maximum": [[3], [2]],
        "requesting_process_id": "P1",
        "request_vector": [1],
    }
    response = client.post("/api/v1/deadlock/request", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["request_result"]["decision"] == "GRANTED"


def test_api_request_endpoint_denied():
    payload = {
        "processes": ["P0", "P1"],
        "resource_types": ["R0"],
        "total": [4],
        "available": [1],
        "allocation": [[2], [1]],
        "maximum": [[4], [2]],
        "requesting_process_id": "P0",
        "request_vector": [1],
    }
    response = client.post("/api/v1/deadlock/request", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["request_result"]["decision"] == "DENIED"


def test_api_detect_endpoint():
    payload = {
        "processes": ["P0", "P1"],
        "resource_types": ["R0"],
        "total": [1],
        "available": [0],
        "allocation": [[1], [0]],
        "request": [[0], [1]],
    }
    response = client.post("/api/v1/deadlock/detect", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["is_deadlocked"] is False
    assert data["wfg_snapshot"] is not None
