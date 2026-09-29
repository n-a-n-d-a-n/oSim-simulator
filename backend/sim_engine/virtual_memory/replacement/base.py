"""Base abstract class for page replacement strategies."""

from abc import ABC, abstractmethod
from typing import List, Tuple, Optional
from backend.sim_engine.virtual_memory.frame import PhysicalFrame
from backend.sim_engine.virtual_memory.state import MemoryReference


class BasePageReplacementAlgorithm(ABC):
    """Abstract base contract for page replacement policies."""

    @property
    @abstractmethod
    def name(self) -> str:
        """Human-readable algorithm identifier."""
        pass

    @abstractmethod
    def select_victim(
        self,
        frames: List[PhysicalFrame],
        step_index: int,
        future_references: List[MemoryReference],
    ) -> Tuple[int, str]:
        """Select victim frame number and provide reason for educational inspection."""
        pass

    def on_page_hit(self, frame: PhysicalFrame, step_index: int) -> None:
        """Hook called when a memory access hits in an existing frame."""
        pass

    def on_page_loaded(self, frame: PhysicalFrame, step_index: int) -> None:
        """Hook called when a page is newly loaded into a physical frame."""
        pass

    @property
    def clock_hand(self) -> Optional[int]:
        """Current clock hand index if this strategy tracks a circular hand."""
        return None

    def get_last_scan_info(
        self,
    ) -> Optional[Tuple[Optional[int], Optional[int], Optional[Tuple[int, ...]]]]:
        """Returns (clock_hand_before, clock_hand_after, frames_scanned) if applicable."""
        return None
