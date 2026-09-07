"""Base allocator interface and allocation outcome models."""

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import List, Optional
from backend.sim_engine.core.event import SimulationEvent
from backend.sim_engine.memory.block import MemoryBlock


@dataclass(frozen=True)
class AllocationOutcome:
    """Outcome of an allocation attempt."""
    success: bool
    allocated_start_address: Optional[int]
    allocated_size: Optional[int]
    new_cursor: int  # Next Fit cursor address after this operation
    events: List[SimulationEvent]
    failure_reason: Optional[str] = None


@dataclass(frozen=True)
class DeallocationOutcome:
    """Outcome of a deallocation attempt."""
    success: bool
    freed_start_address: Optional[int]
    freed_size: Optional[int]
    events: List[SimulationEvent]
    failure_reason: Optional[str] = None


class BaseAllocator(ABC):
    """Abstract base class for contiguous memory allocation algorithms."""

    @property
    @abstractmethod
    def name(self) -> str:
        """Human-readable algorithm name."""
        pass

    @abstractmethod
    def find_free_block_index(
        self,
        blocks: List[MemoryBlock],
        size: int,
        cursor: int,
    ) -> Optional[int]:
        """Find the index of the free block to allocate from.
        
        Args:
            blocks: Ordered list of memory blocks.
            size: Size of requested allocation.
            cursor: Current Next Fit cursor (integer memory address).
            
        Returns:
            Index in blocks list if suitable block found, else None.
        """
        pass

    def allocate(
        self,
        blocks: List[MemoryBlock],
        request_id: str,
        size: int,
        cursor: int,
        tick: int,
    ) -> AllocationOutcome:
        """Attempt to allocate contiguous memory for request_id.
        
        Performs block lookup, splitting, and event emission.
        """
        from backend.sim_engine.memory.event import MemoryEventType, create_memory_event

        events: List[SimulationEvent] = [
            create_memory_event(
                tick=tick,
                event_type=MemoryEventType.MEMORY_ALLOCATION_REQUESTED,
                description=f"Allocation requested for '{request_id}' of size {size}.",
                details={"request_id": request_id, "size": size},
            )
        ]

        if size <= 0:
            events.append(
                create_memory_event(
                    tick=tick,
                    event_type=MemoryEventType.MEMORY_ALLOCATION_FAILED,
                    description=f"Allocation failed for '{request_id}': Requested size must be > 0.",
                    details={"request_id": request_id, "size": size, "reason": "Size <= 0"},
                )
            )
            return AllocationOutcome(
                success=False,
                allocated_start_address=None,
                allocated_size=None,
                new_cursor=cursor,
                events=events,
                failure_reason="Requested size must be > 0.",
            )

        # Check if request_id already owns allocated memory
        if any(not b.is_free and b.owner_id == request_id for b in blocks):
            reason = f"Duplicate request ID: '{request_id}' is already allocated in memory."
            events.append(
                create_memory_event(
                    tick=tick,
                    event_type=MemoryEventType.MEMORY_ALLOCATION_FAILED,
                    description=f"Allocation failed for '{request_id}': {reason}",
                    details={"request_id": request_id, "size": size, "reason": reason},
                )
            )
            return AllocationOutcome(
                success=False,
                allocated_start_address=None,
                allocated_size=None,
                new_cursor=cursor,
                events=events,
                failure_reason=reason,
            )

        target_idx = self.find_free_block_index(blocks, size, cursor)

        if target_idx is None:
            # Analyze external fragmentation for educational explanation
            free_blocks = [b for b in blocks if b.is_free]
            total_free = sum(b.size for b in free_blocks)
            largest_free = max((b.size for b in free_blocks), default=0)

            if total_free >= size:
                reason = (
                    f"External fragmentation: Total free memory is {total_free} units, "
                    f"but largest contiguous free block is only {largest_free} units (needed {size})."
                )
            else:
                reason = (
                    f"Insufficient total memory: Total free memory is {total_free} units "
                    f"(needed {size})."
                )

            events.append(
                create_memory_event(
                    tick=tick,
                    event_type=MemoryEventType.MEMORY_ALLOCATION_FAILED,
                    description=f"Allocation failed for '{request_id}': {reason}",
                    details={
                        "request_id": request_id,
                        "size": size,
                        "total_free": total_free,
                        "largest_free": largest_free,
                        "reason": reason,
                    },
                )
            )
            return AllocationOutcome(
                success=False,
                allocated_start_address=None,
                allocated_size=None,
                new_cursor=cursor,
                events=events,
                failure_reason=reason,
            )

        target_block = blocks[target_idx]
        allocated_block, remainder_block = target_block.split(size, request_id)

        # Update blocks list
        if remainder_block is not None:
            blocks[target_idx] = allocated_block
            blocks.insert(target_idx + 1, remainder_block)
            events.append(
                create_memory_event(
                    tick=tick,
                    event_type=MemoryEventType.MEMORY_BLOCK_SPLIT,
                    description=(
                        f"Free block [{target_block.start_address}, {target_block.end_address}) "
                        f"split into allocated [{allocated_block.start_address}, {allocated_block.end_address}) "
                        f"and free remainder [{remainder_block.start_address}, {remainder_block.end_address})."
                    ),
                    details={
                        "original_start": target_block.start_address,
                        "original_size": target_block.size,
                        "allocated_size": size,
                        "remainder_size": remainder_block.size,
                    },
                )
            )
        else:
            blocks[target_idx] = allocated_block

        # Next Fit cursor advances to end of allocated block
        new_cursor = allocated_block.end_address

        events.append(
            create_memory_event(
                tick=tick,
                event_type=MemoryEventType.MEMORY_ALLOCATED,
                description=(
                    f"Process '{request_id}' allocated {size} units at address "
                    f"[{allocated_block.start_address}, {allocated_block.end_address})."
                ),
                details={
                    "request_id": request_id,
                    "start_address": allocated_block.start_address,
                    "end_address": allocated_block.end_address,
                    "size": size,
                },
            )
        )

        return AllocationOutcome(
            success=True,
            allocated_start_address=allocated_block.start_address,
            allocated_size=size,
            new_cursor=new_cursor,
            events=events,
            failure_reason=None,
        )

    def deallocate(
        self,
        blocks: List[MemoryBlock],
        request_id: str,
        tick: int,
    ) -> DeallocationOutcome:
        """Deallocate block owned by request_id and coalesce adjacent free blocks.
        
        Invariants strictly maintained:
        - Blocks remain contiguous and ordered by start_address.
        - No two adjacent blocks remain free after deallocation.
        """
        from backend.sim_engine.memory.event import MemoryEventType, create_memory_event

        events: List[SimulationEvent] = []

        target_idx: Optional[int] = None
        for i, b in enumerate(blocks):
            if not b.is_free and b.owner_id == request_id:
                target_idx = i
                break

        if target_idx is None:
            reason = f"No allocated memory block found with owner ID '{request_id}'."
            return DeallocationOutcome(
                success=False,
                freed_start_address=None,
                freed_size=None,
                events=events,
                failure_reason=reason,
            )

        target_block = blocks[target_idx]
        freed_start = target_block.start_address
        freed_size = target_block.size
        freed_end = target_block.end_address

        # Mark block as free
        target_block.is_free = True
        target_block.owner_id = None

        events.append(
            create_memory_event(
                tick=tick,
                event_type=MemoryEventType.MEMORY_DEALLOCATED,
                description=(
                    f"Process '{request_id}' deallocated from address [{freed_start}, {freed_end}) "
                    f"({freed_size} units released)."
                ),
                details={
                    "request_id": request_id,
                    "start_address": freed_start,
                    "end_address": freed_end,
                    "size": freed_size,
                },
            )
        )

        # Coalesce adjacent free blocks
        # First check successor (target_idx + 1)
        if target_idx + 1 < len(blocks) and blocks[target_idx + 1].is_free:
            next_block = blocks.pop(target_idx + 1)
            target_block.size += next_block.size
            events.append(
                create_memory_event(
                    tick=tick,
                    event_type=MemoryEventType.MEMORY_BLOCK_MERGED,
                    description=(
                        f"Merged adjacent free blocks into [{target_block.start_address}, {target_block.end_address}) "
                        f"(total size {target_block.size})."
                    ),
                    details={
                        "merged_start": target_block.start_address,
                        "new_size": target_block.size,
                    },
                )
            )

        # Next check predecessor (target_idx - 1)
        if target_idx > 0 and blocks[target_idx - 1].is_free:
            prev_block = blocks[target_idx - 1]
            prev_block.size += target_block.size
            blocks.pop(target_idx)
            events.append(
                create_memory_event(
                    tick=tick,
                    event_type=MemoryEventType.MEMORY_BLOCK_MERGED,
                    description=(
                        f"Merged adjacent free blocks into [{prev_block.start_address}, {prev_block.end_address}) "
                        f"(total size {prev_block.size})."
                    ),
                    details={
                        "merged_start": prev_block.start_address,
                        "new_size": prev_block.size,
                    },
                )
            )

        return DeallocationOutcome(
            success=True,
            freed_start_address=freed_start,
            freed_size=freed_size,
            events=events,
            failure_reason=None,
        )
