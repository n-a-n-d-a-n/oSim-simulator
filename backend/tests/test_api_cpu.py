"""Tests for FastAPI CPU scheduling and workload preset endpoints."""

import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


def test_api_health():
    """Verify health endpoint."""
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_api_fcfs_simulation():
    """Test FCFS via API matching Silberschatz Chapter 5 benchmark."""
    payload = {
        "algorithm": "FCFS",
        "processes": [
            {"pid": "P1", "arrival_time": 0, "burst_time": 24},
            {"pid": "P2", "arrival_time": 0, "burst_time": 3},
            {"pid": "P3", "arrival_time": 0, "burst_time": 3},
        ],
    }
    response = client.post("/api/v1/cpu/simulate", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["scheduler_name"] == "FCFS"
    assert data["terminated_normally"] is True
    assert data["total_simulation_time"] == 30
    assert data["metrics"]["average_waiting_time"] == 17.0
    assert data["metrics"]["average_turnaround_time"] == 27.0
    assert len(data["gantt_segments"]) == 3
    assert len(data["timeline"]) == 31  # t=0 to t=30 snapshots
    assert len(data["events"]) > 0


def test_api_sjf_simulation():
    """Test SJF (Non-preemptive) via API."""
    payload = {
        "algorithm": "SJF",
        "processes": [
            {"pid": "P1", "arrival_time": 0, "burst_time": 24},
            {"pid": "P2", "arrival_time": 0, "burst_time": 3},
            {"pid": "P3", "arrival_time": 0, "burst_time": 3},
        ],
    }
    response = client.post("/api/v1/cpu/simulate", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["scheduler_name"] == "SJF"
    assert data["metrics"]["average_waiting_time"] == 3.0
    gantt = [seg["pid"] for seg in data["gantt_segments"]]
    assert gantt == ["P2", "P3", "P1"]


def test_api_srtf_simulation():
    """Test SRTF (Preemptive SJF) via API."""
    payload = {
        "algorithm": "SRTF",
        "processes": [
            {"pid": "P1", "arrival_time": 0, "burst_time": 8},
            {"pid": "P2", "arrival_time": 1, "burst_time": 4},
            {"pid": "P3", "arrival_time": 2, "burst_time": 9},
            {"pid": "P4", "arrival_time": 3, "burst_time": 5},
        ],
    }
    response = client.post("/api/v1/cpu/simulate", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["scheduler_name"] == "SRTF"
    assert data["metrics"]["average_waiting_time"] == 6.5
    assert len(data["gantt_segments"]) == 5


def test_api_round_robin_simulation():
    """Test Round Robin via API."""
    payload = {
        "algorithm": "ROUND_ROBIN",
        "time_quantum": 4,
        "processes": [
            {"pid": "P1", "arrival_time": 0, "burst_time": 24},
            {"pid": "P2", "arrival_time": 0, "burst_time": 3},
            {"pid": "P3", "arrival_time": 0, "burst_time": 3},
        ],
    }
    response = client.post("/api/v1/cpu/simulate", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert "Round Robin" in data["scheduler_name"]
    assert abs(data["metrics"]["average_waiting_time"] - (17.0 / 3.0)) < 0.01


def test_api_priority_simulation():
    """Test Priority Scheduling (both Non-Preemptive and Preemptive) via API."""
    payload_np = {
        "algorithm": "PRIORITY_NON_PREEMPTIVE",
        "lower_number_higher_priority": True,
        "processes": [
            {"pid": "P1", "arrival_time": 0, "burst_time": 10, "priority": 3},
            {"pid": "P2", "arrival_time": 0, "burst_time": 1, "priority": 1},
            {"pid": "P3", "arrival_time": 0, "burst_time": 2, "priority": 4},
            {"pid": "P4", "arrival_time": 0, "burst_time": 1, "priority": 5},
            {"pid": "P5", "arrival_time": 0, "burst_time": 5, "priority": 2},
        ],
    }
    resp_np = client.post("/api/v1/cpu/simulate", json=payload_np)
    assert resp_np.status_code == 200
    assert resp_np.json()["metrics"]["average_waiting_time"] == 8.2

    # Preemptive priority
    payload_p = {
        "algorithm": "PRIORITY_PREEMPTIVE",
        "lower_number_higher_priority": True,
        "processes": [
            {"pid": "P1", "arrival_time": 0, "burst_time": 10, "priority": 3},
            {"pid": "P2", "arrival_time": 2, "burst_time": 4, "priority": 1},
        ],
    }
    resp_p = client.post("/api/v1/cpu/simulate", json=payload_p)
    assert resp_p.status_code == 200
    assert len(resp_p.json()["gantt_segments"]) == 3


def test_api_validation_errors():
    """Test input validations: empty processes, duplicate PIDs, negative burst/arrival."""
    # 1. Empty process list
    r1 = client.post("/api/v1/cpu/simulate", json={"algorithm": "FCFS", "processes": []})
    assert r1.status_code == 422

    # 2. Duplicate PIDs
    r2 = client.post(
        "/api/v1/cpu/simulate",
        json={
            "algorithm": "FCFS",
            "processes": [
                {"pid": "P1", "arrival_time": 0, "burst_time": 3},
                {"pid": "P1", "arrival_time": 1, "burst_time": 2},
            ],
        },
    )
    assert r2.status_code == 422
    assert "Duplicate process IDs" in r2.text

    # 3. Negative arrival time
    r3 = client.post(
        "/api/v1/cpu/simulate",
        json={
            "algorithm": "FCFS",
            "processes": [{"pid": "P1", "arrival_time": -1, "burst_time": 3}],
        },
    )
    assert r3.status_code == 422

    # 4. Negative burst time
    r4 = client.post(
        "/api/v1/cpu/simulate",
        json={
            "algorithm": "FCFS",
            "processes": [{"pid": "P1", "arrival_time": 0, "burst_time": -5}],
        },
    )
    assert r4.status_code == 422


def test_api_missing_round_robin_quantum():
    """Round Robin requires valid positive time_quantum."""
    payload_no_q = {
        "algorithm": "ROUND_ROBIN",
        "processes": [{"pid": "P1", "arrival_time": 0, "burst_time": 5}],
    }
    r1 = client.post("/api/v1/cpu/simulate", json=payload_no_q)
    assert r1.status_code == 422

    payload_neg_q = {
        "algorithm": "ROUND_ROBIN",
        "time_quantum": 0,
        "processes": [{"pid": "P1", "arrival_time": 0, "burst_time": 5}],
    }
    r2 = client.post("/api/v1/cpu/simulate", json=payload_neg_q)
    assert r2.status_code == 422


def test_api_presets_retrieval():
    """Test GET /api/v1/workloads and GET /api/v1/workloads/{preset_id}."""
    res = client.get("/api/v1/workloads")
    assert res.status_code == 200
    presets = res.json()
    assert len(presets) >= 4
    preset_ids = [p["id"] for p in presets]
    assert "silberschatz-fcfs-sjf" in preset_ids
    assert "silberschatz-srtf" in preset_ids

    # Detail query
    detail_res = client.get("/api/v1/workloads/silberschatz-srtf")
    assert detail_res.status_code == 200
    assert len(detail_res.json()["processes"]) == 4

    # Non-existent preset
    not_found = client.get("/api/v1/workloads/non-existent-preset")
    assert not_found.status_code == 404


def test_api_deterministic_repeated_requests():
    """Repeated identical requests must produce identical JSON responses."""
    payload = {
        "algorithm": "SRTF",
        "processes": [
            {"pid": "P1", "arrival_time": 0, "burst_time": 8},
            {"pid": "P2", "arrival_time": 1, "burst_time": 4},
            {"pid": "P3", "arrival_time": 2, "burst_time": 9},
        ],
    }
    r1 = client.post("/api/v1/cpu/simulate", json=payload).json()
    r2 = client.post("/api/v1/cpu/simulate", json=payload).json()
    assert r1 == r2
