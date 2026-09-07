"""Tests for engine invariants, edge cases, context-switch overhead, and determinism."""

import pytest
from backend.sim_engine.core.process import ProcessDefinition, ProcessState
from backend.sim_engine.core.event import EventType
from backend.sim_engine.cpu.fcfs import FCFSScheduler
from backend.sim_engine.cpu.round_robin import RoundRobinScheduler
from backend.sim_engine.cpu.engine import CPUSimulationEngine


def test_cpu_idle_gap():
    """Test CPU idle periods when no process is ready."""
    procs = [
        ProcessDefinition(pid="P1", arrival_time=3, burst_time=2),
    ]
    engine = CPUSimulationEngine(scheduler=FCFSScheduler(), processes=procs)
    result = engine.run()

    assert result.terminated_normally
    assert result.metrics.total_idle_ticks == 3
    assert result.metrics.total_busy_ticks == 2
    assert result.metrics.total_simulation_time == 5
    # CPU utilization: 2 / 5 = 40.0%
    assert result.metrics.cpu_utilization_percent == 40.0

    # Gantt segments: first segment is IDLE (0..3), second is P1 (3..5)
    gantt = result.gantt_segments
    assert len(gantt) == 2
    assert gantt[0].is_idle is True
    assert (gantt[0].start_time, gantt[0].end_time) == (0, 3)
    assert gantt[1].pid == "P1"
    assert (gantt[1].start_time, gantt[1].end_time) == (3, 5)


def test_context_switch_overhead():
    """Verify context-switch overhead is counted as CS ticks, not process execution."""
    procs = [
        ProcessDefinition(pid="P1", arrival_time=0, burst_time=2),
        ProcessDefinition(pid="P2", arrival_time=0, burst_time=2),
    ]
    # Context switch overhead of 1 tick
    engine = CPUSimulationEngine(
        scheduler=FCFSScheduler(),
        processes=procs,
        context_switch_overhead=1,
    )
    result = engine.run()

    assert result.terminated_normally
    # P1 runs 0..2 (2 ticks)
    # Context switch between P1 and P2: 1 tick (2..3)
    # P2 runs 3..5 (2 ticks)
    assert result.metrics.total_busy_ticks == 4
    assert result.metrics.total_context_switch_ticks == 1
    assert result.metrics.total_simulation_time == 5
    assert result.metrics.context_switch_count == 1
    # Utilization should only count busy ticks: 4 / 5 = 80.0%
    assert result.metrics.cpu_utilization_percent == 80.0

    # Verify Gantt segments include context switch
    gantt = result.gantt_segments
    assert len(gantt) == 3
    assert (gantt[0].pid, gantt[0].start_time, gantt[0].end_time) == ("P1", 0, 2)
    assert gantt[1].is_context_switch is True
    assert (gantt[1].start_time, gantt[1].end_time) == (2, 3)
    assert (gantt[2].pid, gantt[2].start_time, gantt[2].end_time) == ("P2", 3, 5)


def test_zero_burst_process():
    """A process with zero burst time should terminate immediately upon arrival."""
    procs = [
        ProcessDefinition(pid="P0", arrival_time=2, burst_time=0),
        ProcessDefinition(pid="P1", arrival_time=0, burst_time=3),
    ]
    engine = CPUSimulationEngine(scheduler=FCFSScheduler(), processes=procs)
    result = engine.run()

    assert result.terminated_normally
    p0 = result.metrics.process_metrics["P0"]
    assert p0.turnaround_time == 0
    assert p0.waiting_time == 0
    assert p0.completion_time == 2


def test_max_ticks_safeguard():
    """Simulation terminates if max_ticks is reached before all processes complete."""
    procs = [ProcessDefinition(pid="P1", arrival_time=0, burst_time=50)]
    engine = CPUSimulationEngine(scheduler=FCFSScheduler(), processes=procs, max_ticks=10)
    result = engine.run()

    assert not result.terminated_normally
    assert result.metrics.total_simulation_time == 10


def test_deterministic_repeated_execution():
    """Running identical simulation inputs multiple times must produce identical outputs."""
    procs_factory = lambda: [
        ProcessDefinition(pid="P1", arrival_time=0, burst_time=7, priority=2),
        ProcessDefinition(pid="P2", arrival_time=2, burst_time=4, priority=1),
        ProcessDefinition(pid="P3", arrival_time=3, burst_time=5, priority=3),
    ]

    r1 = CPUSimulationEngine(RoundRobinScheduler(time_quantum=2), procs_factory()).run()
    r2 = CPUSimulationEngine(RoundRobinScheduler(time_quantum=2), procs_factory()).run()

    assert r1.to_dict() == r2.to_dict()


def test_event_stream_integrity():
    """Verify that event stream contains all required standardized event types."""
    procs = [
        ProcessDefinition(pid="P1", arrival_time=0, burst_time=3),
        ProcessDefinition(pid="P2", arrival_time=1, burst_time=2),
    ]
    engine = CPUSimulationEngine(
        scheduler=RoundRobinScheduler(time_quantum=1),
        processes=procs,
    )
    result = engine.run()

    event_types = {e.event_type for e in result.events}
    assert EventType.PROCESS_ARRIVED in event_types
    assert EventType.PROCESS_SCHEDULED in event_types
    assert EventType.PROCESS_PREEMPTED in event_types
    assert EventType.PROCESS_TERMINATED in event_types

    # Invariant: Event ticks are monotonically non-decreasing
    event_ticks = [e.tick for e in result.events]
    assert event_ticks == sorted(event_ticks)

    # Invariant: Every event has an event_id, tick, description, and details
    for e in result.events:
        assert e.event_id.startswith("evt_")
        assert e.tick >= 0
        assert len(e.description) > 0
        assert isinstance(e.details, dict)
