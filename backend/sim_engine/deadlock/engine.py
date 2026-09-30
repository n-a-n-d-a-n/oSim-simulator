"""Simulation engine orchestrating Deadlock Detection, Banker Avoidance, and Timeline snapshots."""

from dataclasses import dataclass
from typing import List, Tuple, Dict, Any, Optional
from backend.sim_engine.deadlock.models import ResourceSystem
from backend.sim_engine.deadlock.state import (
    DeadlockSystemStateSnapshot,
    DeadlockTimelineSnapshot,
    SafetyStepSnapshot,
    DetectionStepSnapshot,
    RequestEvaluationSnapshot,
)
from backend.sim_engine.deadlock.event import DeadlockEvent, DeadlockEventType, create_deadlock_event
from backend.sim_engine.deadlock.graph import GraphAnalyzer, GraphSnapshot
from backend.sim_engine.deadlock.banker import BankerAlgorithm, BankerSafetyResult, ResourceRequestResult
from backend.sim_engine.deadlock.detection import DeadlockDetector, DeadlockDetectionResult
from backend.sim_engine.deadlock.metrics import compute_deadlock_metrics, DeadlockMetricsSnapshot


@dataclass(frozen=True)
class DeadlockSimulationResult:
    """Complete simulation result bundle returned by the engine."""
    mode: str  # "SAFETY" | "REQUEST" | "DETECTION"
    system: ResourceSystem
    timeline: Tuple[DeadlockTimelineSnapshot, ...]
    events: Tuple[DeadlockEvent, ...]
    metrics: DeadlockMetricsSnapshot
    rag_snapshot: GraphSnapshot
    wfg_snapshot: Optional[GraphSnapshot]
    is_safe: Optional[bool] = None
    safe_sequence: Optional[Tuple[str, ...]] = None
    is_deadlocked: Optional[bool] = None
    deadlocked_processes: Optional[Tuple[str, ...]] = None
    request_result: Optional[ResourceRequestResult] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "mode": self.mode,
            "timeline": [s.to_dict() for s in self.timeline],
            "events": [e.to_dict() for e in self.events],
            "metrics": self.metrics.to_dict(),
            "rag_snapshot": self.rag_snapshot.to_dict(),
            "wfg_snapshot": self.wfg_snapshot.to_dict() if self.wfg_snapshot else None,
            "is_safe": self.is_safe,
            "safe_sequence": list(self.safe_sequence) if self.safe_sequence else None,
            "is_deadlocked": self.is_deadlocked,
            "deadlocked_processes": list(self.deadlocked_processes) if self.deadlocked_processes else None,
            "request_result": self.request_result.to_dict() if self.request_result else None,
        }


class DeadlockSimulationEngine:
    """Deterministic orchestrator for deadlock and safety analysis simulations."""

    @staticmethod
    def _create_system_state_snapshot(step: int, system: ResourceSystem) -> DeadlockSystemStateSnapshot:
        return DeadlockSystemStateSnapshot(
            step_index=step,
            processes=tuple(p.id for p in system.processes),
            resource_types=tuple(r.id for r in system.resource_types),
            total=system.total,
            available=system.available,
            allocation=system.allocation,
            maximum=system.maximum,
            need=system.need,
            request=system.request,
        )

    @classmethod
    def simulate_safety(cls, system: ResourceSystem) -> DeadlockSimulationResult:
        """Runs the Banker's safety evaluation and constructs a step-by-step timeline."""
        events: List[DeadlockEvent] = []
        timeline: List[DeadlockTimelineSnapshot] = []

        # Tick 0: Initial State
        events.append(
            create_deadlock_event(
                tick=0,
                seq=0,
                event_type=DeadlockEventType.SYSTEM_INITIALIZED,
                component="RESOURCE_MANAGER",
                description=f"System initialized with {system.process_count} processes and {system.resource_count} resource types.",
                details={"available": list(system.available)},
            )
        )
        init_metrics = compute_deadlock_metrics(system)
        timeline.append(
            DeadlockTimelineSnapshot(
                tick=0,
                description="Initial System State",
                system_state=cls._create_system_state_snapshot(0, system),
                metrics=init_metrics.to_dict(),
            )
        )

        safety_res = BankerAlgorithm.evaluate_safety(system, start_tick=1)
        for ev in safety_res.events:
            events.append(ev)

        # Timeline steps for each process evaluated in safety sequence
        for idx, step_snap in enumerate(safety_res.steps):
            tick = idx + 1
            timeline.append(
                DeadlockTimelineSnapshot(
                    tick=tick,
                    description=step_snap.description,
                    system_state=cls._create_system_state_snapshot(tick, system),
                    safety_step=step_snap,
                    metrics=compute_deadlock_metrics(
                        system,
                        is_safe=None,
                        safe_sequence=list(step_snap.safe_sequence_so_far),
                    ).to_dict(),
                )
            )

        final_metrics = compute_deadlock_metrics(
            system,
            is_safe=safety_res.is_safe,
            safe_sequence=list(safety_res.safe_sequence),
            safety_checks=1,
        )

        # Final snapshot
        final_tick = len(timeline)
        final_desc = (
            f"Safety evaluation complete: System is SAFE. Safe Sequence: {' -> '.join(safety_res.safe_sequence)}."
            if safety_res.is_safe
            else "Safety evaluation complete: System is UNSAFE."
        )
        timeline.append(
            DeadlockTimelineSnapshot(
                tick=final_tick,
                description=final_desc,
                system_state=cls._create_system_state_snapshot(final_tick, system),
                metrics=final_metrics.to_dict(),
            )
        )

        rag = GraphAnalyzer.build_rag(system)
        wfg = GraphAnalyzer.build_wfg(system) if system.is_single_instance_system else None

        return DeadlockSimulationResult(
            mode="SAFETY",
            system=system,
            timeline=tuple(timeline),
            events=tuple(events),
            metrics=final_metrics,
            rag_snapshot=rag,
            wfg_snapshot=wfg,
            is_safe=safety_res.is_safe,
            safe_sequence=safety_res.safe_sequence,
        )

    @classmethod
    def simulate_request(
        cls,
        system: ResourceSystem,
        process_id: str,
        request_vector: List[int],
    ) -> DeadlockSimulationResult:
        """Simulates resource request validation, tentative allocation, safety check, and grant/deny."""
        events: List[DeadlockEvent] = []
        timeline: List[DeadlockTimelineSnapshot] = []

        # Tick 0: Baseline State
        events.append(
            create_deadlock_event(
                tick=0,
                seq=0,
                event_type=DeadlockEventType.SYSTEM_INITIALIZED,
                component="RESOURCE_MANAGER",
                description=f"Baseline system state initialized before request by {process_id}.",
            )
        )
        timeline.append(
            DeadlockTimelineSnapshot(
                tick=0,
                description=f"Baseline state before request by {process_id}",
                system_state=cls._create_system_state_snapshot(0, system),
            )
        )

        req_res = BankerAlgorithm.evaluate_request(system, process_id, request_vector, start_tick=1)
        for ev in req_res.events:
            events.append(ev)

        # Tick 1: Request Evaluation Snapshot
        timeline.append(
            DeadlockTimelineSnapshot(
                tick=1,
                description=req_res.reason,
                system_state=cls._create_system_state_snapshot(
                    1, req_res.tentative_state if req_res.tentative_state else system
                ),
                request_step=req_res.snapshot,
            )
        )

        # Tick 2: Final state
        granted = 1 if req_res.decision.value == "GRANTED" else 0
        waiting = 1 if req_res.decision.value == "WAITING" else 0
        denied = 1 if req_res.decision.value == "DENIED" else 0

        final_metrics = compute_deadlock_metrics(
            req_res.resulting_system,
            is_safe=req_res.is_safe,
            safe_sequence=list(req_res.safe_sequence) if req_res.safe_sequence else [],
            request_count=1,
            granted_requests=granted,
            waiting_requests=waiting,
            denied_requests=denied,
            safety_checks=1 if req_res.safety_result else 0,
        )

        timeline.append(
            DeadlockTimelineSnapshot(
                tick=2,
                description=f"Final outcome: {req_res.decision.value}. {req_res.reason}",
                system_state=cls._create_system_state_snapshot(2, req_res.resulting_system),
                metrics=final_metrics.to_dict(),
            )
        )

        rag = GraphAnalyzer.build_rag(req_res.resulting_system)
        wfg = GraphAnalyzer.build_wfg(req_res.resulting_system) if req_res.resulting_system.is_single_instance_system else None

        return DeadlockSimulationResult(
            mode="REQUEST",
            system=req_res.resulting_system,
            timeline=tuple(timeline),
            events=tuple(events),
            metrics=final_metrics,
            rag_snapshot=rag,
            wfg_snapshot=wfg,
            is_safe=req_res.is_safe,
            safe_sequence=req_res.safe_sequence,
            request_result=req_res,
        )

    @classmethod
    def simulate_detection(cls, system: ResourceSystem) -> DeadlockSimulationResult:
        """Runs the matrix reduction deadlock detection algorithm and constructs step-by-step timeline."""
        events: List[DeadlockEvent] = []
        timeline: List[DeadlockTimelineSnapshot] = []

        # Tick 0: Initial State
        events.append(
            create_deadlock_event(
                tick=0,
                seq=0,
                event_type=DeadlockEventType.SYSTEM_INITIALIZED,
                component="DEADLOCK_DETECTOR",
                description=f"Deadlock detection initialized for {system.process_count} processes.",
            )
        )
        timeline.append(
            DeadlockTimelineSnapshot(
                tick=0,
                description="Initial System Allocation & Request State",
                system_state=cls._create_system_state_snapshot(0, system),
            )
        )

        det_res = DeadlockDetector.detect(system, start_tick=1)
        for ev in det_res.events:
            events.append(ev)

        # Timeline steps for each reduced process
        for idx, step_snap in enumerate(det_res.steps):
            tick = idx + 1
            timeline.append(
                DeadlockTimelineSnapshot(
                    tick=tick,
                    description=step_snap.description,
                    system_state=cls._create_system_state_snapshot(tick, system),
                    detection_step=step_snap,
                )
            )

        final_metrics = compute_deadlock_metrics(
            system,
            is_deadlocked=det_res.is_deadlocked,
            deadlocked_processes=list(det_res.deadlocked_processes),
            detection_checks=1,
        )

        final_tick = len(timeline)
        final_desc = (
            f"Detection complete: DEADLOCK DETECTED involving processes {list(det_res.deadlocked_processes)}."
            if det_res.is_deadlocked
            else "Detection complete: NO DEADLOCK. All processes reduced to completion."
        )
        timeline.append(
            DeadlockTimelineSnapshot(
                tick=final_tick,
                description=final_desc,
                system_state=cls._create_system_state_snapshot(final_tick, system),
                metrics=final_metrics.to_dict(),
            )
        )

        return DeadlockSimulationResult(
            mode="DETECTION",
            system=system,
            timeline=tuple(timeline),
            events=tuple(events),
            metrics=final_metrics,
            rag_snapshot=det_res.rag_snapshot,
            wfg_snapshot=det_res.wfg_snapshot,
            is_deadlocked=det_res.is_deadlocked,
            deadlocked_processes=det_res.deadlocked_processes,
        )
