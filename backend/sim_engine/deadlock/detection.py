"""Deadlock detection algorithms: Multi-instance matrix reduction and single-instance WFG evaluation."""

from dataclasses import dataclass
from typing import List, Tuple, Dict, Any, Optional
from backend.sim_engine.deadlock.models import ResourceSystem
from backend.sim_engine.deadlock.state import DetectionStepSnapshot
from backend.sim_engine.deadlock.event import DeadlockEvent, DeadlockEventType, create_deadlock_event
from backend.sim_engine.deadlock.graph import GraphAnalyzer, GraphSnapshot


@dataclass(frozen=True)
class DeadlockDetectionResult:
    """Result of deadlock detection analysis with complete step-by-step reduction history."""
    is_deadlocked: bool
    deadlocked_processes: Tuple[str, ...]
    unreduced_count: int
    steps: Tuple[DetectionStepSnapshot, ...]
    events: Tuple[DeadlockEvent, ...]
    rag_snapshot: GraphSnapshot
    wfg_snapshot: Optional[GraphSnapshot] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "is_deadlocked": self.is_deadlocked,
            "deadlocked_processes": list(self.deadlocked_processes),
            "unreduced_count": self.unreduced_count,
            "steps": [s.to_dict() for s in self.steps],
            "events": [e.to_dict() for e in self.events],
            "rag_snapshot": self.rag_snapshot.to_dict(),
            "wfg_snapshot": self.wfg_snapshot.to_dict() if self.wfg_snapshot else None,
        }


class DeadlockDetector:
    """Executes the standard multi-instance matrix reduction algorithm using the Request matrix."""

    @staticmethod
    def detect(system: ResourceSystem, start_tick: int = 0) -> DeadlockDetectionResult:
        n = system.process_count
        m = system.resource_count

        work = list(system.available)
        # Finish[i] = True if Allocation[i] is all zeros; False otherwise
        finish = [all(system.allocation[i][j] == 0 for j in range(m)) for i in range(n)]

        steps: List[DetectionStepSnapshot] = []
        events: List[DeadlockEvent] = []
        tick = start_tick
        seq = 0

        # Initial event
        events.append(
            create_deadlock_event(
                tick=tick,
                seq=seq,
                event_type=DeadlockEventType.DETECTION_STARTED,
                component="DEADLOCK_DETECTOR",
                description=f"Deadlock detection matrix reduction initiated for {n} processes and {m} resources.",
                details={"initial_available": list(work), "zero_allocation_finish": list(finish)},
            )
        )
        seq += 1

        step_idx = 0
        while True:
            # Find the lowest-index unfinished process whose Request <= Work
            found_idx: Optional[int] = None
            for i in range(n):
                if not finish[i]:
                    can_satisfy = all(system.request[i][j] <= work[j] for j in range(m))
                    if can_satisfy:
                        found_idx = i
                        break

            if found_idx is None:
                # No more processes can be satisfied/reduced
                break

            p_id = system.processes[found_idx].id
            work_before = tuple(work)

            # Reduce process: release its allocated resources into Work
            for j in range(m):
                work[j] += system.allocation[found_idx][j]
            finish[found_idx] = True

            work_after = tuple(work)
            unreduced = tuple(system.processes[i].id for i in range(n) if not finish[i])

            step_snapshot = DetectionStepSnapshot(
                step_index=step_idx,
                evaluated_process=p_id,
                work_before=work_before,
                work_after=work_after,
                finish_vector=tuple(finish),
                is_reduced=True,
                unreduced_processes=unreduced,
                description=f"Process {p_id} Request <= Work; reduced and released Allocation into Work.",
            )
            steps.append(step_snapshot)

            events.append(
                create_deadlock_event(
                    tick=tick,
                    seq=seq,
                    event_type=DeadlockEventType.PROCESS_REDUCED,
                    component="DEADLOCK_DETECTOR",
                    description=f"Process {p_id} Request satisfied by Work; released allocation into Work.",
                    details={
                        "process_id": p_id,
                        "work_after": list(work_after),
                        "remaining_unreduced": list(unreduced),
                    },
                )
            )
            seq += 1
            step_idx += 1

        deadlocked_procs = tuple(system.processes[i].id for i in range(n) if not finish[i])
        is_deadlocked = len(deadlocked_procs) > 0

        final_event_type = DeadlockEventType.DEADLOCK_CONFIRMED if is_deadlocked else DeadlockEventType.NO_DEADLOCK_CONFIRMED
        final_desc = (
            f"Deadlock detected! Processes {list(deadlocked_procs)} cannot be reduced."
            if is_deadlocked
            else "No deadlock detected; all processes reduced to completion."
        )
        events.append(
            create_deadlock_event(
                tick=tick,
                seq=seq,
                event_type=final_event_type,
                component="DEADLOCK_DETECTOR",
                description=final_desc,
                details={
                    "is_deadlocked": is_deadlocked,
                    "deadlocked_processes": list(deadlocked_procs),
                    "final_work": list(work),
                },
            )
        )

        rag_snapshot = GraphAnalyzer.build_rag(system)
        wfg_snapshot = GraphAnalyzer.build_wfg(system) if system.is_single_instance_system else None

        return DeadlockDetectionResult(
            is_deadlocked=is_deadlocked,
            deadlocked_processes=deadlocked_procs,
            unreduced_count=len(deadlocked_procs),
            steps=tuple(steps),
            events=tuple(events),
            rag_snapshot=rag_snapshot,
            wfg_snapshot=wfg_snapshot,
        )
