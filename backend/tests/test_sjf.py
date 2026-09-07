"""Tests for Shortest Job First (SJF) Non-Preemptive CPU Scheduler."""

import pytest
from backend.sim_engine.core.process import ProcessDefinition
from backend.sim_engine.cpu.sjf import SJFScheduler
from backend.sim_engine.cpu.engine import CPUSimulationEngine
from backend.sim_engine.workload.presets import get_silberschatz_fcfs_sjf_workload


def test_sjf_silberschatz_benchmark():
    """Test SJF non-preemptive using textbook example (Silberschatz Chapter 5).
    P1: burst 24, arrival 0
    P2: burst 3, arrival 0
    P3: burst 3, arrival 0
    All arrive at 0.
    Shortest are P2 and P3 (both burst 3). Tie-break: PID order -> P2 then P3.
    Then P1 (burst 24).
    Gantt: P2(0-3), P3(3-6), P1(6-30).
    Waiting times: P2=0, P3=3, P1=6. Average waiting time = (0+3+6)/3 = 3.0.
    Turnaround times: P2=3, P3=6, P1=30. Average turnaround time = (3+6+30)/3 = 13.0.
    """
    procs = get_silberschatz_fcfs_sjf_workload()
    engine = CPUSimulationEngine(scheduler=SJFScheduler(), processes=procs)
    result = engine.run()

    assert result.terminated_normally
    assert result.metrics.total_simulation_time == 30
    assert result.metrics.average_waiting_time == 3.0
    assert result.metrics.average_turnaround_time == 13.0

    pm = result.metrics.process_metrics
    assert pm["P2"].waiting_time == 0
    assert pm["P2"].completion_time == 3
    assert pm["P3"].waiting_time == 3
    assert pm["P3"].completion_time == 6
    assert pm["P1"].waiting_time == 6
    assert pm["P1"].completion_time == 30

    gantt_order = [seg.pid for seg in result.gantt_segments]
    assert gantt_order == ["P2", "P3", "P1"]


def test_sjf_non_preemptive_staggered():
    """Verify non-preemption: a newly arriving shorter job cannot preempt currently running job."""
    procs = [
        ProcessDefinition(pid="P1", arrival_time=0, burst_time=7),
        ProcessDefinition(pid="P2", arrival_time=2, burst_time=2),  # Shorter, arrives while P1 runs
        ProcessDefinition(pid="P3", arrival_time=3, burst_time=1),  # Even shorter
    ]
    engine = CPUSimulationEngine(scheduler=SJFScheduler(), processes=procs)
    result = engine.run()

    # P1 must run to completion (0..7) without preemption!
    # At t=7, both P2 (burst 2) and P3 (burst 1) are ready. P3 is shorter, so P3 runs (7..8), then P2 (8..10).
    gantt_order = [seg.pid for seg in result.gantt_segments]
    assert gantt_order == ["P1", "P3", "P2"]
    assert result.gantt_segments[0].end_time == 7
    assert result.gantt_segments[1].end_time == 8
    assert result.gantt_segments[2].end_time == 10
