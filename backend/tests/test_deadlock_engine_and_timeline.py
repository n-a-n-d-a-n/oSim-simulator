"""Unit tests for DeadlockSimulationEngine, timeline immutability, determinism, and metrics."""

import pytest
from backend.sim_engine.deadlock.models import ResourceSystem
from backend.sim_engine.deadlock.engine import DeadlockSimulationEngine
from backend.sim_engine.deadlock.presets import (
    PRESET_1_CLASSIC_BANKER,
    PRESET_2_REQUEST_GRANTED,
    PRESET_6_MULTI_INSTANCE_DEADLOCK,
)


def test_timeline_snapshot_immutability():
    system = PRESET_1_CLASSIC_BANKER.system
    result = DeadlockSimulationEngine.simulate_safety(system)

    # Inspect snapshot tuples
    snap0 = result.timeline[0]
    assert isinstance(snap0.system_state.allocation, tuple)
    assert isinstance(snap0.system_state.available, tuple)

    # Attempting to assign to a frozen snapshot must raise FrozenInstanceError
    with pytest.raises(Exception):
        snap0.tick = 999  # type: ignore


def test_safety_simulation_determinism():
    system1 = PRESET_1_CLASSIC_BANKER.system
    system2 = PRESET_1_CLASSIC_BANKER.system

    res1 = DeadlockSimulationEngine.simulate_safety(system1)
    res2 = DeadlockSimulationEngine.simulate_safety(system2)

    assert res1.to_dict() == res2.to_dict()
    assert res1.safe_sequence == res2.safe_sequence
    assert [e.event_id for e in res1.events] == [e.event_id for e in res2.events]


def test_request_simulation_determinism():
    system = PRESET_1_CLASSIC_BANKER.system
    res1 = DeadlockSimulationEngine.simulate_request(system, "P1", [1, 0, 2])
    res2 = DeadlockSimulationEngine.simulate_request(system, "P1", [1, 0, 2])

    assert res1.to_dict() == res2.to_dict()
    assert res1.request_result is not None
    assert res1.request_result.decision == res2.request_result.decision


def test_detection_simulation_metrics():
    system = PRESET_6_MULTI_INSTANCE_DEADLOCK.system
    res = DeadlockSimulationEngine.simulate_detection(system)

    assert res.is_deadlocked is True
    assert set(res.deadlocked_processes or ()) == {"P1", "P2", "P3", "P4"}
    assert res.metrics.total_processes == 5
    assert res.metrics.total_resource_types == 3
    assert res.metrics.deadlocked_process_count == 4
    assert res.metrics.resource_utilization_ratio > 0.0
