"""Deterministic Discrete-Time CPU Simulation Engine for OSim."""

from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple, Any
import uuid

from backend.sim_engine.core.base_scheduler import BaseScheduler
from backend.sim_engine.core.clock import SimulationClock
from backend.sim_engine.core.event import EventType, SimulationEvent
from backend.sim_engine.core.metrics import SimulationMetrics, compute_simulation_metrics
from backend.sim_engine.core.process import ProcessDefinition, ProcessSnapshot, ProcessState
from backend.sim_engine.core.state import CPUState, SystemState


@dataclass(frozen=True)
class GanttSegment:
    """Consolidated execution slice in the Gantt chart."""
    pid: Optional[str]
    start_time: int
    end_time: int
    is_context_switch: bool = False
    is_idle: bool = False

    def to_dict(self) -> Dict[str, Any]:
        return {
            "pid": self.pid,
            "start_time": self.start_time,
            "end_time": self.end_time,
            "duration": self.end_time - self.start_time,
            "is_context_switch": self.is_context_switch,
            "is_idle": self.is_idle,
        }


@dataclass
class SimulationResult:
    """Complete simulation result containing timeline, events, Gantt segments, and metrics."""
    scheduler_name: str
    timeline: List[SystemState]
    events: List[SimulationEvent]
    gantt_segments: List[GanttSegment]
    metrics: SimulationMetrics
    terminated_normally: bool

    def to_dict(self, decimal_places: int = 2) -> Dict[str, Any]:
        return {
            "scheduler_name": self.scheduler_name,
            "terminated_normally": self.terminated_normally,
            "timeline": [state.to_dict() for state in self.timeline],
            "events": [event.to_dict() for event in self.events],
            "gantt_segments": [seg.to_dict() for seg in self.gantt_segments],
            "metrics": self.metrics.to_dict(decimal_places=decimal_places),
        }


class CPUSimulationEngine:
    """Discrete-time CPU simulation engine.
    
    Executes a tick-by-tick simulation loop:
    SystemState(t) -> Subsystem Evaluation -> SimulationEvent(t) -> State Reducer -> SystemState(t+1)
    """

    def __init__(
        self,
        scheduler: BaseScheduler,
        processes: List[ProcessDefinition],
        context_switch_overhead: int = 0,
        max_ticks: int = 2000,
    ):
        if context_switch_overhead < 0:
            raise ValueError(f"context_switch_overhead must be >= 0, got {context_switch_overhead}")
        if max_ticks <= 0:
            raise ValueError(f"max_ticks must be > 0, got {max_ticks}")

        self._scheduler = scheduler
        self._initial_process_defs = processes
        self._context_switch_overhead = context_switch_overhead
        self._max_ticks = max_ticks

        self._clock = SimulationClock(0)
        self._events: List[SimulationEvent] = []
        self._timeline: List[SystemState] = []
        self._tick_records: List[Tuple[Optional[str], bool, bool]] = []  # (pid, is_cs, is_idle)

        # Mutable simulation tracking
        self._processes: Dict[str, dict] = {}
        self._ready_queue: List[str] = []
        self._waiting_queue: List[str] = []
        self._terminated_pids: List[str] = []

        # CPU tracking
        self._running_pid: Optional[str] = None
        self._pending_switch_pid: Optional[str] = None
        self._context_switch_remaining: int = 0
        self._quantum_elapsed: int = 0
        self._total_busy_ticks: int = 0
        self._total_idle_ticks: int = 0
        self._total_cs_ticks: int = 0
        self._context_switch_count: int = 0

        self._event_counter = 0

    def _generate_event_id(self) -> str:
        self._event_counter += 1
        return f"evt_{self._event_counter:05d}"

    def _emit_event(
        self,
        event_type: EventType,
        description: str,
        details: Optional[Dict[str, Any]] = None,
    ) -> SimulationEvent:
        event = SimulationEvent(
            event_id=self._generate_event_id(),
            tick=self._clock.current_tick,
            event_type=event_type,
            component="CPU_SCHEDULER",
            description=description,
            details=details or {},
        )
        self._events.append(event)
        return event

    def _capture_process_snapshot(self, pid: str) -> ProcessSnapshot:
        p = self._processes[pid]
        current_tick = self._clock.current_tick
        waiting = p["waiting_time"]
        turnaround = p["turnaround_time"]

        if p["completion_time"] is not None:
            turnaround = p["completion_time"] - p["arrival_time"]
            waiting = turnaround - p["burst_time"]
        elif p["state"] in (ProcessState.READY, ProcessState.WAITING):
            pass

        response = (p["start_time"] - p["arrival_time"]) if p["start_time"] is not None else None

        return ProcessSnapshot(
            pid=pid,
            arrival_time=p["arrival_time"],
            burst_time=p["burst_time"],
            remaining_time=p["remaining_time"],
            priority=p["priority"],
            state=p["state"],
            executed_time=p["executed_time"],
            start_time=p["start_time"],
            completion_time=p["completion_time"],
            waiting_time=waiting,
            turnaround_time=turnaround,
            response_time=response,
            queue_level=p["queue_level"],
            memory_required=p["memory_required"],
        )

    def _capture_system_state(self) -> SystemState:
        snapshots = {pid: self._capture_process_snapshot(pid) for pid in self._processes}
        cpu_state = CPUState(
            running_pid=self._running_pid,
            is_context_switching=(self._context_switch_remaining > 0),
            context_switch_remaining=self._context_switch_remaining,
            current_quantum_remaining=max(
                0,
                getattr(self._scheduler, "time_quantum", 0) - self._quantum_elapsed
            ) if hasattr(self._scheduler, "time_quantum") else 0,
            total_busy_ticks=self._total_busy_ticks,
            total_idle_ticks=self._total_idle_ticks,
            total_context_switch_ticks=self._total_cs_ticks,
        )
        return SystemState(
            clock=self._clock.current_tick,
            cpu=cpu_state,
            processes=snapshots,
            ready_queue=tuple(self._ready_queue),
            waiting_queue=tuple(self._waiting_queue),
            terminated_pids=tuple(self._terminated_pids),
        )

    def _initialize(self):
        """Setup initial processes and state at t=0."""
        for pdef in sorted(self._initial_process_defs, key=lambda p: (p.arrival_time, p.pid)):
            self._processes[pdef.pid] = {
                "pid": pdef.pid,
                "arrival_time": pdef.arrival_time,
                "burst_time": pdef.burst_time,
                "remaining_time": pdef.burst_time,
                "priority": pdef.priority,
                "state": ProcessState.NEW,
                "executed_time": 0,
                "start_time": None,
                "completion_time": None,
                "waiting_time": 0,
                "turnaround_time": 0,
                "queue_level": 0,
                "memory_required": pdef.memory_required,
            }

    def _check_arrivals(self, tick: int) -> List[str]:
        """Check and process newly arriving processes at tick."""
        arrived_pids: List[str] = []
        for pid, p in self._processes.items():
            if p["state"] == ProcessState.NEW and p["arrival_time"] <= tick:
                arrived_pids.append(pid)

        # Sort arrived processes deterministically: arrival_time, then pid
        arrived_pids.sort(key=lambda x: (self._processes[x]["arrival_time"], x))

        for pid in arrived_pids:
            p = self._processes[pid]
            # Edge case: zero burst time process
            if p["burst_time"] == 0:
                p["state"] = ProcessState.TERMINATED
                p["start_time"] = tick
                p["completion_time"] = tick
                p["turnaround_time"] = 0
                p["waiting_time"] = 0
                self._terminated_pids.append(pid)
                self._emit_event(
                    EventType.PROCESS_ARRIVED,
                    f"Process {pid} arrived with zero burst time.",
                    {"pid": pid, "burst_time": 0},
                )
                self._emit_event(
                    EventType.PROCESS_TERMINATED,
                    f"Process {pid} terminated immediately (zero burst time).",
                    {"pid": pid},
                )
            else:
                p["state"] = ProcessState.READY
                self._scheduler.on_process_arrived(
                    pid,
                    self._ready_queue,
                    {k: self._capture_process_snapshot(k) for k in self._processes}
                )
                self._emit_event(
                    EventType.PROCESS_ARRIVED,
                    f"Process {pid} arrived and entered READY queue.",
                    {"pid": pid, "burst_time": p["burst_time"], "priority": p["priority"]},
                )

        return arrived_pids

    def _all_terminated(self) -> bool:
        return len(self._terminated_pids) == len(self._processes)

    def run(self) -> SimulationResult:
        """Run the complete simulation deterministically."""
        self._initialize()

        # Record initial state at t=0
        self._timeline.append(self._capture_system_state())

        while not self._all_terminated() and self._clock.current_tick < self._max_ticks:
            t = self._clock.current_tick

            # 1. Process arrivals for current tick
            self._check_arrivals(t)

            if self._all_terminated():
                break

            # 2. Handle ongoing context switch
            if self._context_switch_remaining > 0:
                # Active context switch tick
                self._total_cs_ticks += 1
                self._tick_records.append((None, True, False))
                self._context_switch_remaining -= 1

                # If context switch completes at end of this tick
                if self._context_switch_remaining == 0 and self._pending_switch_pid is not None:
                    target_pid = self._pending_switch_pid
                    self._pending_switch_pid = None
                    self._dispatch_process(target_pid, t + 1)
                    self._emit_event(
                        EventType.CONTEXT_SWITCH_FINISHED,
                        f"Context switch finished. Dispatching {target_pid}.",
                        {"target_pid": target_pid},
                    )

                self._advance_waiting_processes()
                self._clock.advance(1)
                self._timeline.append(self._capture_system_state())
                continue

            # 3. Check preemption of running process (if one is currently running)
            if self._running_pid is not None:
                curr_pid = self._running_pid
                snapshots = {k: self._capture_process_snapshot(k) for k in self._processes}
                should_preempt, target_pid = self._scheduler.should_preempt(
                    curr_pid,
                    self._ready_queue,
                    t,
                    snapshots,
                    self._quantum_elapsed,
                )
                if should_preempt:
                    self._emit_event(
                        EventType.PROCESS_PREEMPTED,
                        f"Process {curr_pid} preempted.",
                        {"preempted_pid": curr_pid, "quantum_elapsed": self._quantum_elapsed},
                    )
                    # Move preempted process back to ready
                    self._processes[curr_pid]["state"] = ProcessState.READY
                    self._ready_queue.append(curr_pid)
                    self._running_pid = None
                    self._quantum_elapsed = 0

                    # If context switch overhead > 0, begin context switch
                    if self._context_switch_overhead > 0 and len(self._ready_queue) > 0:
                        next_pid = self._scheduler.select_next(self._ready_queue, None, t, snapshots)
                        if next_pid and next_pid in self._ready_queue:
                            self._ready_queue.remove(next_pid)
                        self._start_context_switch(next_pid, t)
                        # Count this tick as context switch
                        self._total_cs_ticks += 1
                        self._tick_records.append((None, True, False))
                        self._context_switch_remaining -= 1
                        if self._context_switch_remaining == 0 and self._pending_switch_pid is not None:
                            p_target = self._pending_switch_pid
                            self._pending_switch_pid = None
                            self._dispatch_process(p_target, t + 1)
                            self._emit_event(
                                EventType.CONTEXT_SWITCH_FINISHED,
                                f"Context switch finished. Dispatching {p_target}.",
                                {"target_pid": p_target},
                            )

                        self._advance_waiting_processes()
                        self._clock.advance(1)
                        self._timeline.append(self._capture_system_state())
                        continue

            # 4. If CPU is free, select next process to run
            if self._running_pid is None:
                snapshots = {k: self._capture_process_snapshot(k) for k in self._processes}
                next_pid = self._scheduler.select_next(
                    self._ready_queue,
                    None,
                    t,
                    snapshots,
                )
                if next_pid is not None:
                    if next_pid in self._ready_queue:
                        self._ready_queue.remove(next_pid)

                    if self._context_switch_overhead > 0 and len(self._tick_records) > 0 and self._tick_records[-1][0] is not None and self._tick_records[-1][0] != next_pid:
                        # Context switch between different processes
                        self._start_context_switch(next_pid, t)
                        self._total_cs_ticks += 1
                        self._tick_records.append((None, True, False))
                        self._context_switch_remaining -= 1
                        if self._context_switch_remaining == 0 and self._pending_switch_pid is not None:
                            p_target = self._pending_switch_pid
                            self._pending_switch_pid = None
                            self._dispatch_process(p_target, t + 1)
                            self._emit_event(
                                EventType.CONTEXT_SWITCH_FINISHED,
                                f"Context switch finished. Dispatching {p_target}.",
                                {"target_pid": p_target},
                            )

                        self._advance_waiting_processes()
                        self._clock.advance(1)
                        self._timeline.append(self._capture_system_state())
                        continue
                    else:
                        self._dispatch_process(next_pid, t)
                else:
                    # CPU is IDLE
                    self._total_idle_ticks += 1
                    self._tick_records.append((None, False, True))
                    self._emit_event(
                        EventType.CPU_IDLE,
                        "CPU is idle (no ready processes).",
                        {"tick": t},
                    )
                    self._advance_waiting_processes()
                    self._clock.advance(1)
                    self._timeline.append(self._capture_system_state())
                    continue

            # 5. Execute 1 tick of the currently running process
            curr_pid = self._running_pid
            proc = self._processes[curr_pid]
            proc["remaining_time"] -= 1
            proc["executed_time"] += 1
            self._quantum_elapsed += 1
            self._total_busy_ticks += 1
            self._tick_records.append((curr_pid, False, False))

            # 6. Check if process terminates at end of this tick
            if proc["remaining_time"] == 0:
                proc["state"] = ProcessState.TERMINATED
                proc["completion_time"] = t + 1
                proc["turnaround_time"] = proc["completion_time"] - proc["arrival_time"]
                proc["waiting_time"] = proc["turnaround_time"] - proc["burst_time"]
                self._terminated_pids.append(curr_pid)
                self._running_pid = None
                self._quantum_elapsed = 0

                self._emit_event(
                    EventType.PROCESS_TERMINATED,
                    f"Process {curr_pid} terminated at tick {t + 1}.",
                    {
                        "pid": curr_pid,
                        "completion_time": t + 1,
                        "turnaround_time": proc["turnaround_time"],
                        "waiting_time": proc["waiting_time"],
                    },
                )

            self._advance_waiting_processes()
            self._clock.advance(1)
            self._timeline.append(self._capture_system_state())

        # Compile Gantt chart segments from tick records
        gantt_segments = self._build_gantt_segments()

        # Compute metrics
        final_snapshots = {pid: self._capture_process_snapshot(pid) for pid in self._processes}
        metrics = compute_simulation_metrics(
            processes=final_snapshots,
            total_simulation_time=self._clock.current_tick,
            total_busy_ticks=self._total_busy_ticks,
            total_idle_ticks=self._total_idle_ticks,
            total_context_switch_ticks=self._total_cs_ticks,
            context_switch_count=self._context_switch_count,
        )

        # Validate all invariants
        self._validate_invariants(final_snapshots)

        return SimulationResult(
            scheduler_name=self._scheduler.name,
            timeline=self._timeline,
            events=self._events,
            gantt_segments=gantt_segments,
            metrics=metrics,
            terminated_normally=self._all_terminated(),
        )

    def _start_context_switch(self, target_pid: str, tick: int):
        self._context_switch_count += 1
        self._context_switch_remaining = self._context_switch_overhead
        self._pending_switch_pid = target_pid
        self._emit_event(
            EventType.CONTEXT_SWITCH_STARTED,
            f"Context switch started to {target_pid} (overhead: {self._context_switch_overhead} ticks).",
            {"target_pid": target_pid, "overhead": self._context_switch_overhead},
        )

    def _dispatch_process(self, pid: str, tick: int):
        self._running_pid = pid
        p = self._processes[pid]
        p["state"] = ProcessState.RUNNING
        if p["start_time"] is None:
            p["start_time"] = tick
        self._quantum_elapsed = 0
        self._emit_event(
            EventType.PROCESS_SCHEDULED,
            f"Process {pid} scheduled on CPU.",
            {
                "pid": pid,
                "remaining_time": p["remaining_time"],
                "start_time": p["start_time"],
            },
        )

    def _advance_waiting_processes(self):
        """Update waiting time counter for all ready processes."""
        for pid in self._ready_queue:
            if self._processes[pid]["state"] == ProcessState.READY:
                self._processes[pid]["waiting_time"] += 1

    def _build_gantt_segments(self) -> List[GanttSegment]:
        """Consolidate contiguous tick records into Gantt segments."""
        if not self._tick_records:
            return []

        segments: List[GanttSegment] = []
        current_pid, current_cs, current_idle = self._tick_records[0]
        start_tick = 0

        for tick, (pid, is_cs, is_idle) in enumerate(self._tick_records[1:], start=1):
            if (pid != current_pid) or (is_cs != current_cs) or (is_idle != current_idle):
                segments.append(
                    GanttSegment(
                        pid=current_pid,
                        start_time=start_tick,
                        end_time=tick,
                        is_context_switch=current_cs,
                        is_idle=current_idle,
                    )
                )
                current_pid, current_cs, current_idle = pid, is_cs, is_idle
                start_tick = tick

        # Append last segment
        segments.append(
            GanttSegment(
                pid=current_pid,
                start_time=start_tick,
                end_time=len(self._tick_records),
                is_context_switch=current_cs,
                is_idle=current_idle,
            )
        )
        return segments

    def _validate_invariants(self, final_snapshots: Dict[str, ProcessSnapshot]):
        """Strictly assert all Phase 1 invariants."""
        # 1. Total count preserved
        assert len(final_snapshots) == len(self._initial_process_defs), (
            f"Invariant violation: Process count mismatch ({len(final_snapshots)} vs {len(self._initial_process_defs)})"
        )

        # 2. Process conservation & work conservation
        for pid, proc in final_snapshots.items():
            assert proc.burst_time == proc.executed_time + proc.remaining_time, (
                f"Invariant violation for {pid}: burst ({proc.burst_time}) != executed ({proc.executed_time}) + remaining ({proc.remaining_time})"
            )
            if proc.state == ProcessState.TERMINATED:
                assert proc.remaining_time == 0, f"Invariant violation for {pid}: terminated with remaining_time > 0"
                assert proc.completion_time is not None, f"Invariant violation for {pid}: terminated without completion_time"
                assert proc.start_time is not None, f"Invariant violation for {pid}: terminated without start_time"
                expected_turnaround = proc.completion_time - proc.arrival_time
                assert proc.turnaround_time == expected_turnaround, (
                    f"Invariant violation for {pid}: turnaround ({proc.turnaround_time}) != completion ({proc.completion_time}) - arrival ({proc.arrival_time})"
                )
                expected_waiting = proc.turnaround_time - proc.burst_time
                assert proc.waiting_time == expected_waiting, (
                    f"Invariant violation for {pid}: waiting ({proc.waiting_time}) != turnaround ({proc.turnaround_time}) - burst ({proc.burst_time})"
                )
                assert proc.response_time == (proc.start_time - proc.arrival_time), (
                    f"Invariant violation for {pid}: response time mismatch"
                )

        # 3. Sum of execution ticks equals total process burst executed
        total_executed = sum(p.executed_time for p in final_snapshots.values())
        assert self._total_busy_ticks == total_executed, (
            f"Invariant violation: total_busy_ticks ({self._total_busy_ticks}) != total executed ({total_executed})"
        )

        # 4. Total simulation time equals busy + idle + context switch ticks
        assert self._clock.current_tick == (self._total_busy_ticks + self._total_idle_ticks + self._total_cs_ticks), (
            f"Invariant violation: clock ({self._clock.current_tick}) != busy ({self._total_busy_ticks}) + idle ({self._total_idle_ticks}) + cs ({self._total_cs_ticks})"
        )
