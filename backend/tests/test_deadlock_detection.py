"""Unit tests for Deadlock Detection, WFG reduction, and RAG graph analysis."""

import pytest
from backend.sim_engine.deadlock.models import ResourceSystem
from backend.sim_engine.deadlock.detection import DeadlockDetector
from backend.sim_engine.deadlock.graph import GraphAnalyzer
from backend.sim_engine.deadlock.presets import (
    PRESET_1_CLASSIC_BANKER,
    PRESET_4_SINGLE_INSTANCE_DEADLOCK,
    PRESET_5_MULTI_INSTANCE_NO_DEADLOCK,
    PRESET_6_MULTI_INSTANCE_DEADLOCK,
)



def test_single_instance_no_cycle():
    # P0 holds R0, P1 requests R0 -> R0 held by P0, so P1 -> P0
    # No back edge, acyclic
    system = ResourceSystem.create(
        processes=["P0", "P1"],
        resource_types=["R0"],
        total=[1],
        available=[0],
        allocation=[[1], [0]],
        request=[[0], [1]],
    )
    result = DeadlockDetector.detect(system)
    assert result.is_deadlocked is False
    assert result.deadlocked_processes == ()
    assert result.wfg_snapshot is not None
    assert result.wfg_snapshot.has_cycle is False


def test_single_instance_cycle_preset_4():
    # 4 processes, 4 single-instance resources in a ring:
    # P0 holds R0 requests R1
    # P1 holds R1 requests R2
    # P2 holds R2 requests R3
    # P3 holds R3 requests R0
    system = PRESET_4_SINGLE_INSTANCE_DEADLOCK.system
    result = DeadlockDetector.detect(system)
    assert result.is_deadlocked is True
    assert set(result.deadlocked_processes) == {"P0", "P1", "P2", "P3"}
    assert result.wfg_snapshot is not None
    assert result.wfg_snapshot.has_cycle is True
    assert len(result.wfg_snapshot.cycles) >= 1


def test_single_instance_multiple_cycles():
    # P0 holds R0, requests R1
    # P1 holds R1, requests R0 (Cycle 1)
    # P2 holds R2, requests R3
    # P3 holds R3, requests R2 (Cycle 2)
    system = ResourceSystem.create(
        processes=["P0", "P1", "P2", "P3"],
        resource_types=["R0", "R1", "R2", "R3"],
        total=[1, 1, 1, 1],
        available=[0, 0, 0, 0],
        allocation=[
            [1, 0, 0, 0],
            [0, 1, 0, 0],
            [0, 0, 1, 0],
            [0, 0, 0, 1],
        ],
        request=[
            [0, 1, 0, 0],
            [1, 0, 0, 0],
            [0, 0, 0, 1],
            [0, 0, 1, 0],
        ],
    )
    result = DeadlockDetector.detect(system)
    assert result.is_deadlocked is True
    assert set(result.deadlocked_processes) == {"P0", "P1", "P2", "P3"}
    assert result.wfg_snapshot is not None
    assert len(result.wfg_snapshot.cycles) >= 2


def test_multi_instance_cycle_with_no_deadlock_counterexample():
    """Validates Preset 5: A cycle exists in RAG, but multi-instance matrix reduction proves NO DEADLOCK."""
    system = PRESET_5_MULTI_INSTANCE_NO_DEADLOCK.system
    rag = GraphAnalyzer.build_rag(system)
    assert rag.has_cycle is True  # Cycle exists: P0 -> R1 -> P1 -> R0 -> P0

    # However, matrix reduction must prove that the system is NOT deadlocked:
    result = DeadlockDetector.detect(system)
    assert result.is_deadlocked is False
    assert result.deadlocked_processes == ()

    # WFG should NOT be constructed for multi-instance resources
    assert result.wfg_snapshot is None


def test_multi_instance_genuine_deadlock_preset_6():
    """Validates Preset 6: Silberschatz 7.6.2 multi-instance deadlock benchmark."""
    system = PRESET_6_MULTI_INSTANCE_DEADLOCK.system
    result = DeadlockDetector.detect(system)
    assert result.is_deadlocked is True
    assert set(result.deadlocked_processes) == {"P1", "P2", "P3", "P4"}
    # P0 is not deadlocked because it had Request [0, 0, 0] and reduced cleanly
    assert "P0" not in result.deadlocked_processes


def test_rag_serialization_and_determinism():
    system = PRESET_1_CLASSIC_BANKER.system
    rag1 = GraphAnalyzer.build_rag(system)
    rag2 = GraphAnalyzer.build_rag(system)
    assert rag1.to_dict() == rag2.to_dict()
    assert len(rag1.nodes) == 8  # 5 processes + 3 resources
