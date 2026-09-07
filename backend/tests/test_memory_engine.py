"""Unit tests for OSim Phase 3 contiguous memory allocation algorithms and engine."""

import pytest
from backend.sim_engine.memory import (
    FirstFitAllocator,
    BestFitAllocator,
    WorstFitAllocator,
    NextFitAllocator,
    MemoryOperation,
    MemoryOperationType,
    MemorySimulationEngine,
)


# -----------------------------------------------------------------------------
# First Fit Tests
# -----------------------------------------------------------------------------

def test_first_fit_single_allocation():
    ops = [MemoryOperation(tick=0, operation_type=MemoryOperationType.ALLOCATE, request_id="P1", size=200)]
    engine = MemorySimulationEngine(FirstFitAllocator(), memory_size=1000, operations=ops)
    result = engine.run()

    assert result.terminated_normally is True
    assert len(result.operation_results) == 1
    assert result.operation_results[0].success is True
    assert result.operation_results[0].allocated_start_address == 0
    assert result.operation_results[0].allocated_size == 200

    final_state = result.timeline[-1]
    assert len(final_state.blocks) == 2
    assert final_state.blocks[0].start_address == 0
    assert final_state.blocks[0].end_address == 200
    assert final_state.blocks[0].is_free is False
    assert final_state.blocks[0].owner_id == "P1"

    assert final_state.blocks[1].start_address == 200
    assert final_state.blocks[1].end_address == 1000
    assert final_state.blocks[1].is_free is True


def test_first_fit_chooses_first_suitable_block():
    # Setup layout: Free(100), Free(300), Free(200)
    ops = [
        MemoryOperation(tick=0, operation_type=MemoryOperationType.ALLOCATE, request_id="H1", size=100),
        MemoryOperation(tick=0, operation_type=MemoryOperationType.ALLOCATE, request_id="SEP1", size=50),
        MemoryOperation(tick=0, operation_type=MemoryOperationType.ALLOCATE, request_id="H2", size=300),
        MemoryOperation(tick=0, operation_type=MemoryOperationType.ALLOCATE, request_id="SEP2", size=50),
        MemoryOperation(tick=0, operation_type=MemoryOperationType.ALLOCATE, request_id="H3", size=200),
        # Free H1, H2, H3
        MemoryOperation(tick=1, operation_type=MemoryOperationType.DEALLOCATE, request_id="H1"),
        MemoryOperation(tick=1, operation_type=MemoryOperationType.DEALLOCATE, request_id="H2"),
        MemoryOperation(tick=1, operation_type=MemoryOperationType.DEALLOCATE, request_id="H3"),
        # Request 150: H1 (100) too small; H2 (300) is the first block >= 150!
        MemoryOperation(tick=2, operation_type=MemoryOperationType.ALLOCATE, request_id="REQ", size=150),
    ]
    engine = MemorySimulationEngine(FirstFitAllocator(), memory_size=1000, operations=ops)
    result = engine.run()

    req_result = [r for r in result.operation_results if r.request_id == "REQ"][0]
    assert req_result.success is True
    # H2 starts after H1(100) + SEP1(50) = 150
    assert req_result.allocated_start_address == 150
    assert req_result.allocated_size == 150


# -----------------------------------------------------------------------------
# Best Fit Tests
# -----------------------------------------------------------------------------

def test_best_fit_chooses_smallest_suitable_block():
    # Setup layout with free holes: 100, 500, 200, 300
    ops = [
        MemoryOperation(tick=0, operation_type=MemoryOperationType.ALLOCATE, request_id="H1", size=100),
        MemoryOperation(tick=0, operation_type=MemoryOperationType.ALLOCATE, request_id="SEP1", size=50),
        MemoryOperation(tick=0, operation_type=MemoryOperationType.ALLOCATE, request_id="H2", size=500),
        MemoryOperation(tick=0, operation_type=MemoryOperationType.ALLOCATE, request_id="SEP2", size=50),
        MemoryOperation(tick=0, operation_type=MemoryOperationType.ALLOCATE, request_id="H3", size=200),
        MemoryOperation(tick=0, operation_type=MemoryOperationType.ALLOCATE, request_id="SEP3", size=50),
        MemoryOperation(tick=0, operation_type=MemoryOperationType.ALLOCATE, request_id="H4", size=300),
        # Deallocate holes at tick 1
        MemoryOperation(tick=1, operation_type=MemoryOperationType.DEALLOCATE, request_id="H1"),
        MemoryOperation(tick=1, operation_type=MemoryOperationType.DEALLOCATE, request_id="H2"),
        MemoryOperation(tick=1, operation_type=MemoryOperationType.DEALLOCATE, request_id="H3"),
        MemoryOperation(tick=1, operation_type=MemoryOperationType.DEALLOCATE, request_id="H4"),
        # Request 180: Best fit should choose H3 (size 200) rather than H2 (500) or H4 (300)
        MemoryOperation(tick=2, operation_type=MemoryOperationType.ALLOCATE, request_id="P_TARGET", size=180),
    ]
    engine = MemorySimulationEngine(BestFitAllocator(), memory_size=1500, operations=ops)
    result = engine.run()

    target_res = [r for r in result.operation_results if r.request_id == "P_TARGET"][0]
    assert target_res.success is True
    # H3 start address: 100 + 50 + 500 + 50 = 700
    assert target_res.allocated_start_address == 700


def test_best_fit_deterministic_equal_size_tie():
    # Two identical holes of size 200 at different start addresses
    ops = [
        MemoryOperation(tick=0, operation_type=MemoryOperationType.ALLOCATE, request_id="H1", size=200),
        MemoryOperation(tick=0, operation_type=MemoryOperationType.ALLOCATE, request_id="SEP", size=100),
        MemoryOperation(tick=0, operation_type=MemoryOperationType.ALLOCATE, request_id="H2", size=200),
        MemoryOperation(tick=1, operation_type=MemoryOperationType.DEALLOCATE, request_id="H1"),
        MemoryOperation(tick=1, operation_type=MemoryOperationType.DEALLOCATE, request_id="H2"),
        MemoryOperation(tick=2, operation_type=MemoryOperationType.ALLOCATE, request_id="REQ", size=150),
    ]
    engine = MemorySimulationEngine(BestFitAllocator(), memory_size=1000, operations=ops)
    result = engine.run()

    req_res = [r for r in result.operation_results if r.request_id == "REQ"][0]
    # Tie-breaking by lowest start address -> H1 at address 0
    assert req_res.allocated_start_address == 0


# -----------------------------------------------------------------------------
# Worst Fit Tests
# -----------------------------------------------------------------------------

def test_worst_fit_chooses_largest_block():
    ops = [
        MemoryOperation(tick=0, operation_type=MemoryOperationType.ALLOCATE, request_id="H1", size=150),
        MemoryOperation(tick=0, operation_type=MemoryOperationType.ALLOCATE, request_id="SEP1", size=50),
        MemoryOperation(tick=0, operation_type=MemoryOperationType.ALLOCATE, request_id="H2", size=400),
        MemoryOperation(tick=0, operation_type=MemoryOperationType.ALLOCATE, request_id="SEP2", size=50),
        MemoryOperation(tick=0, operation_type=MemoryOperationType.ALLOCATE, request_id="H3", size=250),
        # Deallocate holes
        MemoryOperation(tick=1, operation_type=MemoryOperationType.DEALLOCATE, request_id="H1"),
        MemoryOperation(tick=1, operation_type=MemoryOperationType.DEALLOCATE, request_id="H2"),
        MemoryOperation(tick=1, operation_type=MemoryOperationType.DEALLOCATE, request_id="H3"),
        # Request 100: Worst Fit chooses H2 (size 400)
        MemoryOperation(tick=2, operation_type=MemoryOperationType.ALLOCATE, request_id="TARGET", size=100),
    ]
    engine = MemorySimulationEngine(WorstFitAllocator(), memory_size=1000, operations=ops)
    result = engine.run()

    target_res = [r for r in result.operation_results if r.request_id == "TARGET"][0]
    assert target_res.success is True
    # H2 starts at 150 + 50 = 200
    assert target_res.allocated_start_address == 200


# -----------------------------------------------------------------------------
# Next Fit Tests (Clarification 1)
# -----------------------------------------------------------------------------

def test_next_fit_cursor_advancement_and_wraparound():
    """Verify Next Fit starts from cursor, advances cursor to end of allocated block,
    and wraps around to 0 when forward space is exhausted."""
    ops = [
        MemoryOperation(tick=0, operation_type=MemoryOperationType.ALLOCATE, request_id="P1", size=200),
        MemoryOperation(tick=1, operation_type=MemoryOperationType.ALLOCATE, request_id="P2", size=200),
        MemoryOperation(tick=2, operation_type=MemoryOperationType.ALLOCATE, request_id="P3", size=200),
        MemoryOperation(tick=3, operation_type=MemoryOperationType.ALLOCATE, request_id="P4", size=200),
        # At tick 3, memory has P1(0-200), P2(200-400), P3(400-600), P4(600-800), Free(800-1000)
        # Cursor is at 800.
        # At tick 4, free P1 [0, 200)
        MemoryOperation(tick=4, operation_type=MemoryOperationType.DEALLOCATE, request_id="P1"),
        # At tick 5, allocate P5 of size 150:
        # First Fit would take [0, 150), but Next Fit must allocate at cursor=800 -> [800, 950)!
        MemoryOperation(tick=5, operation_type=MemoryOperationType.ALLOCATE, request_id="P5", size=150),
        # At tick 6, allocate P6 of size 100:
        # Space from cursor (950) to end (1000) is only 50 (too small).
        # Next Fit must wrap around to address 0, finding free block [0, 200), allocating [0, 100)!
        MemoryOperation(tick=6, operation_type=MemoryOperationType.ALLOCATE, request_id="P6", size=100),
    ]
    engine = MemorySimulationEngine(NextFitAllocator(), memory_size=1000, operations=ops)
    result = engine.run()

    p5_res = [r for r in result.operation_results if r.request_id == "P5"][0]
    assert p5_res.allocated_start_address == 800
    assert p5_res.allocated_size == 150

    p6_res = [r for r in result.operation_results if r.request_id == "P6"][0]
    # Wrap-around verified!
    assert p6_res.allocated_start_address == 0
    assert p6_res.allocated_size == 100


def test_next_fit_cursor_preserved_across_deallocation():
    """Verify cursor is preserved across deallocations and spans coalesced block."""
    ops = [
        MemoryOperation(tick=0, operation_type=MemoryOperationType.ALLOCATE, request_id="P1", size=300),
        MemoryOperation(tick=1, operation_type=MemoryOperationType.ALLOCATE, request_id="P2", size=300),
        # Cursor is at 600
        MemoryOperation(tick=2, operation_type=MemoryOperationType.DEALLOCATE, request_id="P2"),
        # After deallocating P2, free block is [300, 1000), but cursor is preserved at 600!
        MemoryOperation(tick=3, operation_type=MemoryOperationType.ALLOCATE, request_id="P3", size=200),
    ]
    engine = MemorySimulationEngine(NextFitAllocator(), memory_size=1000, operations=ops)
    result = engine.run()

    p3_res = [r for r in result.operation_results if r.request_id == "P3"][0]
    assert p3_res.success is True
    # Allocated starting from preserved cursor (600)
    assert p3_res.allocated_start_address == 600
    assert p3_res.allocated_size == 200


# -----------------------------------------------------------------------------
# Deallocation and Coalescing Tests
# -----------------------------------------------------------------------------

def test_coalescing_bidirectional():
    """Verify adjacent free blocks coalesce to left, right, and both."""
    ops = [
        MemoryOperation(tick=0, operation_type=MemoryOperationType.ALLOCATE, request_id="P1", size=200),
        MemoryOperation(tick=0, operation_type=MemoryOperationType.ALLOCATE, request_id="P2", size=200),
        MemoryOperation(tick=0, operation_type=MemoryOperationType.ALLOCATE, request_id="P3", size=200),
        MemoryOperation(tick=0, operation_type=MemoryOperationType.ALLOCATE, request_id="P4", size=400),
        # Free P1: [0, 200) free
        MemoryOperation(tick=1, operation_type=MemoryOperationType.DEALLOCATE, request_id="P1"),
        # Free P3: [400, 600) free
        MemoryOperation(tick=2, operation_type=MemoryOperationType.DEALLOCATE, request_id="P3"),
        # Free P2: merges with left ([0, 200)) and right ([400, 600)) -> single block [0, 600)
        MemoryOperation(tick=3, operation_type=MemoryOperationType.DEALLOCATE, request_id="P2"),
    ]
    engine = MemorySimulationEngine(FirstFitAllocator(), memory_size=1000, operations=ops)
    result = engine.run()

    final_blocks = result.timeline[-1].blocks
    assert len(final_blocks) == 2
    assert final_blocks[0].is_free is True
    assert final_blocks[0].start_address == 0
    assert final_blocks[0].end_address == 600
    assert final_blocks[0].size == 600

    assert final_blocks[1].is_free is False
    assert final_blocks[1].owner_id == "P4"
    assert final_blocks[1].start_address == 600
    assert final_blocks[1].end_address == 1000


# -----------------------------------------------------------------------------
# Same-Tick Operations Test (Clarification 2)
# -----------------------------------------------------------------------------

def test_same_tick_deallocate_before_allocate_reusing_memory():
    """Verify DEALLOCATE runs before ALLOCATE at the same tick, enabling allocation to reuse freed space."""
    ops = [
        MemoryOperation(tick=0, operation_type=MemoryOperationType.ALLOCATE, request_id="P1", size=500),
        MemoryOperation(tick=0, operation_type=MemoryOperationType.ALLOCATE, request_id="P2", size=500),
        # Memory is 100% full at tick 0.
        # At tick 1, schedule ALLOCATE P3 (size 400) and DEALLOCATE P1.
        # Even if ALLOCATE appears first in the list, engine processes DEALLOCATE first!
        MemoryOperation(tick=1, operation_type=MemoryOperationType.ALLOCATE, request_id="P3", size=400),
        MemoryOperation(tick=1, operation_type=MemoryOperationType.DEALLOCATE, request_id="P1"),
    ]
    engine = MemorySimulationEngine(FirstFitAllocator(), memory_size=1000, operations=ops)
    result = engine.run()

    p3_res = [r for r in result.operation_results if r.request_id == "P3"][0]
    assert p3_res.success is True
    assert p3_res.allocated_start_address == 0
    assert p3_res.allocated_size == 400


# -----------------------------------------------------------------------------
# External Fragmentation Failure Test
# -----------------------------------------------------------------------------

def test_external_fragmentation_failure():
    """Verify allocation fails when total free memory >= request size, but no single block is large enough."""
    ops = [
        MemoryOperation(tick=0, operation_type=MemoryOperationType.ALLOCATE, request_id="P1", size=200),
        MemoryOperation(tick=0, operation_type=MemoryOperationType.ALLOCATE, request_id="HOLD1", size=100),
        MemoryOperation(tick=0, operation_type=MemoryOperationType.ALLOCATE, request_id="P2", size=200),
        MemoryOperation(tick=0, operation_type=MemoryOperationType.ALLOCATE, request_id="HOLD2", size=100),
        # Free P1 and P2 -> two free holes of 200 each (total 400 free)
        MemoryOperation(tick=1, operation_type=MemoryOperationType.DEALLOCATE, request_id="P1"),
        MemoryOperation(tick=1, operation_type=MemoryOperationType.DEALLOCATE, request_id="P2"),
        # Request 350 -> total free (400) > 350, but largest free is 200 -> FAILS!
        MemoryOperation(tick=2, operation_type=MemoryOperationType.ALLOCATE, request_id="LARGE", size=350),
    ]
    engine = MemorySimulationEngine(FirstFitAllocator(), memory_size=600, operations=ops)
    result = engine.run()

    large_res = [r for r in result.operation_results if r.request_id == "LARGE"][0]
    assert large_res.success is False
    assert "External fragmentation" in large_res.reason

    final_metrics = result.final_metrics
    assert final_metrics.free_memory == 400
    assert final_metrics.largest_free_block == 200
    assert final_metrics.external_fragmentation == 200  # 400 - 200
    assert final_metrics.external_fragmentation_ratio == 0.5  # 200 / 400


# -----------------------------------------------------------------------------
# Deterministic Repeated Execution Test
# -----------------------------------------------------------------------------

def test_memory_engine_determinism():
    """Verify repeated execution produces 100% byte-identical simulation snapshots and metrics."""
    from backend.sim_engine.memory.presets import get_preset_g_stress

    preset = get_preset_g_stress()

    def run_sim():
        engine = MemorySimulationEngine(
            BestFitAllocator(),
            memory_size=preset.memory_size,
            operations=preset.operations,
        )
        return engine.run().to_dict()

    runs = [run_sim() for _ in range(5)]
    for i in range(1, 5):
        assert runs[i] == runs[0]
