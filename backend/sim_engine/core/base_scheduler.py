"""Abstract base strategy for CPU schedulers."""

from abc import ABC, abstractmethod
from typing import Dict, List, Optional, Tuple
from backend.sim_engine.core.process import ProcessSnapshot


class BaseScheduler(ABC):
    """Abstract Base Class for all CPU scheduling algorithms.
    
    Tie-breaking policy across all implementations:
    1. Primary algorithm-specific criterion
    2. Arrival time (earlier arrival wins)
    3. Process ID / alphanumeric order (e.g., 'P1' < 'P2')
    """

    @property
    @abstractmethod
    def name(self) -> str:
        """Name of the scheduling algorithm."""
        pass

    @property
    @abstractmethod
    def is_preemptive(self) -> bool:
        """Whether this scheduler supports preemption."""
        pass

    @abstractmethod
    def select_next(
        self,
        ready_queue: List[str],
        current_running: Optional[str],
        current_tick: int,
        processes: Dict[str, ProcessSnapshot],
    ) -> Optional[str]:
        """Select the next process PID to run from the ready queue.
        
        Returns PID of selected process, or None if ready_queue is empty.
        """
        pass

    def should_preempt(
        self,
        current_running: str,
        ready_queue: List[str],
        current_tick: int,
        processes: Dict[str, ProcessSnapshot],
        quantum_elapsed: int,
    ) -> Tuple[bool, Optional[str]]:
        """Determine if current_running process should be preempted.
        
        Returns (preempt: bool, next_pid_if_preempted: Optional[str]).
        Default implementation for non-preemptive schedulers returns (False, None).
        """
        return False, None

    def on_process_arrived(
        self,
        pid: str,
        ready_queue: List[str],
        processes: Dict[str, ProcessSnapshot],
    ) -> None:
        """Hook called when a new process arrives and is placed into the ready queue.
        
        By default, appends pid to the end of the ready_queue if not present.
        """
        if pid not in ready_queue:
            ready_queue.append(pid)

    def on_process_completed(
        self,
        pid: str,
        ready_queue: List[str],
    ) -> None:
        """Hook called when a process completes execution."""
        if pid in ready_queue:
            ready_queue.remove(pid)
