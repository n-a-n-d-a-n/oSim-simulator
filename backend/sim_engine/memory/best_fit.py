"""Best Fit contiguous memory allocation algorithm."""

from typing import List, Optional
from backend.sim_engine.memory.allocator import BaseAllocator
from backend.sim_engine.memory.block import MemoryBlock


class BestFitAllocator(BaseAllocator):
    """Best Fit memory allocator.
    
    Searches all free blocks across memory and selects the smallest free block
    that is large enough to satisfy the request.
    
    Tie-breaking:
    If multiple free blocks share the same minimum suitable size, the block
    with the lowest start_address is chosen deterministically.
    """

    @property
    def name(self) -> str:
        return "Best Fit"

    def find_free_block_index(
        self,
        blocks: List[MemoryBlock],
        size: int,
        cursor: int,
    ) -> Optional[int]:
        best_idx: Optional[int] = None
        best_size: Optional[int] = None

        for i, block in enumerate(blocks):
            if block.is_free and block.size >= size:
                if best_size is None or block.size < best_size:
                    best_size = block.size
                    best_idx = i
                # Tie-breaking by lowest start_address is naturally achieved
                # because we scan blocks in ascending start_address order
                # and only update on strictly smaller size (< best_size).

        return best_idx
