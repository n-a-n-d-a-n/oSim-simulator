"""Integration tests for Virtual Memory FastAPI endpoints."""

import pytest
from fastapi.testclient import TestClient

from backend.app.main import app

client = TestClient(app)


def test_api_virtual_memory_simulate_fifo():
    """Test POST /api/v1/virtual-memory/simulate with FIFO algorithm."""
    payload = {
        "algorithm": "FIFO",
        "frame_count": 3,
        "page_size": 4096,
        "virtual_page_count": 16,
        "input_mode": "PAGE_REFERENCE",
        "references": [7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2, 1, 2, 0, 1, 7, 0, 1],
    }
    response = client.post("/api/v1/virtual-memory/simulate", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["algorithm_name"] == "FIFO"
    assert data["num_frames"] == 3
    assert data["page_size"] == 4096
    assert data["terminated_normally"] is True
    assert data["final_metrics"]["page_faults"] == 15
    assert data["final_metrics"]["page_hits"] == 5
    assert len(data["timeline"]) == 20
    assert len(data["events"]) > 0


def test_api_virtual_memory_simulate_lru():
    """Test POST /api/v1/virtual-memory/simulate with LRU algorithm."""
    payload = {
        "algorithm": "LRU",
        "frame_count": 3,
        "page_size": 4096,
        "virtual_page_count": 16,
        "input_mode": "PAGE_REFERENCE",
        "references": [7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2, 1, 2, 0, 1, 7, 0, 1],
    }
    response = client.post("/api/v1/virtual-memory/simulate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["final_metrics"]["page_faults"] == 12


def test_api_virtual_memory_simulate_optimal():
    """Test POST /api/v1/virtual-memory/simulate with Optimal algorithm."""
    payload = {
        "algorithm": "OPTIMAL",
        "frame_count": 3,
        "page_size": 4096,
        "virtual_page_count": 16,
        "input_mode": "PAGE_REFERENCE",
        "references": [7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2, 1, 2, 0, 1, 7, 0, 1],
    }
    response = client.post("/api/v1/virtual-memory/simulate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["final_metrics"]["page_faults"] == 9


def test_api_virtual_memory_simulate_clock():
    """Test POST /api/v1/virtual-memory/simulate with Clock algorithm."""
    payload = {
        "algorithm": "CLOCK",
        "frame_count": 3,
        "page_size": 4096,
        "virtual_page_count": 16,
        "input_mode": "PAGE_REFERENCE",
        "references": [0, 1, 2, 3, 0, 1, 4, 0, 1, 2, 3, 4],
    }
    response = client.post("/api/v1/virtual-memory/simulate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["algorithm_name"] == "CLOCK"
    assert data["final_metrics"]["total_references"] == 12


def test_api_virtual_memory_simulate_virtual_address_mode():
    """Test POST /api/v1/virtual-memory/simulate with VIRTUAL_ADDRESS input mode."""
    payload = {
        "algorithm": "LRU",
        "frame_count": 4,
        "page_size": 4096,
        "virtual_page_count": 16,
        "input_mode": "VIRTUAL_ADDRESS",
        "references": [0, 4096, 5000, 8192],
    }
    response = client.post("/api/v1/virtual-memory/simulate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["input_mode"] == "VIRTUAL_ADDRESS"
    first_snap = data["timeline"][0]
    assert first_snap["reference"]["virtual_address"] == 0
    assert first_snap["reference"]["page_number"] == 0
    assert first_snap["physical_address"] == 0


def test_api_virtual_memory_validation_non_power_of_two():
    """Test that non-power-of-two page_size or virtual_page_count returns 422."""
    payload = {
        "algorithm": "FIFO",
        "frame_count": 3,
        "page_size": 3000,  # not power of 2
        "virtual_page_count": 16,
        "input_mode": "PAGE_REFERENCE",
        "references": [1, 2, 3],
    }
    response = client.post("/api/v1/virtual-memory/simulate", json=payload)
    assert response.status_code == 422


def test_api_virtual_memory_validation_out_of_bounds_reference():
    """Test that out of bounds page numbers return 422."""
    payload = {
        "algorithm": "FIFO",
        "frame_count": 3,
        "page_size": 4096,
        "virtual_page_count": 16,
        "input_mode": "PAGE_REFERENCE",
        "references": [1, 2, 99],  # 99 >= 16
    }
    response = client.post("/api/v1/virtual-memory/simulate", json=payload)
    assert response.status_code == 422


def test_api_virtual_memory_workloads():
    """Test GET /api/v1/virtual-memory/workloads and GET /api/v1/virtual-memory/workloads/{id}."""
    res_list = client.get("/api/v1/virtual-memory/workloads")
    assert res_list.status_code == 200
    presets = res_list.json()
    assert len(presets) >= 5

    first_preset = presets[0]
    preset_id = first_preset["id"]

    res_single = client.get(f"/api/v1/virtual-memory/workloads/{preset_id}")
    assert res_single.status_code == 200
    single_data = res_single.json()
    assert single_data["id"] == preset_id

    # Non-existent preset
    res_404 = client.get("/api/v1/virtual-memory/workloads/non-existent-preset")
    assert res_404.status_code == 404
