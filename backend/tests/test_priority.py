"""Tests for Priority CPU Scheduler (Preemptive and Non-Preemptive)."""

import pytest
from backend.sim_engine.core.process import ProcessDefinition
from backend.sim_engine.cpu.priority import PriorityScheduler
from backend.sim_engine.cpu.engine import CPUSimulationEngine
from backend.sim_engine.workload.presets import get_silberschatz_priority_workload


def test_priority_non_preemptive_silberschatz_benchmark():
    """Test Non-Preemptive Priority using textbook benchmark (Silberschatz Chapter 5).
    P1: burst 10, priority 3
    P2: burst 1,  priority 1
    P3: burst 2,  priority 4
    P4: burst 1,  priority 5
    P5: burst 5,  priority 2
    All arrive at t=0. Lower integer = higher priority.
    Execution order: P2 (p=1), P5 (p=2), P1 (p=3), P3 (p=4), P4 (p=5).
    Gantt: P2(0-1), P5(1-6), P1(6-16), P3(16-18), P4(18-19).
    Waiting times:
    P2: 0
    P5: 1
    P1: 6
    P3: 16
    P4: 18
    Average waiting time = (0 + 1 + 6 + 16 + 18) / 5 = 41 / 5 = 8.2.
    """
    procs = get_silberschatz_priority_workload()
    engine = CPUSimulationEngine(
        scheduler=PriorityScheduler(preemptive=False, lower_number_higher_priority=True),
        processes=procs,
    )
    result = engine.run()

    assert result.terminated_normally
    assert result.metrics.total_simulation_time == 19
    assert result.metrics.average_waiting_time == 8.2

    pm = result.metrics.process_metrics
    assert pm["P2"].waiting_time == 0
    assert pm["P5"].waiting_time == 1
    assert pm["P1"].waiting_time == 6
    assert pm["P3"].waiting_time == 16
    assert pm["P4"].waiting_time == 18

    gantt_order = [seg.pid for seg in result.gantt_segments]
    assert gantt_order == ["P2", "P5", "P1", "P3", "P4"]


def test_priority_preemptive_staggered():
    """Test Preemptive Priority: higher priority arriving preempts running lower priority process."""
    procs = [
        ProcessDefinition(pid="P1", arrival_time=0, burst_time=10, priority=3),
        ProcessDefinition(pid="P2", arrival_time=2, burst_time=4, priority=1),  # Arrives at 2, p=1 < 3 -> Preempts P1!
    ]
    engine = CPUSimulationEngine(
        scheduler=PriorityScheduler(preemptive=True, lower_number_higher_priority=True),
        processes=procs,
    )
    result = engine.run()

    assert result.terminated_normally
    gantt = result.gantt_segments
    assert len(gantt) == 3
    # P1 runs 0..2 (rem 8)
    assert (gantt[0].pid, gantt[0].start_time, gantt[0].end_time) == ("P1", 0, 2)
    # P2 runs 2..6 and completes
    assert (gantt[1].pid, gantt[1].start_time, gantt[1].end_time) == ("P2", 2, 6)
    # P1 finishes remaining 6..14
    assert (gantt[2].pid, gantt[2].start_time, gantt[2].end_time) == ("P1", 6, 14)

    pm = result.metrics.process_metrics
    assert pm["P2"].waiting_time == 0
    assert pm["P1"].waiting_time == 4  # Waited 2..6 while P2 executed


def test_priority_identical_priorities_tie_breaking():
    """When priorities are equal, tie-breaker is arrival time, then PID."""
    procs = [
        ProcessDefinition(pid="P3", arrival_time=0, burst_time=3, priority=2),
        ProcessDefinition(pid="P1", arrival_time=0, burst_time=3, priority=2),
        ProcessDefinition(pid="P2", arrival_time=0, burst_time=3, priority=2),
    ]
    engine = CPUSimulationEngine(
        scheduler=PriorityScheduler(preemptive=False),
        processes=procs,
    )
    result = engine.run()

    # PID order: P1, P2, P3
    assert [seg.pid for seg in result.gantt_segments] == ["P1", "P2", "P3"]
