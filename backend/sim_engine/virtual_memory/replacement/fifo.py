"""First-In, First-Out (FIFO) page replacement algorithm."""

from typing import List, Tuple
from backend.sim_engine.virtual_memory.frame import PhysicalFrame
from backend.sim_engine.virtual_memory.state import MemoryReference
from backend.sim_engine.virtual_memory.replacement.base import BasePageReplacementAlgorithm


class FIFOReplacement(BasePageReplacementAlgorithm):
    """FIFO page replacement: evicts the page that has been resident the longest."""

    @property
    def name(self) -> str:
        return "FIFO"

    def select_victim(
        self,
        frames: List[PhysicalFrame],
        step_index: int,
        future_references: List[MemoryReference],
    ) -> Tuple[int, str]:
        # Evict page with the earliest loaded_at_tick; tie-break by lowest frame_number
        candidates = [f for f in frames if f.is_occupied]
        if not candidates:
            raise RuntimeError("Cannot select victim: physical memory has no occupied frames")

        victim = min(
            candidates,
            key=lambda f: (
                f.loaded_at_tick if f.loaded_at_tick is not None else float("inf"),
                f.frame_number,
            ),
        )
        reason = (
            f"Page {victim.page_number} in Frame {victim.frame_number} has been resident longest "
            f"(loaded at step {victim.loaded_at_tick})"
        )
        return victim.frame_number, reason
