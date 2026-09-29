"""Deterministic single-level page table implementation."""

from typing import List, Optional, Tuple, Dict
from backend.sim_engine.virtual_memory.state import PageTableEntrySnapshot


class PageTableEntry:
    """Internal mutable page table entry used during simulation execution."""

    def __init__(self, page_number: int):
        self.page_number = page_number
        self.is_present = False  # True = resident in physical memory; False = not resident
        self.frame_number: Optional[int] = None
        self.reference_bit: int = 0
        self.loaded_at_tick: Optional[int] = None
        self.last_accessed_tick: Optional[int] = None

    def map_to_frame(self, frame_number: int, tick: int) -> None:
        """Map this page to a physical frame and mark as present."""
        self.is_present = True
        self.frame_number = frame_number
        self.reference_bit = 1
        self.loaded_at_tick = tick
        self.last_accessed_tick = tick

    def unmap(self) -> Optional[int]:
        """Evict this page from physical memory and mark as not present."""
        old_frame = self.frame_number
        self.is_present = False
        self.frame_number = None
        self.reference_bit = 0
        self.loaded_at_tick = None
        return old_frame

    def touch(self, tick: int) -> None:
        """Update access timestamp and reference bit upon page hit."""
        self.reference_bit = 1
        self.last_accessed_tick = tick

    def to_snapshot(self) -> PageTableEntrySnapshot:
        """Export an immutable, defensive snapshot."""
        return PageTableEntrySnapshot(
            page_number=self.page_number,
            is_present=self.is_present,
            frame_number=self.frame_number,
            reference_bit=self.reference_bit,
            loaded_at_tick=self.loaded_at_tick,
            last_accessed_tick=self.last_accessed_tick,
        )


class SingleLevelPageTable:
    """Deterministic single-level page table mapping virtual pages to physical frames."""

    def __init__(self, virtual_page_count: int):
        if virtual_page_count <= 0:
            raise ValueError(f"virtual_page_count must be strictly positive, got {virtual_page_count}")
        self._virtual_page_count = virtual_page_count
        self._entries: List[PageTableEntry] = [
            PageTableEntry(page_num) for page_num in range(virtual_page_count)
        ]

    @property
    def virtual_page_count(self) -> int:
        return self._virtual_page_count

    def lookup(self, page_number: int) -> PageTableEntry:
        """Retrieve entry for the given virtual page number."""
        if page_number < 0 or page_number >= self._virtual_page_count:
            raise ValueError(
                f"Page number {page_number} is out of bounds [0, {self._virtual_page_count})"
            )
        return self._entries[page_number]

    def is_present(self, page_number: int) -> bool:
        """Check if virtual page is currently resident in physical memory."""
        return self.lookup(page_number).is_present

    def map_page(self, page_number: int, frame_number: int, tick: int) -> None:
        """Map page to frame."""
        entry = self.lookup(page_number)
        entry.map_to_frame(frame_number, tick)

    def unmap_page(self, page_number: int) -> Optional[int]:
        """Evict page from physical memory."""
        entry = self.lookup(page_number)
        return entry.unmap()

    def touch_page(self, page_number: int, tick: int) -> None:
        """Touch page upon memory access."""
        entry = self.lookup(page_number)
        if not entry.is_present:
            raise RuntimeError(f"Cannot touch non-resident page {page_number}")
        entry.touch(tick)

    def to_snapshots(self) -> Tuple[PageTableEntrySnapshot, ...]:
        """Generate immutable tuple of page table entry snapshots."""
        return tuple(entry.to_snapshot() for entry in self._entries)

    def validate_invariants(self) -> None:
        """Validate consistency invariants of the page table."""
        allocated_frames: Dict[int, int] = {}
        for entry in self._entries:
            if entry.is_present:
                if entry.frame_number is None:
                    raise AssertionError(
                        f"Page {entry.page_number} marked present but has frame_number None"
                    )
                if entry.frame_number in allocated_frames:
                    other_page = allocated_frames[entry.frame_number]
                    raise AssertionError(
                        f"Duplicate frame allocation: Frame {entry.frame_number} mapped to both "
                        f"Page {other_page} and Page {entry.page_number}"
                    )
                allocated_frames[entry.frame_number] = entry.page_number
            else:
                if entry.frame_number is not None:
                    raise AssertionError(
                        f"Page {entry.page_number} marked not present but has frame {entry.frame_number}"
                    )
