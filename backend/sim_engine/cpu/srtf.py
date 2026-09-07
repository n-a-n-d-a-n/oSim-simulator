"""Shortest Remaining Time First (SRTF) Preemptive CPU Scheduler."""

from typing import Dict, List, Optional, Tuple
from backend.sim_engine.core.base_scheduler import BaseScheduler
from backend.sim_engine.core.process import ProcessSnapshot


class SRTFScheduler(BaseScheduler):
    """Shortest Remaining Time First (SRTF) preemptive scheduler.
    
    Tie-breaking:
    1. Remaining Time (shortest)
    2. Arrival Time (earliest)
    3. PID (alphabetical/numeric order)
    """

    @property
    def name(self) -> str:
        return "SRTF"

    @property
    def is_preemptive(self) -> bool:
        return True

    def _process_sort_key(self, pid: str, processes: Dict[str, ProcessSnapshot]) -> Tuple[int, int, str]:
        proc = processes[pid]
        return (proc.remaining_time, proc.arrival_time, pid)

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
        if not ready_queue or current_running not in processes:
            return False, None

        running_key = self._process_sort_key(current_running, processes)
        best_candidate = self.select_next(ready_queue, current_running, current_tick, processes)
        if best_candidate is None:
            return False, None

        candidate_key = self._process_sort_key(best_candidate, processes)
        # Canonical rule: preempt only if candidate is strictly better (shorter remaining time)
        # To avoid thrashing on exact ties, require candidate remaining time to be strictly less
        candidate_rem = processes[best_candidate].remaining_time
        running_rem = processes[current_running].remaining_time
        if candidate_rem < running_rem:
            return True, best_candidate

        return False, None
