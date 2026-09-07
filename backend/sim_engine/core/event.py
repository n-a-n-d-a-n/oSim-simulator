"""Standardized simulation events for OSim."""

from dataclasses import dataclass, field
from enum import Enum
from typing import Dict, Any


class EventType(str, Enum):
    PROCESS_ARRIVED = "PROCESS_ARRIVED"
    PROCESS_SCHEDULED = "PROCESS_SCHEDULED"
    PROCESS_PREEMPTED = "PROCESS_PREEMPTED"
    CONTEXT_SWITCH_STARTED = "CONTEXT_SWITCH_STARTED"
    CONTEXT_SWITCH_FINISHED = "CONTEXT_SWITCH_FINISHED"
    CPU_IDLE = "CPU_IDLE"
    IO_BLOCKED = "IO_BLOCKED"
    IO_COMPLETED = "IO_COMPLETED"
    PROCESS_TERMINATED = "PROCESS_TERMINATED"


@dataclass(frozen=True)
class SimulationEvent:
    """Immutable record of an event occurring at a specific tick."""
    event_id: str
    tick: int
    event_type: EventType
    component: str  # e.g., "CPU_SCHEDULER"
    description: str
    details: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "event_id": self.event_id,
            "tick": self.tick,
            "event_type": self.event_type.value,
            "component": self.component,
            "description": self.description,
            "details": self.details,
        }
