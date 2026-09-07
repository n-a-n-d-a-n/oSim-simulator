"""Next Fit contiguous memory allocation algorithm.

Next Fit Cursor Semantics (Clarification 1):
- `next_fit_cursor` is an integer memory address (initial = 0).
- The cursor represents the exact memory address where the next search begins.
- After a successful allocation [start, end), the cursor advances to `end`.
- The search proceeds from the cursor forward to the end of memory, wrapping
  around to address 0 if necessary, scanning up to the cursor address.
- The cursor is strictly preserved across deallocations.
- Spanning block behavior:
  When a free block [b.start, b.end) spans the cursor (b.start <= cursor < b.end):
  1. Forward pass: The allocator evaluates the contiguous free space starting at
     `cursor` to the end of the block, i.e., [cursor, b.end) with size (b.end - cursor).
     If (b.end - cursor) >= requested_size, the block is allocated at [cursor, cursor + size),
     leaving [b.start, cursor) as a leading free block and [cursor + size, b.end) as an
     optional trailing free block.
  2. If (b.end - cursor) < requested_size, the forward search continues past this block.
  3. Wrap-around pass: When the search wraps around from address 0 back toward `cursor`,
     the portion [b.start, cursor) is evaluated. If (cursor - b.start) >= requested_size,
     allocation succeeds at [b.start, b.start + size).
"""

from typing import List, Optional
from backend.sim_engine.memory.allocator import BaseAllocator, AllocationOutcome
from backend.sim_engine.memory.block import MemoryBlock
from backend.sim_engine.memory.event import MemoryEventType, create_memory_event
from backend.sim_engine.core.event import SimulationEvent


class NextFitAllocator(BaseAllocator):
    """Next Fit memory allocator with integer address cursor and wrap-around."""

    @property
    def name(self) -> str:
        return "Next Fit"

    def find_free_block_index(
        self,
        blocks: List[MemoryBlock],
        size: int,
        cursor: int,
    ) -> Optional[int]:
        """Lookup free block index considering cursor position and wrap-around."""
        # 1. Forward scan from cursor
        for i, b in enumerate(blocks):
            if b.end_address > cursor and b.is_free:
                available_from_cursor = b.end_address - max(cursor, b.start_address)
                if available_from_cursor >= size:
                    return i

        # 2. Wrap-around scan from beginning up to cursor
        for i, b in enumerate(blocks):
            if b.start_address >= cursor:
                break
            if b.is_free:
                available = min(cursor, b.end_address) - b.start_address
                if available >= size:
                    return i

        return None

    def allocate(
        self,
        blocks: List[MemoryBlock],
        request_id: str,
        size: int,
        cursor: int,
        tick: int,
    ) -> AllocationOutcome:
        """Perform Next Fit allocation with address-accurate cursor and spanning block handling."""
        events: List[SimulationEvent] = [
            create_memory_event(
                tick=tick,
                event_type=MemoryEventType.MEMORY_ALLOCATION_REQUESTED,
                description=f"Next Fit allocation requested for '{request_id}' (size={size}) from cursor={cursor}.",
                details={"request_id": request_id, "size": size, "cursor": cursor},
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

        # Normalize cursor if out of bounds (e.g. at end of memory)
        total_mem = sum(b.size for b in blocks)
        normalized_cursor = cursor if (0 <= cursor < total_mem) else 0

        # Phase 1: Forward scan from normalized_cursor to end of memory
        chosen_idx: Optional[int] = None
        alloc_start: Optional[int] = None

        for i, b in enumerate(blocks):
            if b.end_address > normalized_cursor and b.is_free:
                cand_start = max(normalized_cursor, b.start_address)
                if b.end_address - cand_start >= size:
                    chosen_idx = i
                    alloc_start = cand_start
                    break

        # Phase 2: Wrap-around from address 0 up to normalized_cursor
        if chosen_idx is None:
            for i, b in enumerate(blocks):
                if b.start_address >= normalized_cursor:
                    break
                if b.is_free:
                    cand_start = b.start_address
                    cand_end = min(normalized_cursor, b.end_address)
                    if cand_end - cand_start >= size:
                        chosen_idx = i
                        alloc_start = cand_start
                        break

        # If no block found, report failure and external fragmentation
        if chosen_idx is None or alloc_start is None:
            free_blocks = [b for b in blocks if b.is_free]
            total_free = sum(b.size for b in free_blocks)
            largest_free = max((b.size for b in free_blocks), default=0)

            if total_free >= size:
                reason = (
                    f"External fragmentation: Total free memory is {total_free} units, "
                    f"but no contiguous free block >= {size} units was found from cursor {cursor} (wrap-around)."
                )
            else:
                reason = f"Insufficient total memory: Total free memory is {total_free} units (needed {size})."

            events.append(
                create_memory_event(
                    tick=tick,
                    event_type=MemoryEventType.MEMORY_ALLOCATION_FAILED,
                    description=f"Next Fit allocation failed for '{request_id}': {reason}",
                    details={
                        "request_id": request_id,
                        "size": size,
                        "cursor": cursor,
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

        # We found a suitable block at chosen_idx with allocation starting at alloc_start
        target_block = blocks[chosen_idx]
        alloc_end = alloc_start + size
        new_blocks: List[MemoryBlock] = []

        # 1. Leading free block if alloc_start > target_block.start_address
        leading_size = alloc_start - target_block.start_address
        if leading_size > 0:
            new_blocks.append(
                MemoryBlock(
                    start_address=target_block.start_address,
                    size=leading_size,
                    is_free=True,
                    owner_id=None,
                )
            )

        # 2. Allocated block
        allocated_block = MemoryBlock(
            start_address=alloc_start,
            size=size,
            is_free=False,
            owner_id=request_id,
        )
        new_blocks.append(allocated_block)

        # 3. Trailing free block if alloc_end < target_block.end_address
        trailing_size = target_block.end_address - alloc_end
        if trailing_size > 0:
            new_blocks.append(
                MemoryBlock(
                    start_address=alloc_end,
                    size=trailing_size,
                    is_free=True,
                    owner_id=None,
                )
            )

        # Replace target_block in blocks list with new_blocks
        blocks[chosen_idx : chosen_idx + 1] = new_blocks

        # Advance cursor to end of allocated block
        new_cursor = alloc_end % total_mem

        # Emit split event if block was divided
        if len(new_blocks) > 1:
            events.append(
                create_memory_event(
                    tick=tick,
                    event_type=MemoryEventType.MEMORY_BLOCK_SPLIT,
                    description=(
                        f"Free block [{target_block.start_address}, {target_block.end_address}) split for Next Fit: "
                        f"allocated [{allocated_block.start_address}, {allocated_block.end_address})."
                    ),
                    details={
                        "original_start": target_block.start_address,
                        "original_size": target_block.size,
                        "allocated_start": allocated_block.start_address,
                        "allocated_size": size,
                    },
                )
            )

        events.append(
            create_memory_event(
                tick=tick,
                event_type=MemoryEventType.MEMORY_ALLOCATED,
                description=(
                    f"Process '{request_id}' allocated {size} units at address "
                    f"[{allocated_block.start_address}, {allocated_block.end_address}). "
                    f"Next Fit cursor advanced to {new_cursor}."
                ),
                details={
                    "request_id": request_id,
                    "start_address": allocated_block.start_address,
                    "end_address": allocated_block.end_address,
                    "size": size,
                    "new_cursor": new_cursor,
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
