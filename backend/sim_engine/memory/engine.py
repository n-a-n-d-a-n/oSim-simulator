"""Discrete-time memory simulation subsystem for contiguous memory allocation in OSim."""

from dataclasses import dataclass
from typing import List, Dict, Any, Optional
from collections import defaultdict

from backend.sim_engine.core.clock import SimulationClock
from backend.sim_engine.core.event import SimulationEvent
from backend.sim_engine.memory.allocator import BaseAllocator
from backend.sim_engine.memory.block import MemoryBlock
from backend.sim_engine.memory.metrics import MemoryMetricsSnapshot, compute_memory_metrics
from backend.sim_engine.memory.state import (
    MemoryOperation,
    MemoryOperationType,
    MemoryStateSnapshot,
    OperationResultSnapshot,
)


@dataclass
class MemorySimulationResult:
    """Complete simulation result containing timeline, events, operation results, and final metrics."""
    algorithm_name: str
    memory_size: int
    timeline: List[MemoryStateSnapshot]
    events: List[SimulationEvent]
    operation_results: List[OperationResultSnapshot]
    final_metrics: MemoryMetricsSnapshot
    terminated_normally: bool

    def to_dict(self, decimal_places: int = 4) -> Dict[str, Any]:
        return {
            "algorithm_name": self.algorithm_name,
            "memory_size": self.memory_size,
            "terminated_normally": self.terminated_normally,
            "timeline": [state.to_dict() for state in self.timeline],
            "events": [event.to_dict() for event in self.events],
            "operation_results": [res.to_dict() for res in self.operation_results],
            "final_metrics": self.final_metrics.to_dict(decimal_places=decimal_places),
        }


class MemorySimulationEngine:
    """Deterministic discrete-time memory simulation engine.
    
    Operates in discrete time increments (ticks):
    MemoryState(t) -> Scheduled Operations(t) -> Memory Event(t) -> State Reducer -> MemoryState(t+1)
    
    Same-Tick Ordering (Clarification 2):
    At any tick t where multiple operations are scheduled, all DEALLOCATE operations
    are executed first, followed by ALLOCATE operations.
    Reason: Memory released during a tick becomes available to allocations processed
    later within that same tick.
    """

    def __init__(
        self,
        allocator: BaseAllocator,
        memory_size: int,
        operations: List[MemoryOperation],
        max_ticks: int = 1000,
    ):
        if memory_size <= 0:
            raise ValueError(f"memory_size must be strictly positive, got {memory_size}")
        if max_ticks <= 0:
            raise ValueError(f"max_ticks must be strictly positive, got {max_ticks}")

        self._allocator = allocator
        self._memory_size = memory_size
        self._max_ticks = max_ticks

        # Group operations deterministically by tick
        self._ops_by_tick: Dict[int, List[MemoryOperation]] = defaultdict(list)
        for op in operations:
            if op.tick < 0:
                raise ValueError(f"Operation tick must be non-negative, got {op.tick}")
            self._ops_by_tick[op.tick].append(op)

        # Simulation state
        self._clock = SimulationClock(0)
        self._cursor: int = 0  # Initial Next Fit cursor address (Clarification 1)
        self._blocks: List[MemoryBlock] = [
            MemoryBlock(start_address=0, size=memory_size, is_free=True, owner_id=None)
        ]
        self._timeline: List[MemoryStateSnapshot] = []
        self._events: List[SimulationEvent] = []
        self._operation_results: List[OperationResultSnapshot] = []
        self._event_counter: int = 0

        self._success_count: int = 0
        self._failure_count: int = 0

    def _add_events(self, raw_events: List[SimulationEvent]) -> None:
        for ev in raw_events:
            self._event_counter += 1
            det_ev = SimulationEvent(
                event_id=f"mem_evt_{self._event_counter:05d}",
                tick=ev.tick,
                event_type=ev.event_type,
                component=ev.component,
                description=ev.description,
                details=ev.details,
            )
            self._events.append(det_ev)

    def _assert_invariants(self, tick: int) -> None:
        """Validate core physical memory invariants after state transitions."""
        if not self._blocks:
            raise AssertionError(f"Tick {tick}: Memory blocks list cannot be empty.")

        # 1. Address coverage
        if self._blocks[0].start_address != 0:
            raise AssertionError(
                f"Tick {tick}: First block must start at 0, got {self._blocks[0].start_address}."
            )
        if self._blocks[-1].end_address != self._memory_size:
            raise AssertionError(
                f"Tick {tick}: Last block must end at memory_size {self._memory_size}, "
                f"got {self._blocks[-1].end_address}."
            )

        # 2. Contiguity and No Overlap
        for i in range(len(self._blocks) - 1):
            curr_b = self._blocks[i]
            next_b = self._blocks[i + 1]
            if curr_b.end_address != next_b.start_address:
                raise AssertionError(
                    f"Tick {tick}: Non-contiguous gap/overlap between block {curr_b} and {next_b}."
                )

        # 3. Conservation of memory
        total_block_size = sum(b.size for b in self._blocks)
        if total_block_size != self._memory_size:
            raise AssertionError(
                f"Tick {tick}: Sum of block sizes ({total_block_size}) does not equal "
                f"total memory size ({self._memory_size})."
            )

        # 4. Canonical coalescing: No two adjacent blocks can both be free
        for i in range(len(self._blocks) - 1):
            if self._blocks[i].is_free and self._blocks[i + 1].is_free:
                raise AssertionError(
                    f"Tick {tick}: Canonical coalescing violated: adjacent free blocks "
                    f"{self._blocks[i]} and {self._blocks[i+1]}."
                )

    def _record_snapshot(self, last_result: Optional[OperationResultSnapshot] = None) -> None:
        """Record an immutable snapshot of memory state at the current tick."""
        metrics = compute_memory_metrics(
            total_memory=self._memory_size,
            blocks=self._blocks,
            success_count=self._success_count,
            failure_count=self._failure_count,
        )

        snapshot = MemoryStateSnapshot(
            tick=self._clock.current_tick,
            total_memory=self._memory_size,
            blocks=[b.to_snapshot() for b in self._blocks],
            next_fit_cursor=self._cursor,
            metrics=metrics,
            last_operation_result=last_result,
        )
        self._timeline.append(snapshot)

    def run(self) -> MemorySimulationResult:
        """Execute the discrete-time simulation until operations are exhausted or max_ticks reached."""
        max_op_tick = max(self._ops_by_tick.keys()) if self._ops_by_tick else 0

        # Snapshot initial state at tick 0 before any operations
        self._record_snapshot(last_result=None)

        terminated_normally = True

        while True:
            current_tick = self._clock.current_tick

            # Process operations scheduled for the current tick
            if current_tick in self._ops_by_tick:
                tick_ops = self._ops_by_tick[current_tick]

                # Deterministic same-tick ordering: DEALLOCATE before ALLOCATE
                dealloc_ops = [op for op in tick_ops if op.operation_type == MemoryOperationType.DEALLOCATE]
                alloc_ops = [op for op in tick_ops if op.operation_type == MemoryOperationType.ALLOCATE]

                # 1. Process DEALLOCATE operations
                for op in dealloc_ops:
                    dealloc_res = self._allocator.deallocate(
                        blocks=self._blocks,
                        request_id=op.request_id,
                        tick=current_tick,
                    )
                    self._add_events(dealloc_res.events)

                    res_snapshot = OperationResultSnapshot(
                        tick=current_tick,
                        operation_type=op.operation_type.value,
                        request_id=op.request_id,
                        size=None,
                        success=dealloc_res.success,
                        allocated_start_address=dealloc_res.freed_start_address,
                        allocated_size=dealloc_res.freed_size,
                        reason=dealloc_res.failure_reason,
                    )
                    self._operation_results.append(res_snapshot)

                    # Update the timeline snapshot for this step
                    self._assert_invariants(current_tick)
                    self._timeline[-1] = MemoryStateSnapshot(
                        tick=current_tick,
                        total_memory=self._memory_size,
                        blocks=[b.to_snapshot() for b in self._blocks],
                        next_fit_cursor=self._cursor,
                        metrics=compute_memory_metrics(
                            self._memory_size, self._blocks, self._success_count, self._failure_count
                        ),
                        last_operation_result=res_snapshot,
                    )

                # 2. Process ALLOCATE operations
                for op in alloc_ops:
                    alloc_res = self._allocator.allocate(
                        blocks=self._blocks,
                        request_id=op.request_id,
                        size=op.size or 0,
                        cursor=self._cursor,
                        tick=current_tick,
                    )
                    self._add_events(alloc_res.events)
                    self._cursor = alloc_res.new_cursor

                    if alloc_res.success:
                        self._success_count += 1
                    else:
                        self._failure_count += 1

                    res_snapshot = OperationResultSnapshot(
                        tick=current_tick,
                        operation_type=op.operation_type.value,
                        request_id=op.request_id,
                        size=op.size,
                        success=alloc_res.success,
                        allocated_start_address=alloc_res.allocated_start_address,
                        allocated_size=alloc_res.allocated_size,
                        reason=alloc_res.failure_reason,
                    )
                    self._operation_results.append(res_snapshot)

                    self._assert_invariants(current_tick)
                    self._timeline[-1] = MemoryStateSnapshot(
                        tick=current_tick,
                        total_memory=self._memory_size,
                        blocks=[b.to_snapshot() for b in self._blocks],
                        next_fit_cursor=self._cursor,
                        metrics=compute_memory_metrics(
                            self._memory_size, self._blocks, self._success_count, self._failure_count
                        ),
                        last_operation_result=res_snapshot,
                    )

            # Check if all operations have finished
            if current_tick >= max_op_tick:
                break

            # Step clock to next tick
            if current_tick >= self._max_ticks:
                terminated_normally = False
                break

            self._clock.advance(1)
            # Record state at start of new tick
            self._record_snapshot(last_result=None)

        final_metrics = compute_memory_metrics(
            total_memory=self._memory_size,
            blocks=self._blocks,
            success_count=self._success_count,
            failure_count=self._failure_count,
        )

        return MemorySimulationResult(
            algorithm_name=self._allocator.name,
            memory_size=self._memory_size,
            timeline=self._timeline,
            events=self._events,
            operation_results=self._operation_results,
            final_metrics=final_metrics,
            terminated_normally=terminated_normally,
        )
