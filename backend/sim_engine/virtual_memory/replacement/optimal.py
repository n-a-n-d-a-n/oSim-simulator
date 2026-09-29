"""Optimal (Belady's MIN) page replacement algorithm (Theoretical Benchmark)."""

from typing import List, Tuple, Dict, Optional
from backend.sim_engine.virtual_memory.frame import PhysicalFrame
from backend.sim_engine.virtual_memory.state import MemoryReference
from backend.sim_engine.virtual_memory.replacement.base import BasePageReplacementAlgorithm


class OptimalReplacement(BasePageReplacementAlgorithm):
    """Optimal page replacement algorithm (Belady's MIN).
    
    NOTE: Optimal replacement is a theoretical offline benchmark that requires knowing
    future memory references in advance. Practical online operating systems cannot know
    future references and therefore cannot implement true Optimal replacement in production.
    """

    @property
    def name(self) -> str:
        return "OPTIMAL"

    def select_victim(
        self,
        frames: List[PhysicalFrame],
        step_index: int,
        future_references: List[MemoryReference],
    ) -> Tuple[int, str]:
        candidates = [f for f in frames if f.is_occupied]
        if not candidates:
            raise RuntimeError("Cannot select victim: physical memory has no occupied frames")

        # Find the earliest future reference step for each resident page
        next_use: Dict[int, Optional[int]] = {}
        for frame in candidates:
            page = frame.page_number
            next_idx: Optional[int] = None
            for ref in future_references:
                if ref.page_number == page:
                    next_idx = ref.reference_index
                    break
            next_use[frame.frame_number] = next_idx

        # Sort criteria:
        # 1. Unused pages (next_idx is None, represented as infinity)
        # 2. Page whose next use is farthest in the future
        # 3. Deterministic tie-breaker: lowest page number, then lowest frame number
        def sort_key(f: PhysicalFrame):
            idx = next_use[f.frame_number]
            distance = float("inf") if idx is None else idx
            # We want MAXIMUM distance first, so invert for min() selection
            # or sort in reverse. To use min(): key = (-distance, page_number, frame_number)
            return (-distance, f.page_number if f.page_number is not None else 0, f.frame_number)

        victim = min(candidates, key=sort_key)
        victim_next = next_use[victim.frame_number]
        if victim_next is None:
            reason = (
                f"Page {victim.page_number} in Frame {victim.frame_number} will never be referenced again "
                f"in the remaining sequence"
            )
        else:
            reason = (
                f"Page {victim.page_number} in Frame {victim.frame_number} has the farthest next reference "
                f"(at future step {victim_next})"
            )

        return victim.frame_number, reason
