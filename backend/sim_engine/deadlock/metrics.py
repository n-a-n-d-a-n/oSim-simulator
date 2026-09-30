"""Metrics calculation and immutable telemetry snapshots for Phase 5."""

from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional
from backend.sim_engine.deadlock.models import ResourceSystem


@dataclass(frozen=True)
class DeadlockMetricsSnapshot:
    """Immutable metrics telemetry for deadlock and safety analysis."""
    total_processes: int
    total_resource_types: int
    total_resource_instances: int
    allocated_instances: int
    available_instances: int
    resource_utilization_ratio: float
    is_safe: Optional[bool] = None
    safe_sequence: List[str] = field(default_factory=list)
    is_deadlocked: Optional[bool] = None
    deadlocked_process_count: int = 0
    deadlocked_processes: List[str] = field(default_factory=list)
    request_count: int = 0
    granted_requests: int = 0
    waiting_requests: int = 0
    denied_requests: int = 0
    safety_checks: int = 0
    detection_checks: int = 0

    def to_dict(self) -> Dict[str, Any]:
        return {
            "total_processes": self.total_processes,
            "total_resource_types": self.total_resource_types,
            "total_resource_instances": self.total_resource_instances,
            "allocated_instances": self.allocated_instances,
            "available_instances": self.available_instances,
            "resource_utilization_ratio": round(self.resource_utilization_ratio, 4),
            "is_safe": self.is_safe,
            "safe_sequence": list(self.safe_sequence),
            "is_deadlocked": self.is_deadlocked,
            "deadlocked_process_count": self.deadlocked_process_count,
            "deadlocked_processes": list(self.deadlocked_processes),
            "request_count": self.request_count,
            "granted_requests": self.granted_requests,
            "waiting_requests": self.waiting_requests,
            "denied_requests": self.denied_requests,
            "safety_checks": self.safety_checks,
            "detection_checks": self.detection_checks,
        }


def compute_deadlock_metrics(
    system: ResourceSystem,
    is_safe: Optional[bool] = None,
    safe_sequence: Optional[List[str]] = None,
    is_deadlocked: Optional[bool] = None,
    deadlocked_processes: Optional[List[str]] = None,
    request_count: int = 0,
    granted_requests: int = 0,
    waiting_requests: int = 0,
    denied_requests: int = 0,
    safety_checks: int = 0,
    detection_checks: int = 0,
) -> DeadlockMetricsSnapshot:
    """Calculates comprehensive metrics for the current resource system state."""
    total_inst = sum(system.total)
    avail_inst = sum(system.available)
    alloc_inst = sum(sum(row) for row in system.allocation)

    util_ratio = (alloc_inst / total_inst) if total_inst > 0 else 0.0

    dl_procs = deadlocked_processes or []
    safe_seq = safe_sequence or []

    return DeadlockMetricsSnapshot(
        total_processes=system.process_count,
        total_resource_types=system.resource_count,
        total_resource_instances=total_inst,
        allocated_instances=alloc_inst,
        available_instances=avail_inst,
        resource_utilization_ratio=util_ratio,
        is_safe=is_safe,
        safe_sequence=safe_seq,
        is_deadlocked=is_deadlocked,
        deadlocked_process_count=len(dl_procs),
        deadlocked_processes=dl_procs,
        request_count=request_count,
        granted_requests=granted_requests,
        waiting_requests=waiting_requests,
        denied_requests=denied_requests,
        safety_checks=safety_checks,
        detection_checks=detection_checks,
    )
