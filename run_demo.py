"""CLI Demonstration and Manual Verification Script for OSim Phase 1."""

import json
from backend.sim_engine.cpu import (
    FCFSScheduler,
    SJFScheduler,
    SRTFScheduler,
    RoundRobinScheduler,
    PriorityScheduler,
    CPUSimulationEngine,
)
from backend.sim_engine.workload.presets import (
    get_silberschatz_fcfs_sjf_workload,
    get_silberschatz_srtf_workload,
    get_silberschatz_rr_workload,
    get_silberschatz_priority_workload,
)


def print_header(title: str):
    print("\n" + "=" * 70)
    print(f" {title.upper()}")
    print("=" * 70)


def print_result_summary(result):
    print(f"Algorithm : {result.scheduler_name}")
    print(f"Total Time: {result.metrics.total_simulation_time} ticks")
    print(f"CPU Util  : {result.metrics.cpu_utilization_percent:.1f}%")
    print(f"Avg Wait  : {result.metrics.average_waiting_time:.2f} ticks")
    print(f"Avg Turn  : {result.metrics.average_turnaround_time:.2f} ticks")
    print(f"Avg Resp  : {result.metrics.average_response_time:.2f} ticks")
    print("\nGantt Chart Segments:")
    gantt_str = " | ".join(
        f"{seg.pid or ('IDLE' if seg.is_idle else 'CS')} [{seg.start_time}-{seg.end_time}]"
        for seg in result.gantt_segments
    )
    print(f"[{gantt_str}]")

    print("\nProcess Metrics Table:")
    print(f"{'PID':<6} {'Arrival':<8} {'Burst':<6} {'Completion':<12} {'Turnaround':<12} {'Waiting':<8} {'Response':<8}")
    for pid, pm in sorted(result.metrics.process_metrics.items()):
        print(
            f"{pm.pid:<6} {pm.arrival_time:<8} {pm.burst_time:<6} "
            f"{pm.completion_time:<12} {pm.turnaround_time:<12} "
            f"{pm.waiting_time:<8} {pm.response_time:<8}"
        )

    print(f"\nTotal Simulation Events Emitted: {len(result.events)}")
    print("Sample Events (first 4):")
    for evt in result.events[:4]:
        print(f"  [tick {evt.tick:02d}] {evt.event_type.value:<22} : {evt.description}")


def main():
    print_header("1. Silberschatz FCFS Benchmark")
    fcfs_engine = CPUSimulationEngine(FCFSScheduler(), get_silberschatz_fcfs_sjf_workload())
    print_result_summary(fcfs_engine.run())

    print_header("2. Silberschatz SJF (Non-Preemptive) Benchmark")
    sjf_engine = CPUSimulationEngine(SJFScheduler(), get_silberschatz_fcfs_sjf_workload())
    print_result_summary(sjf_engine.run())

    print_header("3. Silberschatz SRTF (Preemptive SJF) Benchmark")
    srtf_engine = CPUSimulationEngine(SRTFScheduler(), get_silberschatz_srtf_workload())
    print_result_summary(srtf_engine.run())

    print_header("4. Silberschatz Round Robin (q=4) Benchmark")
    rr_engine = CPUSimulationEngine(RoundRobinScheduler(time_quantum=4), get_silberschatz_rr_workload())
    print_result_summary(rr_engine.run())

    print_header("5. Silberschatz Priority (Non-Preemptive) Benchmark")
    prio_np_engine = CPUSimulationEngine(
        PriorityScheduler(preemptive=False, lower_number_higher_priority=True),
        get_silberschatz_priority_workload(),
    )
    print_result_summary(prio_np_engine.run())

    print_header("6. Context-Switch Overhead Demo (Overhead=1 tick)")
    cs_engine = CPUSimulationEngine(
        FCFSScheduler(),
        get_silberschatz_fcfs_sjf_workload(),
        context_switch_overhead=1,
    )
    print_result_summary(cs_engine.run())

    print_header("7. Determinism Check (10 Consecutive Runs)")
    results = [
        CPUSimulationEngine(SRTFScheduler(), get_silberschatz_srtf_workload()).run().to_dict()
        for _ in range(10)
    ]
    all_identical = all(r == results[0] for r in results)
    print(f"All 10 runs produced identical output: {all_identical}")


if __name__ == "__main__":
    main()
