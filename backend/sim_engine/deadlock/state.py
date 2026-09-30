"""Immutable timeline snapshots and state models for Deadlock and Banker's algorithm simulation."""

from dataclasses import dataclass
from enum import Enum
from typing import Optional, Dict, Any, Tuple


class RequestOutcome(str, Enum):
    GRANTED = "GRANTED"
    WAITING = "WAITING"
    DENIED = "DENIED"
    ERROR = "ERROR"


@dataclass(frozen=True)
class DeadlockSystemStateSnapshot:
    """Immutable snapshot of the resource allocation matrices and vectors."""
    step_index: int
    processes: Tuple[str, ...]
    resource_types: Tuple[str, ...]
    total: Tuple[int, ...]
    available: Tuple[int, ...]
    allocation: Tuple[Tuple[int, ...], ...]
    maximum: Tuple[Tuple[int, ...], ...]
    need: Tuple[Tuple[int, ...], ...]
    request: Tuple[Tuple[int, ...], ...]

    def to_dict(self) -> Dict[str, Any]:
        return {
            "step_index": self.step_index,
            "processes": list(self.processes),
            "resource_types": list(self.resource_types),
            "total": list(self.total),
            "available": list(self.available),
            "allocation": [list(row) for row in self.allocation],
            "maximum": [list(row) for row in self.maximum],
            "need": [list(row) for row in self.need],
            "request": [list(row) for row in self.request],
        }


@dataclass(frozen=True)
class SafetyStepSnapshot:
    """Snapshot of a single step during Banker's safety algorithm execution."""
    step_index: int
    evaluated_process: Optional[str]
    work_before: Tuple[int, ...]
    work_after: Tuple[int, ...]
    finish_vector: Tuple[bool, ...]
    is_satisfied: bool
    safe_sequence_so_far: Tuple[str, ...]
    description: str

    def to_dict(self) -> Dict[str, Any]:
        return {
            "step_index": self.step_index,
            "evaluated_process": self.evaluated_process,
            "work_before": list(self.work_before),
            "work_after": list(self.work_after),
            "finish_vector": list(self.finish_vector),
            "is_satisfied": self.is_satisfied,
            "safe_sequence_so_far": list(self.safe_sequence_so_far),
            "description": self.description,
        }


@dataclass(frozen=True)
class DetectionStepSnapshot:
    """Snapshot of a single step during matrix-based deadlock detection reduction."""
    step_index: int
    evaluated_process: Optional[str]
    work_before: Tuple[int, ...]
    work_after: Tuple[int, ...]
    finish_vector: Tuple[bool, ...]
    is_reduced: bool
    unreduced_processes: Tuple[str, ...]
    description: str

    def to_dict(self) -> Dict[str, Any]:
        return {
            "step_index": self.step_index,
            "evaluated_process": self.evaluated_process,
            "work_before": list(self.work_before),
            "work_after": list(self.work_after),
            "finish_vector": list(self.finish_vector),
            "is_reduced": self.is_reduced,
            "unreduced_processes": list(self.unreduced_processes),
            "description": self.description,
        }


@dataclass(frozen=True)
class RequestEvaluationSnapshot:
    """Snapshot of a resource request evaluation cycle."""
    process_id: str
    request_vector: Tuple[int, ...]
    decision: RequestOutcome
    reason: str
    tentative_available: Optional[Tuple[int, ...]] = None
    tentative_allocation: Optional[Tuple[Tuple[int, ...], ...]] = None
    tentative_need: Optional[Tuple[Tuple[int, ...], ...]] = None
    safe_sequence: Optional[Tuple[str, ...]] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "process_id": self.process_id,
            "request_vector": list(self.request_vector),
            "decision": self.decision.value,
            "reason": self.reason,
            "tentative_available": list(self.tentative_available) if self.tentative_available else None,
            "tentative_allocation": [list(r) for r in self.tentative_allocation] if self.tentative_allocation else None,
            "tentative_need": [list(r) for r in self.tentative_need] if self.tentative_need else None,
            "safe_sequence": list(self.safe_sequence) if self.safe_sequence else None,
        }


@dataclass(frozen=True)
class DeadlockTimelineSnapshot:
    """A discrete point in the simulation timeline, completely immutable."""
    tick: int
    description: str
    system_state: DeadlockSystemStateSnapshot
    safety_step: Optional[SafetyStepSnapshot] = None
    detection_step: Optional[DetectionStepSnapshot] = None
    request_step: Optional[RequestEvaluationSnapshot] = None
    metrics: Optional[Dict[str, Any]] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "tick": self.tick,
            "description": self.description,
            "system_state": self.system_state.to_dict(),
            "safety_step": self.safety_step.to_dict() if self.safety_step else None,
            "detection_step": self.detection_step.to_dict() if self.detection_step else None,
            "request_step": self.request_step.to_dict() if self.request_step else None,
            "metrics": self.metrics,
        }
