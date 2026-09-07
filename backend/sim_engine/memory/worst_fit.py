"""Worst Fit contiguous memory allocation algorithm."""

from typing import List, Optional
from backend.sim_engine.memory.allocator import BaseAllocator
from backend.sim_engine.memory.block import MemoryBlock


class WorstFitAllocator(BaseAllocator):
    """Worst Fit memory allocator.
    
    Searches all free blocks across memory and selects the largest available
    free block to satisfy the request.
    
    Tie-breaking:
    If multiple free blocks share the same largest size, the block with the
    lowest start_address is chosen deterministically.
    """

    @property
    def name(self) -> str:
        return "Worst Fit"

    def find_free_block_index(
        self,
        blocks: List[MemoryBlock],
        size: int,
        cursor: int,
    ) -> Optional[int]:
        worst_idx: Optional[int] = None
        worst_size: Optional[int] = None

        for i, block in enumerate(blocks):
            if block.is_free and block.size >= size:
                if worst_size is None or block.size > worst_size:
                    worst_size = block.size
                    worst_idx = i
                # Tie-breaking by lowest start_address is preserved
                # by strictly checking (> worst_size).

        return worst_idx
