"""Round Robin (RR) Preemptive CPU Scheduler."""

from typing import Dict, List, Optional, Tuple
from backend.sim_engine.core.base_scheduler import BaseScheduler
from backend.sim_engine.core.process import ProcessSnapshot


class RoundRobinScheduler(BaseScheduler):
    """Round Robin (RR) preemptive scheduler with configurable time quantum.
    
    Queue Discipline:
    - Pure FIFO queue ordering.
    - Arriving processes are appended to the tail of the ready queue.
    - When time quantum expires, if other processes are waiting in the ready queue,
      the current process is preempted and appended to the tail of the ready queue.
    - If the ready queue is empty upon quantum expiration, the current process continues.
    """

    def __init__(self, time_quantum: int = 2):
        if time_quantum <= 0:
            raise ValueError(f"time_quantum must be >= 1, got {time_quantum}")
        self._time_quantum = time_quantum

    @property
    def name(self) -> str:
        return f"Round Robin (q={self._time_quantum})"

    @property
    def is_preemptive(self) -> bool:
        return True

    @property
    def time_quantum(self) -> int:
        return self._time_quantum

    def select_next(
        self,
        ready_queue: List[str],
        current_running: Optional[str],
        current_tick: int,
        processes: Dict[str, ProcessSnapshot],
    ) -> Optional[str]:
        if not ready_queue:
            return None
        # In Round Robin, the first element of the ready_queue is the head of the FIFO queue
        return ready_queue[0]

    def should_preempt(
        self,
        current_running: str,
        ready_queue: List[str],
        current_tick: int,
        processes: Dict[str, ProcessSnapshot],
        quantum_elapsed: int,
    ) -> Tuple[bool, Optional[str]]:
        if quantum_elapsed >= self._time_quantum and len(ready_queue) > 0:
            next_pid = ready_queue[0]
            return True, next_pid
        return False, None
