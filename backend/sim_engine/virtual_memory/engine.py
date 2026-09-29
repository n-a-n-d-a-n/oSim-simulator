"""Deterministic discrete-time virtual memory simulation engine."""

from dataclasses import dataclass
from typing import List, Dict, Any, Optional, Tuple

from backend.sim_engine.core.clock import SimulationClock
from backend.sim_engine.core.event import SimulationEvent
from backend.sim_engine.virtual_memory.address import (
    validate_address_parameters,
    decompose_virtual_address,
    compute_physical_address,
)
from backend.sim_engine.virtual_memory.event import (
    VirtualMemoryEventType,
    create_vm_event,
)
from backend.sim_engine.virtual_memory.frame import PhysicalMemoryPool
from backend.sim_engine.virtual_memory.metrics import (
    VirtualMemoryMetricsSnapshot,
    compute_vm_metrics,
)
from backend.sim_engine.virtual_memory.page_table import SingleLevelPageTable
from backend.sim_engine.virtual_memory.replacement.base import BasePageReplacementAlgorithm
from backend.sim_engine.virtual_memory.state import (
    InputMode,
    MemoryReference,
    ReplacementDecision,
    VirtualMemorySnapshot,
)


@dataclass
class VirtualMemorySimulationResult:
    """Complete simulation result containing timeline, events, and metrics."""
    algorithm_name: str
    num_frames: int
    page_size: int
    virtual_page_count: int
    input_mode: InputMode
    timeline: List[VirtualMemorySnapshot]
    events: List[SimulationEvent]
    final_metrics: VirtualMemoryMetricsSnapshot
    terminated_normally: bool

    def to_dict(self) -> Dict[str, Any]:
        return {
            "algorithm_name": self.algorithm_name,
            "num_frames": self.num_frames,
            "page_size": self.page_size,
            "virtual_page_count": self.virtual_page_count,
            "input_mode": self.input_mode.value,
            "timeline": [s.to_dict() for s in self.timeline],
            "events": [e.to_dict() for e in self.events],
            "final_metrics": self.final_metrics.to_dict(),
            "terminated_normally": self.terminated_normally,
        }


class VirtualMemorySimulationEngine:
    """Deterministic, discrete-time educational virtual memory simulation engine."""

    def __init__(
        self,
        algorithm: BasePageReplacementAlgorithm,
        frame_count: int = 3,
        page_size: int = 4096,
        virtual_page_count: int = 16,
        input_mode: InputMode = InputMode.PAGE_REFERENCE,
        raw_references: Optional[List[int]] = None,
    ):
        validate_address_parameters(
            page_size=page_size,
            virtual_page_count=virtual_page_count,
            frame_count=frame_count,
        )

        self._algorithm = algorithm
        self._frame_count = frame_count
        self._page_size = page_size
        self._virtual_page_count = virtual_page_count
        self._input_mode = input_mode
        self._raw_references = raw_references or []

        # Resolve references into standardized MemoryReference domain models
        self._resolved_references: List[MemoryReference] = []
        for idx, raw_val in enumerate(self._raw_references):
            if input_mode == InputMode.PAGE_REFERENCE:
                if raw_val < 0 or raw_val >= virtual_page_count:
                    raise ValueError(
                        f"Page number {raw_val} at index {idx} out of bounds [0, {virtual_page_count})"
                    )
                self._resolved_references.append(
                    MemoryReference(
                        reference_index=idx,
                        page_number=raw_val,
                        virtual_address=None,
                        offset=0,
                    )
                )
            elif input_mode == InputMode.VIRTUAL_ADDRESS:
                decomp = decompose_virtual_address(
                    virtual_address=raw_val,
                    page_size=page_size,
                    virtual_page_count=virtual_page_count,
                )
                self._resolved_references.append(
                    MemoryReference(
                        reference_index=idx,
                        page_number=decomp.page_number,
                        virtual_address=decomp.virtual_address,
                        offset=decomp.offset,
                    )
                )

        # Simulation structures
        self._clock = SimulationClock(0)
        self._page_table = SingleLevelPageTable(virtual_page_count)
        self._memory_pool = PhysicalMemoryPool(frame_count)

        # Cumulative tracking
        self._page_hits = 0
        self._page_faults = 0
        self._replacements = 0
        self._evictions = 0

        # Output containers
        self._timeline: List[VirtualMemorySnapshot] = []
        self._events: List[SimulationEvent] = []

    def run(self) -> VirtualMemorySimulationResult:
        """Execute the full memory reference sequence deterministically."""
        total_steps = len(self._resolved_references)

        for step_idx in range(total_steps):
            ref = self._resolved_references[step_idx]
            tick = self._clock.current_tick

            # 1. Start reference event
            addr_str = f"0x{ref.virtual_address:X}" if ref.virtual_address is not None else f"Page {ref.page_number}"
            self._events.append(
                create_vm_event(
                    tick=tick,
                    event_type=VirtualMemoryEventType.VIRTUAL_ADDRESS_REFERENCED,
                    description=f"Step {step_idx}: Memory access requested for {addr_str}",
                    details={"step_index": step_idx, "page_number": ref.page_number, "offset": ref.offset},
                )
            )

            # 2. Page table lookup
            self._events.append(
                create_vm_event(
                    tick=tick,
                    event_type=VirtualMemoryEventType.PAGE_TABLE_LOOKUP,
                    description=f"Looking up Page {ref.page_number} in page table",
                    details={"page_number": ref.page_number},
                )
            )

            is_resident = self._page_table.is_present(ref.page_number)
            replacement_decision: Optional[ReplacementDecision] = None
            allocated_frame_idx: int

            if is_resident:
                # --- PAGE HIT ---
                self._page_hits += 1
                is_hit = True
                is_fault = False

                pt_entry = self._page_table.lookup(ref.page_number)
                allocated_frame_idx = pt_entry.frame_number  # type: ignore
                frame = self._memory_pool.get_frame(allocated_frame_idx)

                # Update recency & reference bits
                self._page_table.touch_page(ref.page_number, tick)
                self._algorithm.on_page_hit(frame, tick)

                self._events.append(
                    create_vm_event(
                        tick=tick,
                        event_type=VirtualMemoryEventType.PAGE_HIT,
                        description=f"PAGE HIT: Page {ref.page_number} is resident in Frame {allocated_frame_idx}",
                        details={"page_number": ref.page_number, "frame_number": allocated_frame_idx},
                    )
                )

            else:
                # --- PAGE FAULT ---
                self._page_faults += 1
                is_hit = False
                is_fault = True

                self._events.append(
                    create_vm_event(
                        tick=tick,
                        event_type=VirtualMemoryEventType.PAGE_FAULT,
                        description=f"PAGE FAULT: Page {ref.page_number} is not resident in physical memory",
                        details={"page_number": ref.page_number},
                    )
                )

                # Check if a free frame is available
                free_frame = self._memory_pool.find_free_frame()

                if free_frame is not None:
                    # Allocate free frame
                    allocated_frame_idx = free_frame
                    victim_page = None
                    reason = f"Allocated free physical Frame {allocated_frame_idx}"

                    self._events.append(
                        create_vm_event(
                            tick=tick,
                            event_type=VirtualMemoryEventType.FREE_FRAME_SELECTED,
                            description=f"Free Frame {allocated_frame_idx} selected for Page {ref.page_number}",
                            details={"frame_number": allocated_frame_idx, "page_number": ref.page_number},
                        )
                    )

                    replacement_decision = ReplacementDecision(
                        step_index=step_idx,
                        requested_page=ref.page_number,
                        victim_page=None,
                        allocated_frame=allocated_frame_idx,
                        algorithm_name=self._algorithm.name,
                        reason=reason,
                    )

                else:
                    # Replacement policy required
                    self._replacements += 1
                    self._evictions += 1

                    # Provide remaining future references to algorithm
                    future_refs = self._resolved_references[step_idx + 1 :]
                    victim_frame_idx, reason = self._algorithm.select_victim(
                        frames=self._memory_pool._frames,
                        step_index=step_idx,
                        future_references=future_refs,
                    )
                    allocated_frame_idx = victim_frame_idx
                    victim_frame = self._memory_pool.get_frame(victim_frame_idx)
                    victim_page = victim_frame.page_number

                    # Start eviction
                    self._events.append(
                        create_vm_event(
                            tick=tick,
                            event_type=VirtualMemoryEventType.PAGE_EVICTION_STARTED,
                            description=f"Evicting Page {victim_page} from Frame {victim_frame_idx} ({self._algorithm.name})",
                            details={"victim_page": victim_page, "victim_frame": victim_frame_idx, "reason": reason},
                        )
                    )

                    # Unmap victim page from page table and frame
                    if victim_page is not None:
                        self._page_table.unmap_page(victim_page)
                    victim_frame.clear()

                    self._events.append(
                        create_vm_event(
                            tick=tick,
                            event_type=VirtualMemoryEventType.PAGE_EVICTED,
                            description=f"Evicted Page {victim_page} from Frame {victim_frame_idx}",
                            details={"victim_page": victim_page, "victim_frame": victim_frame_idx},
                        )
                    )

                    # Extract scan details (if Clock algorithm)
                    scan_info = self._algorithm.get_last_scan_info()
                    hand_before, hand_after, scanned_frames = (
                        scan_info if scan_info else (None, None, None)
                    )

                    replacement_decision = ReplacementDecision(
                        step_index=step_idx,
                        requested_page=ref.page_number,
                        victim_page=victim_page,
                        allocated_frame=allocated_frame_idx,
                        algorithm_name=self._algorithm.name,
                        reason=reason,
                        clock_hand_before=hand_before,
                        clock_hand_after=hand_after,
                        frames_scanned=scanned_frames,
                    )

                # Load new page into allocated frame
                target_frame = self._memory_pool.get_frame(allocated_frame_idx)
                target_frame.load_page(ref.page_number, tick)
                self._page_table.map_page(ref.page_number, allocated_frame_idx, tick)
                self._algorithm.on_page_loaded(target_frame, tick)

                self._events.append(
                    create_vm_event(
                        tick=tick,
                        event_type=VirtualMemoryEventType.PAGE_LOADED,
                        description=f"Loaded Page {ref.page_number} into Frame {allocated_frame_idx}",
                        details={"page_number": ref.page_number, "frame_number": allocated_frame_idx},
                    )
                )

                self._events.append(
                    create_vm_event(
                        tick=tick,
                        event_type=VirtualMemoryEventType.PAGE_TABLE_UPDATED,
                        description=f"Page table updated: Page {ref.page_number} -> Frame {allocated_frame_idx} (is_present=True)",
                        details={"page_number": ref.page_number, "frame_number": allocated_frame_idx},
                    )
                )

            # 3. Address translation
            phys_addr = compute_physical_address(
                frame_number=allocated_frame_idx,
                offset=ref.offset,
                page_size=self._page_size,
                frame_count=self._frame_count,
            )

            self._events.append(
                create_vm_event(
                    tick=tick,
                    event_type=VirtualMemoryEventType.ADDRESS_TRANSLATED,
                    description=f"Address translated to physical address 0x{phys_addr.physical_address:X} (Frame {allocated_frame_idx}, Offset {ref.offset})",
                    details={
                        "frame_number": allocated_frame_idx,
                        "offset": ref.offset,
                        "physical_address": phys_addr.physical_address,
                    },
                )
            )

            # 4. Invariant validation
            self._page_table.validate_invariants()

            # 5. Immutable state snapshot creation
            # True immutable snapshot using frozen dataclasses and defensive copies
            step_metrics = compute_vm_metrics(
                total_references=step_idx + 1,
                page_hits=self._page_hits,
                page_faults=self._page_faults,
                replacements=self._replacements,
                evictions=self._evictions,
                free_frames=self._memory_pool.free_frames_count,
                resident_pages=self._memory_pool.resident_pages_count,
            )

            snapshot = VirtualMemorySnapshot(
                step_index=step_idx,
                reference=ref,
                is_hit=is_hit,
                is_fault=is_fault,
                frame_number=allocated_frame_idx,
                physical_address=phys_addr.physical_address,
                page_table=self._page_table.to_snapshots(),  # returns defensive frozen tuple
                frames=self._memory_pool.to_snapshots(),      # returns defensive frozen tuple
                free_frames_count=self._memory_pool.free_frames_count,
                replacement_decision=replacement_decision,
                clock_hand=self._algorithm.clock_hand,
                metrics=step_metrics,
            )
            self._timeline.append(snapshot)

            # Advance clock
            self._clock.advance(1)

        # Final metrics
        final_metrics = compute_vm_metrics(
            total_references=total_steps,
            page_hits=self._page_hits,
            page_faults=self._page_faults,
            replacements=self._replacements,
            evictions=self._evictions,
            free_frames=self._memory_pool.free_frames_count,
            resident_pages=self._memory_pool.resident_pages_count,
        )

        return VirtualMemorySimulationResult(
            algorithm_name=self._algorithm.name,
            num_frames=self._frame_count,
            page_size=self._page_size,
            virtual_page_count=self._virtual_page_count,
            input_mode=self._input_mode,
            timeline=self._timeline,
            events=self._events,
            final_metrics=final_metrics,
            terminated_normally=True,
        )
