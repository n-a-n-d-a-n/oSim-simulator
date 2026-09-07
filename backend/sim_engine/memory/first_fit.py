"""First Fit contiguous memory allocation algorithm."""

from typing import List, Optional
from backend.sim_engine.memory.allocator import BaseAllocator
from backend.sim_engine.memory.block import MemoryBlock


class FirstFitAllocator(BaseAllocator):
    """First Fit memory allocator.
    
    Scans memory blocks in address order starting from address 0.
    Selects the first free block that is large enough to satisfy the request.
    """

    @property
    def name(self) -> str:
        return "First Fit"

    def find_free_block_index(
        self,
        blocks: List[MemoryBlock],
        size: int,
        cursor: int,
    ) -> Optional[int]:
        for i, block in enumerate(blocks):
            if block.is_free and block.size >= size:
                return i
        return None
