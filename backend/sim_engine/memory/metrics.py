"""Memory metrics calculation and snapshot model for OSim Phase 3."""

from dataclasses import dataclass
from typing import List, Dict, Any
from backend.sim_engine.memory.block import MemoryBlock


@dataclass(frozen=True)
class MemoryMetricsSnapshot:
    """Immutable snapshot of memory utilization and fragmentation metrics."""
    total_memory: int
    used_memory: int
    free_memory: int
    allocated_block_count: int
    free_block_count: int
    largest_free_block: int
    external_fragmentation: int
    external_fragmentation_ratio: float
    internal_fragmentation: int  # 0 in variable-sized contiguous allocation
    allocation_success_count: int
    allocation_failure_count: int

    def to_dict(self, decimal_places: int = 4) -> Dict[str, Any]:
        return {
            "total_memory": self.total_memory,
            "used_memory": self.used_memory,
            "free_memory": self.free_memory,
            "allocated_block_count": self.allocated_block_count,
            "free_block_count": self.free_block_count,
            "largest_free_block": self.largest_free_block,
            "external_fragmentation": self.external_fragmentation,
            "external_fragmentation_ratio": round(self.external_fragmentation_ratio, decimal_places),
            "internal_fragmentation": self.internal_fragmentation,
            "allocation_success_count": self.allocation_success_count,
            "allocation_failure_count": self.allocation_failure_count,
        }


def compute_memory_metrics(
    total_memory: int,
    blocks: List[MemoryBlock],
    success_count: int = 0,
    failure_count: int = 0,
) -> MemoryMetricsSnapshot:
    """Compute exact memory and fragmentation metrics from the current block state.
    
    Fragmentation Definitions:
    - External Fragmentation = total_free_memory - largest_free_block
      Represents free memory that cannot be allocated to a request of size > largest_free_block
      despite sufficient total free memory.
    - External Fragmentation Ratio = external_fragmentation / total_free_memory
      (Defined as 0.0 when total_free_memory == 0).
    - Internal Fragmentation = 0
      In variable-sized contiguous partitioning without partition padding/rounding,
      allocated blocks receive exactly the requested size. Remainder of split blocks
      re-enters the free pool, contributing to external fragmentation rather than internal.
    """
    used_memory = sum(b.size for b in blocks if not b.is_free)
    free_blocks = [b for b in blocks if b.is_free]
    free_memory = sum(b.size for b in free_blocks)
    allocated_count = len(blocks) - len(free_blocks)
    free_count = len(free_blocks)
    largest_free = max((b.size for b in free_blocks), default=0)

    ext_frag = max(0, free_memory - largest_free)
    ext_frag_ratio = (ext_frag / free_memory) if free_memory > 0 else 0.0

    return MemoryMetricsSnapshot(
        total_memory=total_memory,
        used_memory=used_memory,
        free_memory=free_memory,
        allocated_block_count=allocated_count,
        free_block_count=free_count,
        largest_free_block=largest_free,
        external_fragmentation=ext_frag,
        external_fragmentation_ratio=ext_frag_ratio,
        internal_fragmentation=0,
        allocation_success_count=success_count,
        allocation_failure_count=failure_count,
    )
