"""Shortest Job First (SJF) Non-Preemptive CPU Scheduler."""

from typing import Dict, List, Optional
from backend.sim_engine.core.base_scheduler import BaseScheduler
from backend.sim_engine.core.process import ProcessSnapshot


class SJFScheduler(BaseScheduler):
    """Shortest Job First (SJF) non-preemptive scheduler.
    
    Tie-breaking:
    1. Burst Time (shortest total burst)
    2. Arrival Time (earliest)
    3. PID (alphabetical/numeric order)
    """

    @property
    def name(self) -> str:
        return "SJF"

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

        best_pid = min(
            ready_queue,
            key=lambda pid: (
                processes[pid].burst_time,
                processes[pid].arrival_time,
                pid
            )
        )
        return best_pid
