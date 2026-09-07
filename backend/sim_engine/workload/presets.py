"""Canonical textbook presets and workload definitions."""

from typing import List
from backend.sim_engine.core.process import ProcessDefinition


def get_silberschatz_fcfs_sjf_workload() -> List[ProcessDefinition]:
    """Silberschatz Chapter 5 benchmark for FCFS and SJF."""
    return [
        ProcessDefinition(pid="P1", arrival_time=0, burst_time=24),
        ProcessDefinition(pid="P2", arrival_time=0, burst_time=3),
        ProcessDefinition(pid="P3", arrival_time=0, burst_time=3),
    ]


def get_silberschatz_srtf_workload() -> List[ProcessDefinition]:
    """Silberschatz Chapter 5 benchmark for SRTF (preemptive SJF)."""
    return [
        ProcessDefinition(pid="P1", arrival_time=0, burst_time=8),
        ProcessDefinition(pid="P2", arrival_time=1, burst_time=4),
        ProcessDefinition(pid="P3", arrival_time=2, burst_time=9),
        ProcessDefinition(pid="P4", arrival_time=3, burst_time=5),
    ]


def get_silberschatz_rr_workload() -> List[ProcessDefinition]:
    """Silberschatz Chapter 5 benchmark for Round Robin (q=4)."""
    return [
        ProcessDefinition(pid="P1", arrival_time=0, burst_time=24),
        ProcessDefinition(pid="P2", arrival_time=0, burst_time=3),
        ProcessDefinition(pid="P3", arrival_time=0, burst_time=3),
    ]


def get_silberschatz_priority_workload() -> List[ProcessDefinition]:
    """Silberschatz Chapter 5 benchmark for Priority scheduling (1=highest)."""
    return [
        ProcessDefinition(pid="P1", arrival_time=0, burst_time=10, priority=3),
        ProcessDefinition(pid="P2", arrival_time=0, burst_time=1, priority=1),
        ProcessDefinition(pid="P3", arrival_time=0, burst_time=2, priority=4),
        ProcessDefinition(pid="P4", arrival_time=0, burst_time=1, priority=5),
        ProcessDefinition(pid="P5", arrival_time=0, burst_time=5, priority=2),
    ]
