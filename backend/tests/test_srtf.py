"""Tests for Shortest Remaining Time First (SRTF) Preemptive CPU Scheduler."""

import pytest
from backend.sim_engine.core.process import ProcessDefinition
from backend.sim_engine.cpu.srtf import SRTFScheduler
from backend.sim_engine.cpu.engine import CPUSimulationEngine
from backend.sim_engine.workload.presets import get_silberschatz_srtf_workload


def test_srtf_silberschatz_benchmark():
    """Test SRTF using textbook example (Silberschatz Chapter 5).
    P1: arrival 0, burst 8
    P2: arrival 1, burst 4
    P3: arrival 2, burst 9
    P4: arrival 3, burst 5

    Expected execution:
    0-1: P1 (rem 7)
    1: P2 arrives (burst 4 < rem 7 of P1) -> P1 preempted, P2 runs!
    1-5: P2 runs and completes at 5
    5-10: P4 runs (burst 5 < P1 rem 7, P3 rem 9) and completes at 10
    10-17: P1 runs (rem 7 < P3 rem 9) and completes at 17
    17-26: P3 runs and completes at 26

    Waiting times:
    P1: 10 - 1 = 9 (turnaround 17 - 8 = 9)
    P2: 0 (turnaround 4 - 4 = 0)
    P3: 17 - 2 = 15 (turnaround 24 - 9 = 15)
    P4: 5 - 3 = 2 (turnaround 7 - 5 = 2)
    Average waiting time = (9 + 0 + 15 + 2) / 4 = 6.5.
    """
    procs = get_silberschatz_srtf_workload()
    engine = CPUSimulationEngine(scheduler=SRTFScheduler(), processes=procs)
    result = engine.run()

    assert result.terminated_normally
    assert result.metrics.total_simulation_time == 26
    assert result.metrics.average_waiting_time == 6.5

    pm = result.metrics.process_metrics
    assert pm["P1"].waiting_time == 9
    assert pm["P1"].turnaround_time == 17
    assert pm["P2"].waiting_time == 0
    assert pm["P2"].turnaround_time == 4
    assert pm["P3"].waiting_time == 15
    assert pm["P3"].turnaround_time == 24
    assert pm["P4"].waiting_time == 2
    assert pm["P4"].turnaround_time == 7

    # Verify exact Gantt segments
    gantt = result.gantt_segments
    assert len(gantt) == 5
    assert (gantt[0].pid, gantt[0].start_time, gantt[0].end_time) == ("P1", 0, 1)
    assert (gantt[1].pid, gantt[1].start_time, gantt[1].end_time) == ("P2", 1, 5)
    assert (gantt[2].pid, gantt[2].start_time, gantt[2].end_time) == ("P4", 5, 10)
    assert (gantt[3].pid, gantt[3].start_time, gantt[3].end_time) == ("P1", 10, 17)
    assert (gantt[4].pid, gantt[4].start_time, gantt[4].end_time) == ("P3", 17, 26)


def test_srtf_no_preemption_on_equal_remaining_time():
    """Verify that a newly arriving process with EQUAL remaining time does not preempt running process."""
    procs = [
        ProcessDefinition(pid="P1", arrival_time=0, burst_time=5),
        ProcessDefinition(pid="P2", arrival_time=2, burst_time=3),  # At t=2, P1 has 3 remaining, P2 has 3
    ]
    engine = CPUSimulationEngine(scheduler=SRTFScheduler(), processes=procs)
    result = engine.run()

    # P1 should NOT be preempted because remaining times are equal; P1 finishes at 5, then P2 runs 5..8
    gantt = result.gantt_segments
    assert len(gantt) == 2
    assert (gantt[0].pid, gantt[0].start_time, gantt[0].end_time) == ("P1", 0, 5)
    assert (gantt[1].pid, gantt[1].start_time, gantt[1].end_time) == ("P2", 5, 8)
