"""Physical memory frame pool model and management."""

from typing import List, Optional, Tuple
from backend.sim_engine.virtual_memory.state import FrameSnapshot


class PhysicalFrame:
    """Internal mutable representation of a single physical memory frame."""

    def __init__(self, frame_number: int):
        self.frame_number = frame_number
        self.page_number: Optional[int] = None
        self.reference_bit: int = 0
        self.loaded_at_tick: Optional[int] = None
        self.last_accessed_tick: Optional[int] = None

    @property
    def is_occupied(self) -> bool:
        return self.page_number is not None

    def load_page(self, page_number: int, tick: int) -> None:
        """Load virtual page into this frame."""
        self.page_number = page_number
        self.reference_bit = 1
        self.loaded_at_tick = tick
        self.last_accessed_tick = tick

    def clear(self) -> Optional[int]:
        """Evict page currently occupying this frame."""
        old_page = self.page_number
        self.page_number = None
        self.reference_bit = 0
        self.loaded_at_tick = None
        self.last_accessed_tick = None
        return old_page

    def touch(self, tick: int) -> None:
        """Update access timestamp and reference bit upon hit."""
        self.reference_bit = 1
        self.last_accessed_tick = tick

    def to_snapshot(self) -> FrameSnapshot:
        """Export an immutable defensive snapshot."""
        return FrameSnapshot(
            frame_number=self.frame_number,
            is_occupied=self.is_occupied,
            page_number=self.page_number,
            reference_bit=self.reference_bit,
            loaded_at_tick=self.loaded_at_tick,
            last_accessed_tick=self.last_accessed_tick,
        )


class PhysicalMemoryPool:
    """Physical memory manager representing the collection of physical RAM frames."""

    def __init__(self, frame_count: int):
        if frame_count <= 0:
            raise ValueError(f"frame_count must be strictly positive, got {frame_count}")
        self._frame_count = frame_count
        self._frames: List[PhysicalFrame] = [
            PhysicalFrame(frame_idx) for frame_idx in range(frame_count)
        ]

    @property
    def frame_count(self) -> int:
        return self._frame_count

    def get_frame(self, frame_number: int) -> PhysicalFrame:
        if frame_number < 0 or frame_number >= self._frame_count:
            raise ValueError(f"Frame number {frame_number} out of bounds [0, {self._frame_count})")
        return self._frames[frame_number]

    def find_free_frame(self) -> Optional[int]:
        """Find the lowest-indexed free physical frame, or None if RAM is full."""
        for frame in self._frames:
            if not frame.is_occupied:
                return frame.frame_number
        return None

    @property
    def free_frames_count(self) -> int:
        return sum(1 for frame in self._frames if not frame.is_occupied)

    @property
    def resident_pages_count(self) -> int:
        return sum(1 for frame in self._frames if frame.is_occupied)

    def to_snapshots(self) -> Tuple[FrameSnapshot, ...]:
        return tuple(frame.to_snapshot() for frame in self._frames)
