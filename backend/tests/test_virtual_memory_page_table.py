"""Unit tests for SingleLevelPageTable and PageTableEntry models."""

import pytest
from backend.sim_engine.virtual_memory.page_table import SingleLevelPageTable, PageTableEntry


def test_page_table_entry_lifecycle():
    """Verify PageTableEntry state transitions."""
    entry = PageTableEntry(page_number=3)
    assert entry.page_number == 3
    assert entry.is_present is False
    assert entry.frame_number is None
    assert entry.reference_bit == 0
    assert entry.loaded_at_tick is None

    # Map to frame 1 at tick 5
    entry.map_to_frame(frame_number=1, tick=5)
    assert entry.is_present is True
    assert entry.frame_number == 1
    assert entry.reference_bit == 1
    assert entry.loaded_at_tick == 5
    assert entry.last_accessed_tick == 5

    # Touch at tick 8
    entry.touch(tick=8)
    assert entry.last_accessed_tick == 8
    assert entry.loaded_at_tick == 5  # load tick unchanged

    # Unmap
    old_frame = entry.unmap()
    assert old_frame == 1
    assert entry.is_present is False
    assert entry.frame_number is None
    assert entry.reference_bit == 0
    assert entry.loaded_at_tick is None


def test_single_level_page_table_initialization():
    """Verify initial state of page table."""
    pt = SingleLevelPageTable(virtual_page_count=8)
    assert pt.virtual_page_count == 8

    for p in range(8):
        assert pt.is_present(p) is False
        entry = pt.lookup(p)
        assert entry.page_number == p
        assert entry.is_present is False
        assert entry.frame_number is None

    # Invariants should pass initially
    pt.validate_invariants()


def test_single_level_page_table_out_of_bounds():
    """Verify lookup with invalid page numbers raises ValueError."""
    pt = SingleLevelPageTable(virtual_page_count=8)
    with pytest.raises(ValueError, match="out of bounds"):
        pt.lookup(-1)
    with pytest.raises(ValueError, match="out of bounds"):
        pt.lookup(8)


def test_single_level_page_table_mapping_and_unmapping():
    """Verify mapping, touch, and unmapping in page table."""
    pt = SingleLevelPageTable(virtual_page_count=4)
    pt.map_page(page_number=2, frame_number=0, tick=10)
    assert pt.is_present(2) is True
    assert pt.lookup(2).frame_number == 0

    pt.touch_page(page_number=2, tick=15)
    assert pt.lookup(2).last_accessed_tick == 15

    # Invariants pass
    pt.validate_invariants()

    # Unmap
    unmapped = pt.unmap_page(page_number=2)
    assert unmapped == 0
    assert pt.is_present(2) is False
    pt.validate_invariants()


def test_page_table_invariant_duplicate_frame():
    """Verify that mapping two pages to the same frame triggers assertion error."""
    pt = SingleLevelPageTable(virtual_page_count=4)
    pt.map_page(page_number=0, frame_number=1, tick=0)
    # Manually violate invariant
    pt.lookup(1).is_present = True
    pt.lookup(1).frame_number = 1

    with pytest.raises(AssertionError, match="Duplicate frame allocation"):
        pt.validate_invariants()


def test_page_table_invariant_missing_frame():
    """Verify that is_present=True without frame_number triggers assertion error."""
    pt = SingleLevelPageTable(virtual_page_count=4)
    entry = pt.lookup(0)
    entry.is_present = True
    entry.frame_number = None

    with pytest.raises(AssertionError, match="marked present but has frame_number None"):
        pt.validate_invariants()
