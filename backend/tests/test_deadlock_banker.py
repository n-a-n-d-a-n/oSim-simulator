"""Unit tests for Banker's Safety and Resource Request evaluation algorithms."""

import pytest
from backend.sim_engine.deadlock.models import ResourceSystem
from backend.sim_engine.deadlock.banker import BankerAlgorithm
from backend.sim_engine.deadlock.state import RequestOutcome
from backend.sim_engine.deadlock.presets import (
    PRESET_1_CLASSIC_BANKER,
    PRESET_2_REQUEST_GRANTED,
    PRESET_3_REQUEST_DENIED,
)


def test_canonical_silberschatz_banker_safe():
    system = PRESET_1_CLASSIC_BANKER.system
    result = BankerAlgorithm.is_safe(system)
    assert result.is_safe is True
    # Under lowest-index tie-breaking:
    # Initial Work = [3, 3, 2]
    # P1 Need [1, 2, 2] <= [3, 3, 2] -> P1 finishes, Work becomes [3+2, 3+0, 2+0] = [5, 3, 2]
    # P3 Need [0, 1, 1] <= [5, 3, 2] -> P3 finishes, Work becomes [5+2, 3+1, 2+1] = [7, 4, 3]
    # P0 Need [7, 4, 3] <= [7, 4, 3] -> P0 finishes, Work becomes [7+0, 4+1, 3+0] = [7, 5, 3]
    # P2 Need [6, 0, 0] <= [7, 5, 3] -> P2 finishes, Work becomes [7+3, 5+0, 3+2] = [10, 5, 5]
    # P4 Need [4, 3, 1] <= [10, 5, 5] -> P4 finishes, Work becomes [10, 5, 7]
    # Note: When P3 finishes, Work is [7, 4, 3].
    # Then P0 (Need [7, 4, 3]), P2 (Need [6, 0, 0]), P4 (Need [4, 3, 1]) are all <= Work.
    # By lowest-index tie-breaking: index 0 (P0) is chosen before index 2 (P2) or index 4 (P4).
    # Then P2, then P4.
    assert result.safe_sequence == ("P1", "P3", "P0", "P2", "P4")


def test_banker_unsafe_state():
    # If Available is insufficient for any process to finish
    system = ResourceSystem.create(
        processes=["P0", "P1"],
        resource_types=["A"],
        total=[4],
        available=[0],
        allocation=[[2], [2]],
        maximum=[[4], [4]],
    )
    result = BankerAlgorithm.is_safe(system)
    assert result.is_safe is False
    assert result.safe_sequence == ()


def test_banker_deterministic_tie_breaking():
    # Both P0 and P1 have Need <= Work immediately.
    # Tie-breaking must choose P0 first because 0 < 1.
    system = ResourceSystem.create(
        processes=["P0", "P1"],
        resource_types=["A"],
        total=[6],
        available=[2],
        allocation=[[2], [2]],
        maximum=[[3], [3]],  # Both Need 1 <= 2
    )
    result = BankerAlgorithm.is_safe(system)
    assert result.is_safe is True
    assert result.safe_sequence == ("P0", "P1")


def test_banker_all_zero_need_process():
    # Process P0 has Need 0 immediately (Alloc == Max)
    system = ResourceSystem.create(
        processes=["P0", "P1"],
        resource_types=["A"],
        total=[4],
        available=[1],
        allocation=[[2], [1]],
        maximum=[[2], [3]],  # P0 Need is 0, P1 Need is 2
    )
    result = BankerAlgorithm.is_safe(system)
    assert result.is_safe is True
    assert result.safe_sequence == ("P0", "P1")


def test_resource_request_granted():
    # P1 requests [1, 0, 2] in Silberschatz state
    system = PRESET_1_CLASSIC_BANKER.system
    res = BankerAlgorithm.evaluate_request(system, "P1", [1, 0, 2])
    assert res.decision == RequestOutcome.GRANTED
    assert res.safe_sequence is not None
    assert len(res.safe_sequence) == 5
    # Check tentative state
    assert res.tentative_state is not None
    assert res.tentative_state.available == (2, 3, 0)
    assert res.tentative_state.allocation[1] == (3, 0, 2)


def test_resource_request_claim_exceeded():
    # P0 Need is [7, 4, 3]. Request [8, 0, 0] exceeds maximum claim
    system = PRESET_1_CLASSIC_BANKER.system
    res = BankerAlgorithm.evaluate_request(system, "P0", [8, 0, 0])
    assert res.decision == RequestOutcome.ERROR
    assert "exceeded" in res.reason.lower()


def test_resource_request_waiting():
    # P0 requests [4, 0, 0] <= Need [7, 4, 3], but Available is [3, 3, 2] (3 < 4)
    system = PRESET_1_CLASSIC_BANKER.system
    res = BankerAlgorithm.evaluate_request(system, "P0", [4, 0, 0])
    assert res.decision == RequestOutcome.WAITING
    assert "available" in res.reason.lower()


def test_resource_request_denied_and_exact_rollback():
    # Starting from post-P1 granted state, P0 requesting [0, 2, 0] leads to unsafe state
    system = PRESET_3_REQUEST_DENIED.system
    orig_available = system.available
    orig_allocation = system.allocation
    orig_need = system.need

    res = BankerAlgorithm.evaluate_request(system, "P0", [0, 2, 0])
    assert res.decision == RequestOutcome.DENIED
    assert "unsafe" in res.reason.lower()

    # Verify baseline system is byte/structurally identical (rollback succeeded)
    assert system.available == orig_available
    assert system.allocation == orig_allocation
    assert system.need == orig_need


def test_resource_request_invalid_process_or_negative():
    system = PRESET_1_CLASSIC_BANKER.system
    # Unknown process
    res = BankerAlgorithm.evaluate_request(system, "P99", [1, 0, 0])
    assert res.decision == RequestOutcome.ERROR

    # Negative request
    res = BankerAlgorithm.evaluate_request(system, "P0", [-1, 0, 0])
    assert res.decision == RequestOutcome.ERROR

    # Dimension mismatch
    res = BankerAlgorithm.evaluate_request(system, "P0", [1, 0])
    assert res.decision == RequestOutcome.ERROR
