"""Second-Chance (Clock) page replacement algorithm."""

from typing import List, Tuple, Optional
from backend.sim_engine.virtual_memory.frame import PhysicalFrame
from backend.sim_engine.virtual_memory.state import MemoryReference
from backend.sim_engine.virtual_memory.replacement.base import BasePageReplacementAlgorithm


class ClockReplacement(BasePageReplacementAlgorithm):
    """Second-Chance / Clock page replacement algorithm with persistent circular hand."""

    def __init__(self, initial_hand: int = 0):
        self._clock_hand: int = initial_hand
        self._clock_hand_before: Optional[int] = None
        self._clock_hand_after: Optional[int] = None
        self._frames_scanned: List[int] = []

    @property
    def name(self) -> str:
        return "CLOCK"

    @property
    def clock_hand(self) -> Optional[int]:
        return self._clock_hand

    def get_last_scan_info(
        self,
    ) -> Optional[Tuple[Optional[int], Optional[int], Optional[Tuple[int, ...]]]]:
        return (
            self._clock_hand_before,
            self._clock_hand_after,
            tuple(self._frames_scanned) if self._frames_scanned else None,
        )

    def on_page_hit(self, frame: PhysicalFrame, step_index: int) -> None:
        frame.reference_bit = 1

    def on_page_loaded(self, frame: PhysicalFrame, step_index: int) -> None:
        frame.reference_bit = 1

    def select_victim(
        self,
        frames: List[PhysicalFrame],
        step_index: int,
        future_references: List[MemoryReference],
    ) -> Tuple[int, str]:
        total_frames = len(frames)
        if total_frames == 0:
            raise RuntimeError("Cannot select victim: no frames in physical memory")

        self._clock_hand_before = self._clock_hand
        self._frames_scanned = []

        # Circular scan with second-chance reference bit clearing
        # At most 2 full revolutions are needed
        scanned_count = 0
        max_scan = total_frames * 2

        while scanned_count < max_scan:
            current_frame_idx = self._clock_hand
            self._frames_scanned.append(current_frame_idx)
            frame = frames[current_frame_idx]

            if frame.reference_bit == 0:
                # Victim found
                victim_frame_idx = current_frame_idx
                # Advance clock hand to next frame for subsequent replacement
                self._clock_hand = (current_frame_idx + 1) % total_frames
                self._clock_hand_after = self._clock_hand

                reason = (
                    f"Clock hand inspected frame {victim_frame_idx} with reference_bit=0. "
                    f"Evicting Page {frame.page_number} and advancing hand to Frame {self._clock_hand}."
                )
                return victim_frame_idx, reason
            else:
                # Give second chance: clear bit to 0 and advance hand
                frame.reference_bit = 0
                self._clock_hand = (self._clock_hand + 1) % total_frames
                scanned_count += 1

        # Fallback safeguard (should not occur since bits are cleared on first pass)
        victim_frame_idx = self._clock_hand
        self._clock_hand = (self._clock_hand + 1) % total_frames
        self._clock_hand_after = self._clock_hand
        return victim_frame_idx, f"Clock hand completed scan; evicted Frame {victim_frame_idx}."
