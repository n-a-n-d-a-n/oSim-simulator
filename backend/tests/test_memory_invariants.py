"""Invariant verification tests for contiguous memory allocation."""

import pytest
from backend.sim_engine.memory import (
    FirstFitAllocator,
    BestFitAllocator,
    WorstFitAllocator,
    NextFitAllocator,
    MemorySimulationEngine,
    ALL_MEMORY_PRESETS,
)


@pytest.mark.parametrize("allocator_cls", [FirstFitAllocator, BestFitAllocator, WorstFitAllocator, NextFitAllocator])
@pytest.mark.parametrize("preset", ALL_MEMORY_PRESETS)
def test_all_invariants_across_presets_and_allocators(allocator_cls, preset):
    """Verify core physical invariants hold at every discrete tick across all presets and allocators."""
    allocator = allocator_cls()
    engine = MemorySimulationEngine(
        allocator=allocator,
        memory_size=preset.memory_size,
        operations=preset.operations,
    )
    result = engine.run()

    for state in result.timeline:
        blocks = state.blocks
        assert len(blocks) > 0

        # Invariant 1: Address coverage
        assert blocks[0].start_address == 0
        assert blocks[-1].end_address == preset.memory_size

        # Invariant 2 & 3: Contiguity and No Overlap
        for i in range(len(blocks) - 1):
            assert blocks[i].end_address == blocks[i + 1].start_address
            assert blocks[i].size == blocks[i].end_address - blocks[i].start_address

        # Invariant 4: Conservation of Memory
        total_block_size = sum(b.size for b in blocks)
        assert total_block_size == preset.memory_size
        assert state.metrics.used_memory + state.metrics.free_memory == preset.memory_size

        # Invariant 5: Canonical coalescing (No two adjacent free blocks)
        for i in range(len(blocks) - 1):
            assert not (blocks[i].is_free and blocks[i + 1].is_free)

        # Invariant 6: Metrics Consistency
        free_blocks = [b for b in blocks if b.is_free]
        expected_largest_free = max((b.size for b in free_blocks), default=0)
        assert state.metrics.largest_free_block == expected_largest_free

        expected_ext_frag = max(0, state.metrics.free_memory - expected_largest_free)
        assert state.metrics.external_fragmentation == expected_ext_frag

        # Invariant 7: Internal fragmentation is 0
        assert state.metrics.internal_fragmentation == 0
