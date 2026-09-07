"""Integration tests for FastAPI Memory Simulation and Workload endpoints."""

import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


def test_api_first_fit_simulation():
    payload = {
        "algorithm": "FIRST_FIT",
        "memory_size": 1000,
        "operations": [
            {"tick": 0, "operation_type": "ALLOCATE", "request_id": "P1", "size": 200},
            {"tick": 1, "operation_type": "ALLOCATE", "request_id": "P2", "size": 300},
        ],
    }
    response = client.post("/api/v1/memory/simulate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["algorithm_name"] == "First Fit"
    assert data["memory_size"] == 1000
    assert len(data["operation_results"]) == 2
    assert data["final_metrics"]["used_memory"] == 500
    assert data["final_metrics"]["free_memory"] == 500


def test_api_best_fit_simulation():
    payload = {
        "algorithm": "BEST_FIT",
        "memory_size": 1000,
        "operations": [
            {"tick": 0, "operation_type": "ALLOCATE", "request_id": "H1", "size": 200},
            {"tick": 0, "operation_type": "ALLOCATE", "request_id": "SEP", "size": 100},
            {"tick": 0, "operation_type": "ALLOCATE", "request_id": "H2", "size": 400},
            {"tick": 1, "operation_type": "DEALLOCATE", "request_id": "H1"},
            {"tick": 1, "operation_type": "DEALLOCATE", "request_id": "H2"},
            {"tick": 2, "operation_type": "ALLOCATE", "request_id": "REQ", "size": 150},
        ],
    }
    response = client.post("/api/v1/memory/simulate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["algorithm_name"] == "Best Fit"
    req_res = [r for r in data["operation_results"] if r["request_id"] == "REQ"][0]
    assert req_res["allocated_start_address"] == 0  # H1 was size 200, better fit than H2 (400)


def test_api_worst_fit_simulation():
    payload = {
        "algorithm": "WORST_FIT",
        "memory_size": 1000,
        "operations": [
            {"tick": 0, "operation_type": "ALLOCATE", "request_id": "H1", "size": 200},
            {"tick": 0, "operation_type": "ALLOCATE", "request_id": "SEP", "size": 100},
            {"tick": 0, "operation_type": "ALLOCATE", "request_id": "H2", "size": 400},
            {"tick": 1, "operation_type": "DEALLOCATE", "request_id": "H1"},
            {"tick": 1, "operation_type": "DEALLOCATE", "request_id": "H2"},
            {"tick": 2, "operation_type": "ALLOCATE", "request_id": "REQ", "size": 150},
        ],
    }
    response = client.post("/api/v1/memory/simulate", json=payload)
    assert response.status_code == 200
    data = response.json()
    req_res = [r for r in data["operation_results"] if r["request_id"] == "REQ"][0]
    assert req_res["allocated_start_address"] == 300  # H2 starts at 300, worst fit (size 400)


def test_api_next_fit_simulation():
    payload = {
        "algorithm": "NEXT_FIT",
        "memory_size": 1000,
        "operations": [
            {"tick": 0, "operation_type": "ALLOCATE", "request_id": "P1", "size": 200},
            {"tick": 1, "operation_type": "ALLOCATE", "request_id": "P2", "size": 200},
            {"tick": 2, "operation_type": "DEALLOCATE", "request_id": "P1"},
            {"tick": 3, "operation_type": "ALLOCATE", "request_id": "P3", "size": 200},
        ],
    }
    response = client.post("/api/v1/memory/simulate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["algorithm_name"] == "Next Fit"
    p3_res = [r for r in data["operation_results"] if r["request_id"] == "P3"][0]
    # Next Fit cursor was at 400, so P3 allocated at [400, 600) rather than [0, 200)
    assert p3_res["allocated_start_address"] == 400


def test_api_external_fragmentation_failure():
    payload = {
        "algorithm": "FIRST_FIT",
        "memory_size": 400,
        "operations": [
            {"tick": 0, "operation_type": "ALLOCATE", "request_id": "P1", "size": 100},
            {"tick": 0, "operation_type": "ALLOCATE", "request_id": "HOLD", "size": 100},
            {"tick": 0, "operation_type": "ALLOCATE", "request_id": "P2", "size": 100},
            {"tick": 1, "operation_type": "DEALLOCATE", "request_id": "P1"},
            {"tick": 1, "operation_type": "DEALLOCATE", "request_id": "P2"},
            # Total free = 300 (P1=100, P2=100, remaining=100), request = 250 -> fails!
            {"tick": 2, "operation_type": "ALLOCATE", "request_id": "FAIL_P", "size": 250},
        ],
    }
    response = client.post("/api/v1/memory/simulate", json=payload)
    assert response.status_code == 200
    data = response.json()
    fail_res = [r for r in data["operation_results"] if r["request_id"] == "FAIL_P"][0]
    assert fail_res["success"] is False
    assert "External fragmentation" in fail_res["reason"]


def test_api_validation_errors():
    # Negative memory size
    res1 = client.post("/api/v1/memory/simulate", json={"algorithm": "FIRST_FIT", "memory_size": -50, "operations": []})
    assert res1.status_code == 422

    # Zero size allocation
    res2 = client.post(
        "/api/v1/memory/simulate",
        json={
            "algorithm": "FIRST_FIT",
            "memory_size": 500,
            "operations": [{"tick": 0, "operation_type": "ALLOCATE", "request_id": "P1", "size": 0}],
        },
    )
    assert res2.status_code == 422


def test_api_workloads_presets():
    response = client.get("/api/v1/memory/workloads")
    assert response.status_code == 200
    presets = response.json()
    assert len(presets) == 7

    # Retrieve specific preset
    preset_id = presets[0]["id"]
    res_single = client.get(f"/api/v1/memory/workloads/{preset_id}")
    assert res_single.status_code == 200
    assert res_single.json()["id"] == preset_id

    # 404 for unknown preset
    res_404 = client.get("/api/v1/memory/workloads/non-existent-preset")
    assert res_404.status_code == 404


def test_api_deterministic_repeated_requests():
    payload = {
        "algorithm": "NEXT_FIT",
        "memory_size": 1000,
        "operations": [
            {"tick": 0, "operation_type": "ALLOCATE", "request_id": "P1", "size": 200},
            {"tick": 1, "operation_type": "ALLOCATE", "request_id": "P2", "size": 200},
            {"tick": 2, "operation_type": "DEALLOCATE", "request_id": "P1"},
            {"tick": 3, "operation_type": "ALLOCATE", "request_id": "P3", "size": 150},
        ],
    }
    res1 = client.post("/api/v1/memory/simulate", json=payload).json()
    res2 = client.post("/api/v1/memory/simulate", json=payload).json()
    assert res1 == res2
