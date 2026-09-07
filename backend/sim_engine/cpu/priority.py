"""Priority CPU Scheduler (Supports both Preemptive and Non-Preemptive)."""

from typing import Dict, List, Optional, Tuple
from backend.sim_engine.core.base_scheduler import BaseScheduler
from backend.sim_engine.core.process import ProcessSnapshot


class PriorityScheduler(BaseScheduler):
    """Priority-based CPU scheduler.
    
    Supports:
    - Preemptive and Non-Preemptive modes.
    - Configurable priority ordering (default: lower integer = higher priority).
    
    Tie-breaking:
    1. Priority level (highest priority)
    2. Arrival Time (earliest)
    3. PID (alphabetical/numeric order)
    """

    def __init__(
        self,
        preemptive: bool = False,
        lower_number_higher_priority: bool = True,
    ):
        self._preemptive = preemptive
        self._lower_number_higher_priority = lower_number_higher_priority

    @property
    def name(self) -> str:
        mode = "Preemptive" if self._preemptive else "Non-Preemptive"
        return f"Priority ({mode})"

    @property
    def is_preemptive(self) -> bool:
        return self._preemptive

    @property
    def lower_number_higher_priority(self) -> bool:
        return self._lower_number_higher_priority

    def _priority_score(self, priority: int) -> int:
        """Normalized score where lower value = higher priority."""
        return priority if self._lower_number_higher_priority else -priority

    def _process_sort_key(self, pid: str, processes: Dict[str, ProcessSnapshot]) -> Tuple[int, int, str]:
        proc = processes[pid]
        return (self._priority_score(proc.priority), proc.arrival_time, pid)

    def select_next(
        self,
        ready_queue: List[str],
        current_running: Optional[str],
        current_tick: int,
        processes: Dict[str, ProcessSnapshot],
    ) -> Optional[str]:
        if not ready_queue:
            return None

        best_pid = min(
            ready_queue,
            key=lambda pid: self._process_sort_key(pid, processes)
        )
        return best_pid

    def should_preempt(
        self,
        current_running: str,
        ready_queue: List[str],
        current_tick: int,
        processes: Dict[str, ProcessSnapshot],
        quantum_elapsed: int,
    ) -> Tuple[bool, Optional[str]]:
        if not self._preemptive or not ready_queue or current_running not in processes:
            return False, None

        best_candidate = self.select_next(ready_queue, current_running, current_tick, processes)
        if best_candidate is None:
            return False, None

        candidate_score = self._priority_score(processes[best_candidate].priority)
        running_score = self._priority_score(processes[current_running].priority)

        # Strictly higher priority triggers preemption
        if candidate_score < running_score:
            return True, best_candidate

        return False, None
