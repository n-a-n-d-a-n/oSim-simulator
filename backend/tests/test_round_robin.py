"""Tests for Round Robin (RR) CPU Scheduler."""

import pytest
from backend.sim_engine.core.process import ProcessDefinition
from backend.sim_engine.cpu.round_robin import RoundRobinScheduler
from backend.sim_engine.cpu.fcfs import FCFSScheduler
from backend.sim_engine.cpu.engine import CPUSimulationEngine
from backend.sim_engine.workload.presets import get_silberschatz_rr_workload


def test_round_robin_silberschatz_benchmark():
    """Test Round Robin (q=4) using textbook benchmark (Silberschatz Chapter 5).
    P1: burst 24, arrival 0
    P2: burst 3, arrival 0
    P3: burst 3, arrival 0
    Gantt: P1(0-4), P2(4-7), P3(7-10), P1(10-30).
    Waiting times:
    P1: (10 - 4) = 6
    P2: 4
    P3: 7
    Average waiting time = (6 + 4 + 7) / 3 = 17 / 3 ≈ 5.67.
    """
    procs = get_silberschatz_rr_workload()
    engine = CPUSimulationEngine(scheduler=RoundRobinScheduler(time_quantum=4), processes=procs)
    result = engine.run()

    assert result.terminated_normally
    assert result.metrics.total_simulation_time == 30
    assert abs(result.metrics.average_waiting_time - (17.0 / 3.0)) < 1e-5

    pm = result.metrics.process_metrics
    assert pm["P1"].waiting_time == 6
    assert pm["P1"].turnaround_time == 30
    assert pm["P2"].waiting_time == 4
    assert pm["P2"].turnaround_time == 7
    assert pm["P3"].waiting_time == 7
    assert pm["P3"].turnaround_time == 10

    gantt = result.gantt_segments
    assert len(gantt) == 4
    assert (gantt[0].pid, gantt[0].start_time, gantt[0].end_time) == ("P1", 0, 4)
    assert (gantt[1].pid, gantt[1].start_time, gantt[1].end_time) == ("P2", 4, 7)
    assert (gantt[2].pid, gantt[2].start_time, gantt[2].end_time) == ("P3", 7, 10)
    assert (gantt[3].pid, gantt[3].start_time, gantt[3].end_time) == ("P1", 10, 30)


def test_round_robin_quantum_one():
    """Test Round Robin with quantum = 1."""
    procs = [
        ProcessDefinition(pid="P1", arrival_time=0, burst_time=2),
        ProcessDefinition(pid="P2", arrival_time=0, burst_time=2),
    ]
    engine = CPUSimulationEngine(scheduler=RoundRobinScheduler(time_quantum=1), processes=procs)
    result = engine.run()

    assert result.terminated_normally
    gantt = result.gantt_segments
    assert [seg.pid for seg in gantt] == ["P1", "P2", "P1", "P2"]
    assert result.metrics.total_simulation_time == 4


def test_round_robin_quantum_larger_than_all_bursts_matches_fcfs():
    """When quantum is larger than maximum burst, Round Robin execution matches FCFS."""
    procs = [
        ProcessDefinition(pid="P1", arrival_time=0, burst_time=5),
        ProcessDefinition(pid="P2", arrival_time=1, burst_time=3),
        ProcessDefinition(pid="P3", arrival_time=2, burst_time=4),
    ]
    rr_engine = CPUSimulationEngine(scheduler=RoundRobinScheduler(time_quantum=50), processes=procs)
    rr_result = rr_engine.run()

    fcfs_engine = CPUSimulationEngine(scheduler=FCFSScheduler(), processes=procs)
    fcfs_result = fcfs_engine.run()

    assert [s.to_dict() for s in rr_result.gantt_segments] == [s.to_dict() for s in fcfs_result.gantt_segments]
    assert rr_result.metrics.average_waiting_time == fcfs_result.metrics.average_waiting_time
    assert rr_result.metrics.average_turnaround_time == fcfs_result.metrics.average_turnaround_time
