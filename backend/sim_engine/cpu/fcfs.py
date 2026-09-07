"""First-Come, First-Served (FCFS) CPU Scheduler."""

from typing import Dict, List, Optional
from backend.sim_engine.core.base_scheduler import BaseScheduler
from backend.sim_engine.core.process import ProcessSnapshot


class FCFSScheduler(BaseScheduler):
    """First-Come, First-Served (FCFS) non-preemptive scheduler.
    
    Tie-breaking:
    1. Arrival Time (earliest)
    2. PID (alphabetical/numeric order)
    """

    @property
    def name(self) -> str:
        return "FCFS"

    @property
    def is_preemptive(self) -> bool:
        return False

    def select_next(
        self,
        ready_queue: List[str],
        current_running: Optional[str],
        current_tick: int,
        processes: Dict[str, ProcessSnapshot],
    ) -> Optional[str]:
        if not ready_queue:
            return None

        # Sort by arrival_time, then pid
        best_pid = min(
            ready_queue,
            key=lambda pid: (processes[pid].arrival_time, pid)
        )
        return best_pid
