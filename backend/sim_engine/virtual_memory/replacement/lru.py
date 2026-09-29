"""Least Recently Used (LRU) page replacement algorithm."""

from typing import List, Tuple
from backend.sim_engine.virtual_memory.frame import PhysicalFrame
from backend.sim_engine.virtual_memory.state import MemoryReference
from backend.sim_engine.virtual_memory.replacement.base import BasePageReplacementAlgorithm


class LRUReplacement(BasePageReplacementAlgorithm):
    """LRU page replacement: evicts the page with the earliest last_accessed_tick."""

    @property
    def name(self) -> str:
        return "LRU"

    def on_page_hit(self, frame: PhysicalFrame, step_index: int) -> None:
        frame.touch(step_index)

    def on_page_loaded(self, frame: PhysicalFrame, step_index: int) -> None:
        frame.touch(step_index)

    def select_victim(
        self,
        frames: List[PhysicalFrame],
        step_index: int,
        future_references: List[MemoryReference],
    ) -> Tuple[int, str]:
        candidates = [f for f in frames if f.is_occupied]
        if not candidates:
            raise RuntimeError("Cannot select victim: physical memory has no occupied frames")

        victim = min(
            candidates,
            key=lambda f: (
                f.last_accessed_tick if f.last_accessed_tick is not None else float("inf"),
                f.frame_number,
            ),
        )
        reason = (
            f"Page {victim.page_number} in Frame {victim.frame_number} was least recently accessed "
            f"(last access at step {victim.last_accessed_tick})"
        )
        return victim.frame_number, reason
