"""Simulation metrics calculation and evaluation."""

from dataclasses import dataclass
from typing import Dict, List, Any
from backend.sim_engine.core.process import ProcessSnapshot


@dataclass(frozen=True)
class ProcessMetrics:
    pid: str
    arrival_time: int
    burst_time: int
    completion_time: int
    turnaround_time: int
    waiting_time: int
    response_time: int

    def to_dict(self) -> Dict[str, Any]:
        return {
            "pid": self.pid,
            "arrival_time": self.arrival_time,
            "burst_time": self.burst_time,
            "completion_time": self.completion_time,
            "turnaround_time": self.turnaround_time,
            "waiting_time": self.waiting_time,
            "response_time": self.response_time,
        }


@dataclass(frozen=True)
class SimulationMetrics:
    total_simulation_time: int
    total_busy_ticks: int
    total_idle_ticks: int
    total_context_switch_ticks: int
    context_switch_count: int
    cpu_utilization_percent: float
    throughput_per_tick: float
    average_turnaround_time: float
    average_waiting_time: float
    average_response_time: float
    process_metrics: Dict[str, ProcessMetrics]

    def to_dict(self, decimal_places: int = 2) -> Dict[str, Any]:
        return {
            "total_simulation_time": self.total_simulation_time,
            "total_busy_ticks": self.total_busy_ticks,
            "total_idle_ticks": self.total_idle_ticks,
            "total_context_switch_ticks": self.total_context_switch_ticks,
            "context_switch_count": self.context_switch_count,
            "cpu_utilization_percent": round(self.cpu_utilization_percent, decimal_places),
            "throughput_per_tick": round(self.throughput_per_tick, 4),
            "average_turnaround_time": round(self.average_turnaround_time, decimal_places),
            "average_waiting_time": round(self.average_waiting_time, decimal_places),
            "average_response_time": round(self.average_response_time, decimal_places),
            "process_metrics": {pid: pm.to_dict() for pid, pm in self.process_metrics.items()},
        }


def compute_simulation_metrics(
    processes: Dict[str, ProcessSnapshot],
    total_simulation_time: int,
    total_busy_ticks: int,
    total_idle_ticks: int,
    total_context_switch_ticks: int,
    context_switch_count: int,
) -> SimulationMetrics:
    """Compute exact simulation metrics from process snapshots and engine totals."""
    process_metrics: Dict[str, ProcessMetrics] = {}
    total_turnaround = 0
    total_waiting = 0
    total_response = 0
    completed_count = 0

    for pid, proc in processes.items():
        if proc.completion_time is not None:
            completed_count += 1
            turnaround = proc.completion_time - proc.arrival_time
            # For CPU-only model: waiting = turnaround - burst
            waiting = turnaround - proc.burst_time
            response = (proc.start_time - proc.arrival_time) if proc.start_time is not None else 0
            
            pm = ProcessMetrics(
                pid=pid,
                arrival_time=proc.arrival_time,
                burst_time=proc.burst_time,
                completion_time=proc.completion_time,
                turnaround_time=turnaround,
                waiting_time=waiting,
                response_time=response,
            )
            process_metrics[pid] = pm
            total_turnaround += turnaround
            total_waiting += waiting
            total_response += response

    n = max(completed_count, 1)
    avg_turnaround = total_turnaround / n if completed_count > 0 else 0.0
    avg_waiting = total_waiting / n if completed_count > 0 else 0.0
    avg_response = total_response / n if completed_count > 0 else 0.0

    cpu_util = (total_busy_ticks / total_simulation_time * 100.0) if total_simulation_time > 0 else 0.0
    throughput = (completed_count / total_simulation_time) if total_simulation_time > 0 else 0.0

    return SimulationMetrics(
        total_simulation_time=total_simulation_time,
        total_busy_ticks=total_busy_ticks,
        total_idle_ticks=total_idle_ticks,
        total_context_switch_ticks=total_context_switch_ticks,
        context_switch_count=context_switch_count,
        cpu_utilization_percent=cpu_util,
        throughput_per_tick=throughput,
        average_turnaround_time=avg_turnaround,
        average_waiting_time=avg_waiting,
        average_response_time=avg_response,
        process_metrics=process_metrics,
    )
