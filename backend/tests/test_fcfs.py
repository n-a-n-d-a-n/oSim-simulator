"""Tests for First-Come First-Served (FCFS) CPU Scheduler."""

import pytest
from backend.sim_engine.core.process import ProcessDefinition
from backend.sim_engine.cpu.fcfs import FCFSScheduler
from backend.sim_engine.cpu.engine import CPUSimulationEngine
from backend.sim_engine.workload.presets import get_silberschatz_fcfs_sjf_workload


def test_fcfs_single_process():
    """Test FCFS with a single process."""
    procs = [ProcessDefinition(pid="P1", arrival_time=0, burst_time=5)]
    engine = CPUSimulationEngine(scheduler=FCFSScheduler(), processes=procs)
    result = engine.run()

    assert result.terminated_normally
    assert result.metrics.total_simulation_time == 5
    assert result.metrics.cpu_utilization_percent == 100.0
    assert result.metrics.average_waiting_time == 0.0
    assert result.metrics.average_turnaround_time == 5.0
    assert len(result.gantt_segments) == 1
    assert result.gantt_segments[0].pid == "P1"
    assert result.gantt_segments[0].start_time == 0
    assert result.gantt_segments[0].end_time == 5


def test_fcfs_silberschatz_benchmark():
    """Test FCFS using textbook example (Silberschatz Chapter 5).
    P1: burst 24, arrival 0
    P2: burst 3, arrival 0
    P3: burst 3, arrival 0
    Expected: P1(0-24), P2(24-27), P3(27-30).
    Waiting times: P1=0, P2=24, P3=27. Average waiting time = 17.0.
    Turnaround times: P1=24, P2=27, P3=30. Average turnaround time = 27.0.
    """
    procs = get_silberschatz_fcfs_sjf_workload()
    engine = CPUSimulationEngine(scheduler=FCFSScheduler(), processes=procs)
    result = engine.run()

    assert result.terminated_normally
    assert result.metrics.total_simulation_time == 30
    assert result.metrics.average_waiting_time == 17.0
    assert result.metrics.average_turnaround_time == 27.0

    pm = result.metrics.process_metrics
    assert pm["P1"].waiting_time == 0
    assert pm["P1"].turnaround_time == 24
    assert pm["P2"].waiting_time == 24
    assert pm["P2"].turnaround_time == 27
    assert pm["P3"].waiting_time == 27
    assert pm["P3"].turnaround_time == 30

    # Verify Gantt chart segments
    assert len(result.gantt_segments) == 3
    assert result.gantt_segments[0].pid == "P1"
    assert (result.gantt_segments[0].start_time, result.gantt_segments[0].end_time) == (0, 24)
    assert result.gantt_segments[1].pid == "P2"
    assert (result.gantt_segments[1].start_time, result.gantt_segments[1].end_time) == (24, 27)
    assert result.gantt_segments[2].pid == "P3"
    assert (result.gantt_segments[2].start_time, result.gantt_segments[2].end_time) == (27, 30)


def test_fcfs_staggered_arrivals():
    """Test FCFS with staggered arrivals."""
    procs = [
        ProcessDefinition(pid="P1", arrival_time=0, burst_time=4),
        ProcessDefinition(pid="P2", arrival_time=2, burst_time=3),
        ProcessDefinition(pid="P3", arrival_time=5, burst_time=2),
    ]
    engine = CPUSimulationEngine(scheduler=FCFSScheduler(), processes=procs)
    result = engine.run()

    assert result.terminated_normally
    pm = result.metrics.process_metrics
    # P1: 0..4 (completion 4, waiting 0)
    # P2: 4..7 (completion 7, turnaround 5, waiting 2)
    # P3: 7..9 (completion 9, turnaround 4, waiting 2)
    assert pm["P1"].completion_time == 4
    assert pm["P2"].completion_time == 7
    assert pm["P3"].completion_time == 9
    assert result.metrics.total_simulation_time == 9


def test_fcfs_identical_arrival_and_burst_deterministic_tiebreak():
    """Test FCFS deterministic tie-breaking when arrival times and bursts are identical."""
    procs = [
        ProcessDefinition(pid="P3", arrival_time=0, burst_time=3),
        ProcessDefinition(pid="P1", arrival_time=0, burst_time=3),
        ProcessDefinition(pid="P2", arrival_time=0, burst_time=3),
    ]
    engine = CPUSimulationEngine(scheduler=FCFSScheduler(), processes=procs)
    result = engine.run()

    # Tie-breaker is PID: P1, then P2, then P3
    assert [seg.pid for seg in result.gantt_segments] == ["P1", "P2", "P3"]
