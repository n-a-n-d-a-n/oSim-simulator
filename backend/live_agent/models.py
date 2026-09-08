"""Domain models representing immutable observations of the real host operating system.

These models represent strictly REAL observed system telemetry.
They are completely decoupled and isolated from the discrete simulation engine.
"""

from dataclasses import dataclass
from typing import Optional, Tuple, Dict, Any


@dataclass(frozen=True)
class ProcessObservation:
    """Immutable observation of a single active process on the real host OS."""
    pid: int
    name: str
    parent_pid: Optional[int]
    status: str
    cpu_percent: float
    memory_bytes: int
    thread_count: Optional[int] = None
    cpu_time_seconds: Optional[float] = None
    create_time: Optional[float] = None

    def __post_init__(self):
        if self.pid < 0:
            raise ValueError(f"PID must be non-negative, got {self.pid}")
        if self.parent_pid is not None and self.parent_pid < 0:
            raise ValueError(f"Parent PID must be non-negative, got {self.parent_pid}")
        if self.memory_bytes < 0:
            raise ValueError(f"Process memory_bytes must be non-negative, got {self.memory_bytes}")
        if self.cpu_percent < 0.0:
            raise ValueError(f"Process cpu_percent must be non-negative, got {self.cpu_percent}")
        if self.thread_count is not None and self.thread_count < 1:
            raise ValueError(f"Process thread_count must be at least 1, got {self.thread_count}")
        if self.cpu_time_seconds is not None and self.cpu_time_seconds < 0.0:
            raise ValueError(f"Process cpu_time_seconds must be non-negative, got {self.cpu_time_seconds}")
        if self.create_time is not None and self.create_time < 0.0:
            raise ValueError(f"Process create_time must be non-negative, got {self.create_time}")

    def to_dict(self) -> Dict[str, Any]:
        return {
            "pid": self.pid,
            "name": self.name,
            "parent_pid": self.parent_pid,
            "status": self.status,
            "cpu_percent": self.cpu_percent,
            "memory_bytes": self.memory_bytes,
            "thread_count": self.thread_count,
            "cpu_time_seconds": self.cpu_time_seconds,
            "create_time": self.create_time,
        }


@dataclass(frozen=True)
class CPUObservation:
    """Immutable observation of real host CPU performance and core telemetry."""
    total_cpu_percent: float
    logical_cpu_count: int
    per_cpu_percent: Tuple[float, ...]
    timestamp: float

    def __post_init__(self):
        if self.logical_cpu_count <= 0:
            raise ValueError(f"logical_cpu_count must be positive, got {self.logical_cpu_count}")
        if self.total_cpu_percent < 0.0:
            raise ValueError(f"total_cpu_percent must be non-negative, got {self.total_cpu_percent}")
        if self.timestamp <= 0.0:
            raise ValueError(f"timestamp must be a valid positive epoch time, got {self.timestamp}")
        for idx, pct in enumerate(self.per_cpu_percent):
            if pct < 0.0:
                raise ValueError(f"per_cpu_percent[{idx}] must be non-negative, got {pct}")

    def to_dict(self) -> Dict[str, Any]:
        return {
            "total_cpu_percent": self.total_cpu_percent,
            "logical_cpu_count": self.logical_cpu_count,
            "per_cpu_percent": list(self.per_cpu_percent),
            "timestamp": self.timestamp,
        }


@dataclass(frozen=True)
class MemoryObservation:
    """Immutable observation of real host physical and virtual memory utilization."""
    total_bytes: int
    used_bytes: int
    available_bytes: int
    percent_used: float
    timestamp: float

    def __post_init__(self):
        if self.total_bytes <= 0:
            raise ValueError(f"total_bytes must be strictly positive, got {self.total_bytes}")
        if self.used_bytes < 0:
            raise ValueError(f"used_bytes must be non-negative, got {self.used_bytes}")
        if self.available_bytes < 0:
            raise ValueError(f"available_bytes must be non-negative, got {self.available_bytes}")
        if not (0.0 <= self.percent_used <= 100.0):
            raise ValueError(f"percent_used must be between 0.0 and 100.0, got {self.percent_used}")
        if self.timestamp <= 0.0:
            raise ValueError(f"timestamp must be positive epoch time, got {self.timestamp}")

    def to_dict(self) -> Dict[str, Any]:
        return {
            "total_bytes": self.total_bytes,
            "used_bytes": self.used_bytes,
            "available_bytes": self.available_bytes,
            "percent_used": self.percent_used,
            "timestamp": self.timestamp,
        }


@dataclass(frozen=True)
class SystemSnapshot:
    """Immutable snapshot capturing a complete point-in-time observation of the host OS."""
    snapshot_id: str
    timestamp: float
    cpu: CPUObservation
    memory: MemoryObservation
    processes: Tuple[ProcessObservation, ...]
    process_count: int

    def __post_init__(self):
        if self.process_count != len(self.processes):
            raise ValueError(
                f"process_count ({self.process_count}) does not match processes length ({len(self.processes)})"
            )
        if self.timestamp <= 0.0:
            raise ValueError(f"timestamp must be positive, got {self.timestamp}")
        if not self.snapshot_id:
            raise ValueError("snapshot_id must be a non-empty string")

    def to_dict(self) -> Dict[str, Any]:
        return {
            "snapshot_id": self.snapshot_id,
            "timestamp": self.timestamp,
            "cpu": self.cpu.to_dict(),
            "memory": self.memory.to_dict(),
            "processes": [p.to_dict() for p in self.processes],
            "process_count": self.process_count,
        }
