"""System state models representing immutable snapshots of the simulation."""

from dataclasses import dataclass
from typing import Dict, Tuple, Optional, Any
from backend.sim_engine.core.process import ProcessSnapshot


@dataclass(frozen=True)
class CPUState:
    """Immutable state of the CPU at a specific tick."""
    running_pid: Optional[str]
    is_context_switching: bool = False
    context_switch_remaining: int = 0
    current_quantum_remaining: int = 0
    total_busy_ticks: int = 0
    total_idle_ticks: int = 0
    total_context_switch_ticks: int = 0

    def to_dict(self) -> Dict[str, Any]:
        return {
            "running_pid": self.running_pid,
            "is_context_switching": self.is_context_switching,
            "context_switch_remaining": self.context_switch_remaining,
            "current_quantum_remaining": self.current_quantum_remaining,
            "total_busy_ticks": self.total_busy_ticks,
            "total_idle_ticks": self.total_idle_ticks,
            "total_context_switch_ticks": self.total_context_switch_ticks,
        }


@dataclass(frozen=True)
class SystemState:
    """Central immutable snapshot of the entire operating system state at a specific tick."""
    clock: int
    cpu: CPUState
    processes: Dict[str, ProcessSnapshot]
    ready_queue: Tuple[str, ...]
    waiting_queue: Tuple[str, ...]
    terminated_pids: Tuple[str, ...]

    def to_dict(self) -> Dict[str, Any]:
        return {
            "clock": self.clock,
            "cpu": self.cpu.to_dict(),
            "processes": {pid: proc.to_dict() for pid, proc in self.processes.items()},
            "ready_queue": list(self.ready_queue),
            "waiting_queue": list(self.waiting_queue),
            "terminated_pids": list(self.terminated_pids),
        }
