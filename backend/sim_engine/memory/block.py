"""Memory block representation for contiguous memory allocation.

Address Convention:
- Memory addresses range from 0 to N - 1, where N = memory_size.
- A block spans the half-open interval [start_address, end_address).
- size = end_address - start_address.
- For example, [0, 100) covers addresses 0 through 99 with size 100.
"""

from dataclasses import dataclass
from typing import Optional, Dict, Any, Tuple


@dataclass(frozen=True)
class MemoryBlockSnapshot:
    """Immutable snapshot of a memory block at a discrete simulation tick."""
    start_address: int
    size: int
    end_address: int
    is_free: bool
    owner_id: Optional[str]

    def to_dict(self) -> Dict[str, Any]:
        return {
            "start_address": self.start_address,
            "size": self.size,
            "end_address": self.end_address,
            "is_free": self.is_free,
            "owner_id": self.owner_id,
        }


class MemoryBlock:
    """Mutable contiguous memory block used during discrete-time simulation execution."""

    def __init__(
        self,
        start_address: int,
        size: int,
        is_free: bool = True,
        owner_id: Optional[str] = None,
    ):
        if start_address < 0:
            raise ValueError(f"start_address must be non-negative, got {start_address}")
        if size <= 0:
            raise ValueError(f"size must be strictly positive, got {size}")
        if not is_free and not owner_id:
            raise ValueError("Allocated block must specify owner_id")
        if is_free and owner_id is not None:
            raise ValueError("Free block cannot have an owner_id")

        self.start_address = start_address
        self.size = size
        self.is_free = is_free
        self.owner_id = owner_id

    @property
    def end_address(self) -> int:
        return self.start_address + self.size

    def to_snapshot(self) -> MemoryBlockSnapshot:
        return MemoryBlockSnapshot(
            start_address=self.start_address,
            size=self.size,
            end_address=self.end_address,
            is_free=self.is_free,
            owner_id=self.owner_id,
        )

    def split(self, allocated_size: int, owner_id: str) -> Tuple["MemoryBlock", Optional["MemoryBlock"]]:
        """Split this free block into an allocated block and an optional remainder free block.
        
        Args:
            allocated_size: Size of the allocation request.
            owner_id: Process or request ID acquiring the block.
            
        Returns:
            Tuple of (allocated_block, remaining_free_block_or_None).
        """
        if not self.is_free:
            raise ValueError("Cannot split an already allocated block")
        if allocated_size <= 0:
            raise ValueError("allocated_size must be > 0")
        if allocated_size > self.size:
            raise ValueError(f"Cannot allocate {allocated_size} from block of size {self.size}")

        allocated_block = MemoryBlock(
            start_address=self.start_address,
            size=allocated_size,
            is_free=False,
            owner_id=owner_id,
        )

        remainder_size = self.size - allocated_size
        remainder_block: Optional[MemoryBlock] = None
        if remainder_size > 0:
            remainder_block = MemoryBlock(
                start_address=self.start_address + allocated_size,
                size=remainder_size,
                is_free=True,
                owner_id=None,
            )

        return allocated_block, remainder_block

    def __repr__(self) -> str:
        status = "FREE" if self.is_free else f"ALLOCATED({self.owner_id})"
        return f"MemoryBlock([{self.start_address}, {self.end_address}), size={self.size}, {status})"
