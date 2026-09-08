"""Comprehensive unit tests for the Live Agent subsystem and its domain models."""

import pytest
import time
from typing import Tuple

from backend.live_agent.models import (
    ProcessObservation,
    CPUObservation,
    MemoryObservation,
    SystemSnapshot,
)
from backend.live_agent.collectors.base import (
    CollectorError,
    ProcessCollector,
    CPUCollector,
    MemoryCollector,
)
from backend.live_agent.collectors.cpu import PsutilCPUCollector
from backend.live_agent.collectors.memory import PsutilMemoryCollector
from backend.live_agent.collectors.process import PsutilProcessCollector
from backend.live_agent.service import LiveSystemService


# ============================================================================
# Model Invariants & Immutability Tests
# ============================================================================

def test_process_observation_valid():
    """Test valid construction of ProcessObservation and its serialization."""
    proc = ProcessObservation(
        pid=1001,
        name="python.exe",
        parent_pid=1,
        status="running",
        cpu_percent=12.5,
        memory_bytes=104857600,
        thread_count=8,
        cpu_time_seconds=35.2,
        create_time=1700000000.0,
    )
    assert proc.pid == 1001
    assert proc.name == "python.exe"
    assert proc.thread_count == 8

    d = proc.to_dict()
    assert d["pid"] == 1001
    assert d["name"] == "python.exe"
    assert d["cpu_percent"] == 12.5


def test_process_observation_immutability():
    """Verify that ProcessObservation instances are frozen/immutable."""
    proc = ProcessObservation(
        pid=10,
        name="init",
        parent_pid=None,
        status="sleeping",
        cpu_percent=0.0,
        memory_bytes=2048,
    )
    with pytest.raises(Exception):
        proc.pid = 20  # type: ignore


def test_process_observation_invalid_fields():
    """Verify invariants reject negative numbers and invalid states."""
    # Negative PID
    with pytest.raises(ValueError, match="PID must be non-negative"):
        ProcessObservation(pid=-1, name="bad", parent_pid=None, status="r", cpu_percent=0.0, memory_bytes=10)

    # Negative parent PID
    with pytest.raises(ValueError, match="Parent PID must be non-negative"):
        ProcessObservation(pid=1, name="bad", parent_pid=-5, status="r", cpu_percent=0.0, memory_bytes=10)

    # Negative memory
    with pytest.raises(ValueError, match="memory_bytes must be non-negative"):
        ProcessObservation(pid=1, name="bad", parent_pid=None, status="r", cpu_percent=0.0, memory_bytes=-10)

    # Negative CPU percent
    with pytest.raises(ValueError, match="cpu_percent must be non-negative"):
        ProcessObservation(pid=1, name="bad", parent_pid=None, status="r", cpu_percent=-1.0, memory_bytes=10)

    # Invalid thread count (< 1)
    with pytest.raises(ValueError, match="thread_count must be at least 1"):
        ProcessObservation(pid=1, name="bad", parent_pid=None, status="r", cpu_percent=0.0, memory_bytes=10, thread_count=0)


def test_cpu_observation_valid_and_invariants():
    """Test CPUObservation construction and invariant validations."""
    now = time.time()
    cpu = CPUObservation(
        total_cpu_percent=25.4,
        logical_cpu_count=8,
        per_cpu_percent=(20.0, 30.0, 25.0, 26.6),
        timestamp=now,
    )
    assert cpu.total_cpu_percent == 25.4
    assert cpu.logical_cpu_count == 8
    assert len(cpu.per_cpu_percent) == 4

    # Invalid logical CPU count
    with pytest.raises(ValueError, match="logical_cpu_count must be positive"):
        CPUObservation(total_cpu_percent=10.0, logical_cpu_count=0, per_cpu_percent=(), timestamp=now)

    # Negative total CPU percent
    with pytest.raises(ValueError, match="total_cpu_percent must be non-negative"):
        CPUObservation(total_cpu_percent=-0.5, logical_cpu_count=4, per_cpu_percent=(), timestamp=now)


def test_memory_observation_valid_and_invariants():
    """Test MemoryObservation construction and invariant validations."""
    now = time.time()
    mem = MemoryObservation(
        total_bytes=16000000000,
        used_bytes=8000000000,
        available_bytes=8000000000,
        percent_used=50.0,
        timestamp=now,
    )
    assert mem.percent_used == 50.0

    # Total bytes <= 0
    with pytest.raises(ValueError, match="total_bytes must be strictly positive"):
        MemoryObservation(total_bytes=0, used_bytes=0, available_bytes=0, percent_used=0.0, timestamp=now)

    # Negative used bytes
    with pytest.raises(ValueError, match="used_bytes must be non-negative"):
        MemoryObservation(total_bytes=1000, used_bytes=-10, available_bytes=500, percent_used=50.0, timestamp=now)

    # Percent used > 100.0
    with pytest.raises(ValueError, match="percent_used must be between 0.0 and 100.0"):
        MemoryObservation(total_bytes=1000, used_bytes=1100, available_bytes=0, percent_used=110.0, timestamp=now)


def test_system_snapshot_process_count_integrity():
    """Verify SystemSnapshot enforces process_count matching the processes tuple length."""
    now = time.time()
    cpu = CPUObservation(total_cpu_percent=10.0, logical_cpu_count=4, per_cpu_percent=(10.0,), timestamp=now)
    mem = MemoryObservation(total_bytes=1000, used_bytes=500, available_bytes=500, percent_used=50.0, timestamp=now)
    p1 = ProcessObservation(pid=1, name="p1", parent_pid=None, status="r", cpu_percent=1.0, memory_bytes=100)

    # Valid matching count
    snap = SystemSnapshot(
        snapshot_id="snap_123",
        timestamp=now,
        cpu=cpu,
        memory=mem,
        processes=(p1,),
        process_count=1,
    )
    assert snap.process_count == 1
    assert len(snap.processes) == 1

    # Mismatch count must raise ValueError
    with pytest.raises(ValueError, match="process_count .* does not match processes length"):
        SystemSnapshot(
            snapshot_id="snap_123",
            timestamp=now,
            cpu=cpu,
            memory=mem,
            processes=(p1,),
            process_count=99,
        )


# ============================================================================
# Mock Collectors & LiveSystemService Tests
# ============================================================================

class MockCPUCollector(CPUCollector):
    def __init__(self, value: float = 15.0):
        self.value = value

    def collect_cpu(self) -> CPUObservation:
        return CPUObservation(
            total_cpu_percent=self.value,
            logical_cpu_count=4,
            per_cpu_percent=(self.value, self.value),
            timestamp=time.time(),
        )


class MockMemoryCollector(MemoryCollector):
    def __init__(self, used: int = 4000):
        self.used = used

    def collect_memory(self) -> MemoryObservation:
        return MemoryObservation(
            total_bytes=10000,
            used_bytes=self.used,
            available_bytes=10000 - self.used,
            percent_used=(self.used / 10000) * 100.0,
            timestamp=time.time(),
        )


class MockProcessCollector(ProcessCollector):
    def __init__(self, procs: Tuple[ProcessObservation, ...] = ()):
        self.procs = procs

    def collect_processes(self) -> Tuple[ProcessObservation, ...]:
        return self.procs


def test_live_system_service_with_mocks():
    """Verify LiveSystemService captures and assembles snapshots correctly using injected collectors."""
    p1 = ProcessObservation(pid=100, name="service.exe", parent_pid=None, status="running", cpu_percent=5.0, memory_bytes=500)
    p2 = ProcessObservation(pid=200, name="worker.exe", parent_pid=100, status="sleeping", cpu_percent=2.0, memory_bytes=800)

    service = LiveSystemService(
        cpu_collector=MockCPUCollector(value=18.5),
        memory_collector=MockMemoryCollector(used=3000),
        process_collector=MockProcessCollector((p1, p2)),
    )

    snapshot = service.capture_snapshot()
    assert snapshot.process_count == 2
    assert snapshot.cpu.total_cpu_percent == 18.5
    assert snapshot.memory.used_bytes == 3000
    assert snapshot.memory.percent_used == 30.0
    assert snapshot.snapshot_id.startswith("snap_")
    assert service.is_available() is True


def test_live_system_service_collector_error_propagation():
    """Verify that systemic collector errors raise CollectorError through the service."""
    class FailingMemoryCollector(MemoryCollector):
        def collect_memory(self) -> MemoryObservation:
            raise CollectorError("MemoryCollector", "Simulated OS memory failure")

    service = LiveSystemService(
        cpu_collector=MockCPUCollector(),
        memory_collector=FailingMemoryCollector(),
        process_collector=MockProcessCollector(),
    )

    with pytest.raises(CollectorError, match="Simulated OS memory failure"):
        service.capture_snapshot()

    assert service.is_available() is False


# ============================================================================
# Real psutil Collector Tests on Host
# ============================================================================

def test_real_psutil_collectors():
    """Test actual execution of PsutilCPUCollector, PsutilMemoryCollector, and PsutilProcessCollector on host."""
    cpu_collector = PsutilCPUCollector(sample_interval=0.05)
    mem_collector = PsutilMemoryCollector()
    proc_collector = PsutilProcessCollector()

    cpu_obs = cpu_collector.collect_cpu()
    assert cpu_obs.logical_cpu_count >= 1
    assert 0.0 <= cpu_obs.total_cpu_percent <= 100.0

    mem_obs = mem_collector.collect_memory()
    assert mem_obs.total_bytes > 0
    assert mem_obs.used_bytes > 0
    assert 0.0 <= mem_obs.percent_used <= 100.0

    proc_obs = proc_collector.collect_processes()
    assert len(proc_obs) > 0
    # Confirm deterministic sorting by PID
    pids = [p.pid for p in proc_obs]
    assert pids == sorted(pids)


def test_real_live_system_service_snapshot():
    """Test that default LiveSystemService captures a complete real SystemSnapshot."""
    service = LiveSystemService(cpu_collector=PsutilCPUCollector(sample_interval=0.05))
    snapshot = service.capture_snapshot()

    assert snapshot.snapshot_id.startswith("snap_")
    assert snapshot.process_count > 0
    assert snapshot.process_count == len(snapshot.processes)
    assert snapshot.cpu.logical_cpu_count >= 1
    assert snapshot.memory.total_bytes > 0
    assert service.is_available() is True
