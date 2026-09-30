"""Structured deterministic event model for Deadlock Detection and Banker's Algorithm."""

from dataclasses import dataclass, field
from enum import Enum
from typing import Dict, Any


class DeadlockEventType(str, Enum):
    SYSTEM_INITIALIZED = "SYSTEM_INITIALIZED"
    SAFETY_EVALUATION_STARTED = "SAFETY_EVALUATION_STARTED"
    PROCESS_SAFETY_CHECKED = "PROCESS_SAFETY_CHECKED"
    PROCESS_MARKED_FINISHABLE = "PROCESS_MARKED_FINISHABLE"
    SAFE_SEQUENCE_ADVANCED = "SAFE_SEQUENCE_ADVANCED"
    SAFE_STATE_CONFIRMED = "SAFE_STATE_CONFIRMED"
    UNSAFE_STATE_CONFIRMED = "UNSAFE_STATE_CONFIRMED"

    RESOURCE_REQUEST_SUBMITTED = "RESOURCE_REQUEST_SUBMITTED"
    REQUEST_CLAIM_EXCEEDED = "REQUEST_CLAIM_EXCEEDED"
    REQUEST_WAITING = "REQUEST_WAITING"
    TENTATIVE_ALLOCATION_APPLIED = "TENTATIVE_ALLOCATION_APPLIED"
    REQUEST_GRANTED = "REQUEST_GRANTED"
    REQUEST_DENIED_ROLLBACK = "REQUEST_DENIED_ROLLBACK"

    DETECTION_STARTED = "DETECTION_STARTED"
    PROCESS_DETECTION_CHECKED = "PROCESS_DETECTION_CHECKED"
    PROCESS_REDUCED = "PROCESS_REDUCED"
    DEADLOCK_CONFIRMED = "DEADLOCK_CONFIRMED"
    NO_DEADLOCK_CONFIRMED = "NO_DEADLOCK_CONFIRMED"


@dataclass(frozen=True)
class DeadlockEvent:
    """An immutable, deterministic lifecycle event in the deadlock simulation."""
    event_id: str
    tick: int
    event_type: DeadlockEventType
    component: str  # "BANKER_AVOIDANCE" | "DEADLOCK_DETECTOR" | "RESOURCE_MANAGER"
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


def create_deadlock_event(
    tick: int,
    seq: int,
    event_type: DeadlockEventType,
    component: str,
    description: str,
    details: Dict[str, Any] = None,
) -> DeadlockEvent:
    """Creates a deterministic deadlock event with a reproducible event ID."""
    clean_type = event_type.value.lower()
    event_id = f"dl_evt_{tick}_{seq}_{clean_type}"
    return DeadlockEvent(
        event_id=event_id,
        tick=tick,
        event_type=event_type,
        component=component,
        description=description,
        details=details or {},
    )
