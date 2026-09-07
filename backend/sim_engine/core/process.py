"""Process domain models for OSim."""

from dataclasses import dataclass, field
from enum import Enum
from typing import Optional, List, Tuple


class ProcessState(str, Enum):
    NEW = "NEW"
    READY = "READY"
    RUNNING = "RUNNING"
    WAITING = "WAITING"
    TERMINATED = "TERMINATED"


@dataclass(frozen=True)
class IOBurst:
    """Represents an I/O burst occurring after a certain amount of CPU execution."""
    cpu_time_before_io: int
    io_duration: int


@dataclass(frozen=True)
class ProcessSnapshot:
    """Immutable snapshot of a process at a specific simulation tick."""
    pid: str
    arrival_time: int
    burst_time: int
    remaining_time: int
    priority: int
    state: ProcessState
    executed_time: int = 0
    start_time: Optional[int] = None
    completion_time: Optional[int] = None
    waiting_time: int = 0
    turnaround_time: int = 0
    response_time: Optional[int] = None
    queue_level: int = 0
    memory_required: int = 0

    def to_dict(self) -> dict:
        return {
            "pid": self.pid,
            "arrival_time": self.arrival_time,
            "burst_time": self.burst_time,
            "remaining_time": self.remaining_time,
            "priority": self.priority,
            "state": self.state.value,
            "executed_time": self.executed_time,
            "start_time": self.start_time,
            "completion_time": self.completion_time,
            "waiting_time": self.waiting_time,
            "turnaround_time": self.turnaround_time,
            "response_time": self.response_time,
            "queue_level": self.queue_level,
            "memory_required": self.memory_required,
        }


@dataclass
class ProcessDefinition:
    """Specification of a process to be simulated (input to simulation)."""
    pid: str
    arrival_time: int
    burst_time: int
    priority: int = 0
    memory_required: int = 0
    io_bursts: List[IOBurst] = field(default_factory=list)

    def __post_init__(self):
        if self.arrival_time < 0:
            raise ValueError(f"Process {self.pid}: arrival_time must be >= 0, got {self.arrival_time}")
        if self.burst_time < 0:
            raise ValueError(f"Process {self.pid}: burst_time must be >= 0, got {self.burst_time}")
