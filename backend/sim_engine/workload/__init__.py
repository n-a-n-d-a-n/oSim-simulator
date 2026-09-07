"""Workloads package for presets and generator."""

from backend.sim_engine.workload.presets import (
    get_silberschatz_fcfs_sjf_workload,
    get_silberschatz_srtf_workload,
    get_silberschatz_rr_workload,
    get_silberschatz_priority_workload,
)

__all__ = [
    "get_silberschatz_fcfs_sjf_workload",
    "get_silberschatz_srtf_workload",
    "get_silberschatz_rr_workload",
    "get_silberschatz_priority_workload",
]
