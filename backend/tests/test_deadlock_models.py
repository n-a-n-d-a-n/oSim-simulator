"""Unit tests for Deadlock domain models and invariant validations."""

import pytest
from backend.sim_engine.deadlock.models import (
    Process,
    ResourceType,
    ResourceSystem,
    DomainValidationError,
)


def test_process_and_resource_creation():
    p = Process(id="P0", name="Process 0")
    assert p.id == "P0"
    r = ResourceType(id="R0", total_instances=3)
    assert r.id == "R0"
    assert r.total_instances == 3


def test_resource_type_invalid_capacity():
    with pytest.raises(DomainValidationError, match="positive"):
        ResourceType(id="R0", total_instances=0)
    with pytest.raises(DomainValidationError, match="positive"):
        ResourceType(id="R0", total_instances=-2)


def test_resource_system_conservation_invariant():
    # Alloc sum (2 + 1 = 3) + Available (1) = 4 != Total (5) -> Fail
    with pytest.raises(DomainValidationError, match="Conservation violation"):
        ResourceSystem.create(
            processes=["P0", "P1"],
            resource_types=["R0"],
            total=[5],
            available=[1],
            allocation=[[2], [1]],
            maximum=[[3], [2]],
        )


def test_resource_system_negative_values():
    with pytest.raises(DomainValidationError, match="cannot be negative"):
        ResourceSystem.create(
            processes=["P0"],
            resource_types=["R0"],
            total=[3],
            available=[-1],
            allocation=[[4]],
            maximum=[[4]],
        )

    with pytest.raises(DomainValidationError, match="cannot be negative"):
        ResourceSystem.create(
            processes=["P0"],
            resource_types=["R0"],
            total=[3],
            available=[4],
            allocation=[[-1]],
            maximum=[[2]],
        )


def test_resource_system_allocation_exceeds_maximum():
    # Alloc[0][0] = 3 > Max[0][0] = 2 -> Claim violation
    with pytest.raises(DomainValidationError, match="Claim violation"):
        ResourceSystem.create(
            processes=["P0"],
            resource_types=["R0"],
            total=[5],
            available=[2],
            allocation=[[3]],
            maximum=[[2]],
        )


def test_resource_system_dimension_mismatches():
    # Available vector length 2 != resource count 1
    with pytest.raises(DomainValidationError, match="Available vector length"):
        ResourceSystem.create(
            processes=["P0"],
            resource_types=["R0"],
            total=[5],
            available=[2, 3],
            allocation=[[3]],
            maximum=[[4]],
        )

    # Allocation rows 2 != process count 1
    with pytest.raises(DomainValidationError, match="Allocation matrix row count"):
        ResourceSystem.create(
            processes=["P0"],
            resource_types=["R0"],
            total=[5],
            available=[2],
            allocation=[[2], [1]],
            maximum=[[4]],
        )


def test_resource_system_auto_computes_need():
    system = ResourceSystem.create(
        processes=["P0", "P1"],
        resource_types=["A", "B"],
        total=[10, 5],
        available=[5, 3],
        allocation=[[3, 1], [2, 1]],
        maximum=[[7, 3], [4, 2]],
    )
    # Need = Max - Alloc
    # P0: [7-3, 3-1] = [4, 2]
    # P1: [4-2, 2-1] = [2, 1]
    assert system.need == ((4, 2), (2, 1))


def test_resource_system_rejects_inconsistent_explicit_need():
    with pytest.raises(DomainValidationError, match="Inconsistent Need provided"):
        ResourceSystem.from_vectors(
            processes=["P0"],
            resource_types=["A"],
            total=[5],
            available=[2],
            allocation=[[3]],
            maximum=[[5]],
            explicit_need=[[1]],  # Correct Need should be 5 - 3 = 2
        )


def test_zero_allocation_and_zero_demand_processes():
    # Valid system with process having zero allocation and zero maximum claim
    system = ResourceSystem.create(
        processes=["P0", "P1"],
        resource_types=["A"],
        total=[4],
        available=[4],
        allocation=[[0], [0]],
        maximum=[[0], [3]],
    )
    assert system.need[0] == (0,)
    assert system.allocation[0] == (0,)
