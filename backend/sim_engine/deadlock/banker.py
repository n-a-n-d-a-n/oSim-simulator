"""Banker's Algorithm: Deadlock avoidance safety analysis and resource request evaluation."""

from dataclasses import dataclass
from typing import List, Tuple, Dict, Any, Optional
from backend.sim_engine.deadlock.models import ResourceSystem, DomainValidationError
from backend.sim_engine.deadlock.state import (
    SafetyStepSnapshot,
    RequestOutcome,
    RequestEvaluationSnapshot,
)
from backend.sim_engine.deadlock.event import DeadlockEvent, DeadlockEventType, create_deadlock_event


@dataclass(frozen=True)
class BankerSafetyResult:
    """Detailed result of the Banker's safety algorithm."""
    is_safe: bool
    safe_sequence: Tuple[str, ...]
    steps: Tuple[SafetyStepSnapshot, ...]
    events: Tuple[DeadlockEvent, ...]

    def to_dict(self) -> Dict[str, Any]:
        return {
            "is_safe": self.is_safe,
            "safe_sequence": list(self.safe_sequence),
            "steps": [s.to_dict() for s in self.steps],
            "events": [e.to_dict() for e in self.events],
        }


@dataclass(frozen=True)
class ResourceRequestResult:
    """Outcome of a resource request evaluation."""
    decision: RequestOutcome
    reason: str
    requesting_process_id: str
    request_vector: Tuple[int, ...]
    is_safe: Optional[bool]
    safe_sequence: Optional[Tuple[str, ...]]
    tentative_state: Optional[ResourceSystem]
    resulting_system: ResourceSystem
    snapshot: RequestEvaluationSnapshot
    safety_result: Optional[BankerSafetyResult]
    events: Tuple[DeadlockEvent, ...]

    def to_dict(self) -> Dict[str, Any]:
        return {
            "process_id": self.requesting_process_id,
            "request_vector": list(self.request_vector),
            "decision": self.decision.value,
            "reason": self.reason,
            "tentative_available": list(self.snapshot.tentative_available) if self.snapshot.tentative_available else None,
            "tentative_allocation": [list(r) for r in self.snapshot.tentative_allocation] if self.snapshot.tentative_allocation else None,
            "tentative_need": [list(r) for r in self.snapshot.tentative_need] if self.snapshot.tentative_need else None,
            "safe_sequence": list(self.safe_sequence) if self.safe_sequence else None,
        }



class BankerAlgorithm:
    """Implementation of Banker's safety algorithm and resource request evaluator."""

    @staticmethod
    def evaluate_safety(system: ResourceSystem, start_tick: int = 0) -> BankerSafetyResult:
        """Runs the classic Banker's safety algorithm using the Need matrix and Available vector."""
        n = system.process_count
        m = system.resource_count

        work = list(system.available)
        finish = [False] * n
        safe_seq: List[str] = []

        steps: List[SafetyStepSnapshot] = []
        events: List[DeadlockEvent] = []
        tick = start_tick
        seq = 0

        events.append(
            create_deadlock_event(
                tick=tick,
                seq=seq,
                event_type=DeadlockEventType.SAFETY_EVALUATION_STARTED,
                component="BANKER_AVOIDANCE",
                description=f"Banker safety evaluation started for {n} processes and {m} resources.",
                details={"initial_work": list(work)},
            )
        )
        seq += 1

        step_idx = 0
        while True:
            # Deterministic lowest process index tie-breaking
            found_idx: Optional[int] = None
            for i in range(n):
                if not finish[i]:
                    can_satisfy = all(system.need[i][j] <= work[j] for j in range(m))
                    if can_satisfy:
                        found_idx = i
                        break

            if found_idx is None:
                # No remaining unfinished process can be satisfied by current Work
                break

            p_id = system.processes[found_idx].id
            work_before = tuple(work)

            # Process runs to completion and releases its Allocation back into Work
            for j in range(m):
                work[j] += system.allocation[found_idx][j]
            finish[found_idx] = True
            safe_seq.append(p_id)

            work_after = tuple(work)
            curr_seq = tuple(safe_seq)

            steps.append(
                SafetyStepSnapshot(
                    step_index=step_idx,
                    evaluated_process=p_id,
                    work_before=work_before,
                    work_after=work_after,
                    finish_vector=tuple(finish),
                    is_satisfied=True,
                    safe_sequence_so_far=curr_seq,
                    description=f"Process {p_id} Need <= Work; marked finishable and added to safe sequence.",
                )
            )

            events.append(
                create_deadlock_event(
                    tick=tick,
                    seq=seq,
                    event_type=DeadlockEventType.PROCESS_MARKED_FINISHABLE,
                    component="BANKER_AVOIDANCE",
                    description=f"Process {p_id} marked finishable; Work updated to {list(work_after)}.",
                    details={"process_id": p_id, "safe_sequence_so_far": list(curr_seq)},
                )
            )
            seq += 1
            step_idx += 1

        is_safe = all(finish)
        final_event = DeadlockEventType.SAFE_STATE_CONFIRMED if is_safe else DeadlockEventType.UNSAFE_STATE_CONFIRMED
        final_desc = (
            f"System is in a SAFE state. Safe sequence: {' -> '.join(safe_seq)}."
            if is_safe
            else "System is in an UNSAFE state. No complete safe sequence exists."
        )

        events.append(
            create_deadlock_event(
                tick=tick,
                seq=seq,
                event_type=final_event,
                component="BANKER_AVOIDANCE",
                description=final_desc,
                details={"is_safe": is_safe, "safe_sequence": safe_seq, "final_work": list(work)},
            )
        )

        return BankerSafetyResult(
            is_safe=is_safe,
            safe_sequence=tuple(safe_seq),
            steps=tuple(steps),
            events=tuple(events),
        )

    @staticmethod
    def evaluate_request(
        system: ResourceSystem,
        process_id: str,
        request_vector: List[int],
        start_tick: int = 0,
    ) -> ResourceRequestResult:
        """Evaluates a resource request issued by process_id according to Banker's algorithm."""
        tick = start_tick
        seq = 0
        events: List[DeadlockEvent] = []

        events.append(
            create_deadlock_event(
                tick=tick,
                seq=seq,
                event_type=DeadlockEventType.RESOURCE_REQUEST_SUBMITTED,
                component="BANKER_AVOIDANCE",
                description=f"Process {process_id} submitted resource request: {request_vector}.",
                details={"process_id": process_id, "request": request_vector},
            )
        )
        seq += 1

        # Check process exists
        try:
            p_idx = system.get_process_index(process_id)
        except DomainValidationError as e:
            reason = str(e)
            snap = RequestEvaluationSnapshot(
                process_id=process_id,
                request_vector=tuple(request_vector),
                decision=RequestOutcome.ERROR,
                reason=reason,
            )
            events.append(
                create_deadlock_event(
                    tick=tick,
                    seq=seq,
                    event_type=DeadlockEventType.REQUEST_CLAIM_EXCEEDED,
                    component="BANKER_AVOIDANCE",
                    description=reason,
                )
            )
            return ResourceRequestResult(
                decision=RequestOutcome.ERROR,
                reason=reason,
                requesting_process_id=process_id,
                request_vector=tuple(request_vector),
                is_safe=None,
                safe_sequence=None,
                tentative_state=None,
                resulting_system=system,
                snapshot=snap,
                safety_result=None,
                events=tuple(events),
            )

        m = system.resource_count
        if len(request_vector) != m:
            reason = f"Request vector length ({len(request_vector)}) does not match resource count ({m})."
            snap = RequestEvaluationSnapshot(
                process_id=process_id,
                request_vector=tuple(request_vector),
                decision=RequestOutcome.ERROR,
                reason=reason,
            )
            return ResourceRequestResult(
                decision=RequestOutcome.ERROR,
                reason=reason,
                requesting_process_id=process_id,
                request_vector=tuple(request_vector),
                is_safe=None,
                safe_sequence=None,
                tentative_state=None,
                resulting_system=system,
                snapshot=snap,
                safety_result=None,
                events=tuple(events),
            )

        for j, req_val in enumerate(request_vector):
            if req_val < 0:
                reason = f"Request for resource '{system.resource_types[j].id}' cannot be negative ({req_val})."
                snap = RequestEvaluationSnapshot(
                    process_id=process_id,
                    request_vector=tuple(request_vector),
                    decision=RequestOutcome.ERROR,
                    reason=reason,
                )
                return ResourceRequestResult(
                    decision=RequestOutcome.ERROR,
                    reason=reason,
                    requesting_process_id=process_id,
                    request_vector=tuple(request_vector),
                    is_safe=None,
                    safe_sequence=None,
                    tentative_state=None,
                    resulting_system=system,
                    snapshot=snap,
                    safety_result=None,
                    events=tuple(events),
                )

        # Step 1: Check Request <= Need
        for j in range(m):
            if request_vector[j] > system.need[p_idx][j]:
                reason = (
                    f"Claim exceeded: Process {process_id} requested {request_vector[j]} units of "
                    f"'{system.resource_types[j].id}', but maximum remaining Need is only {system.need[p_idx][j]}."
                )
                snap = RequestEvaluationSnapshot(
                    process_id=process_id,
                    request_vector=tuple(request_vector),
                    decision=RequestOutcome.ERROR,
                    reason=reason,
                )
                events.append(
                    create_deadlock_event(
                        tick=tick,
                        seq=seq,
                        event_type=DeadlockEventType.REQUEST_CLAIM_EXCEEDED,
                        component="BANKER_AVOIDANCE",
                        description=reason,
                    )
                )
                return ResourceRequestResult(
                    decision=RequestOutcome.ERROR,
                    reason=reason,
                    requesting_process_id=process_id,
                    request_vector=tuple(request_vector),
                    is_safe=None,
                    safe_sequence=None,
                    tentative_state=None,
                    resulting_system=system,
                    snapshot=snap,
                    safety_result=None,
                    events=tuple(events),
                )

        # Step 2: Check Request <= Available
        for j in range(m):
            if request_vector[j] > system.available[j]:
                reason = (
                    f"Insufficient available resources: Process {process_id} requested {request_vector[j]} units of "
                    f"'{system.resource_types[j].id}', but only {system.available[j]} units are currently Available. Process must WAIT."
                )
                snap = RequestEvaluationSnapshot(
                    process_id=process_id,
                    request_vector=tuple(request_vector),
                    decision=RequestOutcome.WAITING,
                    reason=reason,
                )
                events.append(
                    create_deadlock_event(
                        tick=tick,
                        seq=seq,
                        event_type=DeadlockEventType.REQUEST_WAITING,
                        component="BANKER_AVOIDANCE",
                        description=reason,
                    )
                )
                return ResourceRequestResult(
                    decision=RequestOutcome.WAITING,
                    reason=reason,
                    requesting_process_id=process_id,
                    request_vector=tuple(request_vector),
                    is_safe=None,
                    safe_sequence=None,
                    tentative_state=None,
                    resulting_system=system,
                    snapshot=snap,
                    safety_result=None,
                    events=tuple(events),
                )

        # Step 3: Tentative Allocation
        tentative_avail = list(system.available)
        tentative_alloc = [list(r) for r in system.allocation]
        tentative_need = [list(r) for r in system.need]
        tentative_max = [list(r) for r in system.maximum]

        for j in range(m):
            tentative_avail[j] -= request_vector[j]
            tentative_alloc[p_idx][j] += request_vector[j]
            tentative_need[p_idx][j] -= request_vector[j]

        tentative_sys = ResourceSystem.create(
            processes=[p.id for p in system.processes],
            resource_types=[r.id for r in system.resource_types],
            total=list(system.total),
            available=tentative_avail,
            allocation=tentative_alloc,
            maximum=tentative_max,
            request=[list(r) for r in system.request],
        )

        events.append(
            create_deadlock_event(
                tick=tick,
                seq=seq,
                event_type=DeadlockEventType.TENTATIVE_ALLOCATION_APPLIED,
                component="BANKER_AVOIDANCE",
                description=f"Tentative allocation applied for {process_id}; testing system safety.",
                details={"tentative_available": tentative_avail},
            )
        )
        seq += 1

        # Step 4: Safety evaluation on tentative state
        safety_result = BankerAlgorithm.evaluate_safety(tentative_sys, start_tick=tick + 1)
        for ev in safety_result.events:
            events.append(ev)

        if safety_result.is_safe:
            # Grant request: commit tentative system state
            reason = (
                f"Request GRANTED. System remains in a SAFE state with safe sequence: "
                f"{' -> '.join(safety_result.safe_sequence)}."
            )
            snap = RequestEvaluationSnapshot(
                process_id=process_id,
                request_vector=tuple(request_vector),
                decision=RequestOutcome.GRANTED,
                reason=reason,
                tentative_available=tuple(tentative_avail),
                tentative_allocation=tuple(tuple(r) for r in tentative_alloc),
                tentative_need=tuple(tuple(r) for r in tentative_need),
                safe_sequence=safety_result.safe_sequence,
            )
            events.append(
                create_deadlock_event(
                    tick=tick + 2,
                    seq=len(events),
                    event_type=DeadlockEventType.REQUEST_GRANTED,
                    component="BANKER_AVOIDANCE",
                    description=reason,
                    details={"safe_sequence": list(safety_result.safe_sequence)},
                )
            )
            return ResourceRequestResult(
                decision=RequestOutcome.GRANTED,
                reason=reason,
                requesting_process_id=process_id,
                request_vector=tuple(request_vector),
                is_safe=True,
                safe_sequence=safety_result.safe_sequence,
                tentative_state=tentative_sys,
                resulting_system=tentative_sys,
                snapshot=snap,
                safety_result=safety_result,
                events=tuple(events),
            )
        else:
            # Deny request: rollback to exact original system state
            reason = (
                f"Request DENIED. Granting request would transition system into an UNSAFE state. "
                f"State rolled back to initial condition; process {process_id} must wait."
            )
            snap = RequestEvaluationSnapshot(
                process_id=process_id,
                request_vector=tuple(request_vector),
                decision=RequestOutcome.DENIED,
                reason=reason,
                tentative_available=tuple(tentative_avail),
                tentative_allocation=tuple(tuple(r) for r in tentative_alloc),
                tentative_need=tuple(tuple(r) for r in tentative_need),
                safe_sequence=None,
            )
            events.append(
                create_deadlock_event(
                    tick=tick + 2,
                    seq=len(events),
                    event_type=DeadlockEventType.REQUEST_DENIED_ROLLBACK,
                    component="BANKER_AVOIDANCE",
                    description=reason,
                )
            )
            return ResourceRequestResult(
                decision=RequestOutcome.DENIED,
                reason=reason,
                requesting_process_id=process_id,
                request_vector=tuple(request_vector),
                is_safe=False,
                safe_sequence=None,
                tentative_state=tentative_sys,
                resulting_system=system,  # Exact structural rollback
                snapshot=snap,
                safety_result=safety_result,
                events=tuple(events),
            )

BankerAlgorithm.is_safe = BankerAlgorithm.evaluate_safety

