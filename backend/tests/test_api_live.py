"""Integration tests for Live System Observation FastAPI endpoints."""

from unittest.mock import patch
import pytest
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.live_agent.collectors.base import CollectorError

client = TestClient(app)


def test_api_live_status():
    """Test GET /api/v1/live/status returns 200 and valid metadata."""
    response = client.get("/api/v1/live/status")
    assert response.status_code == 200
    data = response.json()

    assert "available" in data
    assert isinstance(data["available"], bool)
    assert "platform" in data
    assert "psutil_version" in data
    assert "message" in data
    assert data["available"] is True


def test_api_live_snapshot():
    """Test GET /api/v1/live/snapshot returns a complete, valid SystemSnapshotResponse."""
    response = client.get("/api/v1/live/snapshot")
    assert response.status_code == 200
    data = response.json()

    assert "snapshot_id" in data
    assert "timestamp" in data
    assert "cpu" in data
    assert "memory" in data
    assert "processes" in data
    assert "process_count" in data

    # Validate CPU fields
    cpu = data["cpu"]
    assert "total_cpu_percent" in cpu
    assert "logical_cpu_count" in cpu
    assert "per_cpu_percent" in cpu
    assert cpu["logical_cpu_count"] >= 1

    # Validate Memory fields
    mem = data["memory"]
    assert "total_bytes" in mem
    assert "used_bytes" in mem
    assert "available_bytes" in mem
    assert "percent_used" in mem
    assert mem["total_bytes"] > 0

    # Validate Process list
    assert data["process_count"] == len(data["processes"])
    assert data["process_count"] > 0
    first_proc = data["processes"][0]
    assert "pid" in first_proc
    assert "name" in first_proc
    assert "status" in first_proc
    assert "cpu_percent" in first_proc
    assert "memory_bytes" in first_proc


def test_api_live_snapshot_collector_error_handling():
    """Test that systemic collector failures return HTTP 503 with helpful detail."""
    with patch(
        "backend.app.api.v1.live.LiveSystemService.capture_snapshot",
        side_effect=CollectorError("CPUCollector", "Simulated OS hardware failure"),
    ):
        response = client.get("/api/v1/live/snapshot")
        assert response.status_code == 503
        data = response.json()
        assert "Host telemetry collection failed" in data["detail"]
        assert "Simulated OS hardware failure" in data["detail"]


def test_api_live_snapshot_unexpected_error_handling():
    """Test that unexpected generic exceptions return HTTP 500."""
    with patch(
        "backend.app.api.v1.live.LiveSystemService.capture_snapshot",
        side_effect=RuntimeError("Kernel panic simulation"),
    ):
        response = client.get("/api/v1/live/snapshot")
        assert response.status_code == 500
        data = response.json()
        assert "Unexpected error while observing host system" in data["detail"]
