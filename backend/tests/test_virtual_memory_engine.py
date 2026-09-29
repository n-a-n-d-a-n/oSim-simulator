"""Tests for VirtualMemorySimulationEngine lifecycle, invariants, events, and snapshot immutability."""

import pytest
from backend.sim_engine.virtual_memory.engine import VirtualMemorySimulationEngine
from backend.sim_engine.virtual_memory.replacement import FIFOReplacement, LRUReplacement
from backend.sim_engine.virtual_memory.state import InputMode


def test_engine_virtual_address_mode():
    """Verify engine handles byte virtual addresses, computes offsets and physical addresses."""
    # Virtual address space = 4096 * 16 = 65536
    byte_addresses = [0, 4096, 5000, 8192, 4100]

    engine = VirtualMemorySimulationEngine(
        algorithm=LRUReplacement(),
        frame_count=3,
        page_size=4096,
        virtual_page_count=16,
        input_mode=InputMode.VIRTUAL_ADDRESS,
        raw_references=byte_addresses,
    )
    result = engine.run()
    assert len(result.timeline) == 5
    assert result.final_metrics.total_references == 5

    # Check first step (address 0 -> Page 0, offset 0 -> loaded in Frame 0 -> Phys addr 0)
    step0 = result.timeline[0]
    assert step0.reference.virtual_address == 0
    assert step0.reference.page_number == 0
    assert step0.reference.offset == 0
    assert step0.physical_address == 0
    assert step0.is_fault is True

    # Check step 2 (address 5000 -> Page 1, offset 904 -> Frame 1 -> Phys addr 4096 + 904 = 5000)
    step2 = result.timeline[2]
    assert step2.reference.virtual_address == 5000
    assert step2.reference.page_number == 1
    assert step2.reference.offset == 904
    assert step2.physical_address == (step2.frame_number * 4096) + 904


def test_engine_snapshot_immutability():
    """CRITICAL REGRESSION TEST: Prove that timeline snapshots are strictly immutable."""
    engine = VirtualMemorySimulationEngine(
        algorithm=LRUReplacement(),
        frame_count=3,
        page_size=4096,
        virtual_page_count=16,
        input_mode=InputMode.PAGE_REFERENCE,
        raw_references=[1, 2, 3, 4],
    )
    result = engine.run()
    timeline = result.timeline

    # Record state of snapshot 0
    snap0 = timeline[0]
    initial_page1_present = snap0.page_table[1].is_present
    initial_frame0_page = snap0.frames[0].page_number
    initial_free_frames = snap0.free_frames_count

    assert initial_page1_present is True
    assert initial_frame0_page == 1
    assert initial_free_frames == 2

    # Mutate internal engine structures
    engine._page_table.lookup(1).is_present = False
    engine._page_table.lookup(1).frame_number = None
    engine._memory_pool.get_frame(0).page_number = 999

    # Re-verify that snapshot 0 was completely unaffected
    assert snap0.page_table[1].is_present == initial_page1_present
    assert snap0.frames[0].page_number == initial_frame0_page
    assert snap0.free_frames_count == initial_free_frames

    # Attempting to assign to frozen snapshot fields must raise AttributeError
    with pytest.raises((AttributeError, TypeError)):
        snap0.is_hit = True  # type: ignore

    with pytest.raises((AttributeError, TypeError)):
        snap0.page_table[0].is_present = True  # type: ignore


def test_engine_event_stream_integrity():
    """Verify that standardized event stream contains all lifecycle events."""
    engine = VirtualMemorySimulationEngine(
        algorithm=FIFOReplacement(),
        frame_count=2,
        page_size=4096,
        virtual_page_count=8,
        input_mode=InputMode.PAGE_REFERENCE,
        raw_references=[0, 1, 0, 2],
    )
    result = engine.run()
    event_types = [e.event_type for e in result.events]

    assert "VIRTUAL_ADDRESS_REFERENCED" in event_types
    assert "PAGE_TABLE_LOOKUP" in event_types
    assert "PAGE_FAULT" in event_types
    assert "FREE_FRAME_SELECTED" in event_types
    assert "PAGE_LOADED" in event_types
    assert "PAGE_HIT" in event_types
    assert "PAGE_EVICTED" in event_types
    assert "ADDRESS_TRANSLATED" in event_types


def test_engine_zero_reference_safeguard():
    """Verify engine handles empty reference list gracefully."""
    engine = VirtualMemorySimulationEngine(
        algorithm=FIFOReplacement(),
        frame_count=3,
        page_size=4096,
        virtual_page_count=16,
        input_mode=InputMode.PAGE_REFERENCE,
        raw_references=[],
    )
    result = engine.run()
    assert result.final_metrics.total_references == 0
    assert result.final_metrics.page_hits == 0
    assert result.final_metrics.page_faults == 0
    assert result.final_metrics.hit_ratio == 0.0
    assert result.final_metrics.fault_ratio == 0.0
    assert len(result.timeline) == 0


def test_engine_determinism():
    """Verify repeated execution produces bitwise identical results."""
    refs = [7, 0, 1, 2, 0, 3, 0, 4, 2, 3]

    res1 = VirtualMemorySimulationEngine(
        algorithm=LRUReplacement(),
        frame_count=3,
        raw_references=refs,
    ).run()

    res2 = VirtualMemorySimulationEngine(
        algorithm=LRUReplacement(),
        frame_count=3,
        raw_references=refs,
    ).run()

    assert res1.to_dict() == res2.to_dict()
