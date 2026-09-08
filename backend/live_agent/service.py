"""Service orchestrator for capturing point-in-time real system snapshots."""

import time
import uuid
from typing import Optional

from backend.live_agent.models import SystemSnapshot
from backend.live_agent.collectors.base import (
    CPUCollector,
    MemoryCollector,
    ProcessCollector,
    CollectorError,
)
from backend.live_agent.collectors.cpu import PsutilCPUCollector
from backend.live_agent.collectors.memory import PsutilMemoryCollector
from backend.live_agent.collectors.process import PsutilProcessCollector


class LiveSystemService:
    """Orchestrates on-demand capture of real operating system snapshots.
    
    Architectural Constraints (LIVE-1 Scope):
    - Strictly ONE-SHOT: Captures single point-in-time snapshots on explicit request.
    - NO background polling daemon, WebSocket streaming, or stateful history retention.
    - Fully dependency-injected for testability and platform adapter extensibility.
    - Strictly READ-ONLY.
    """

    def __init__(
        self,
        cpu_collector: Optional[CPUCollector] = None,
        memory_collector: Optional[MemoryCollector] = None,
        process_collector: Optional[ProcessCollector] = None,
    ):
        self.cpu_collector = cpu_collector or PsutilCPUCollector()
        self.memory_collector = memory_collector or PsutilMemoryCollector()
        self.process_collector = process_collector or PsutilProcessCollector()

    def capture_snapshot(self) -> SystemSnapshot:
        """Collect and assemble a validated, immutable SystemSnapshot of the host OS."""
        snapshot_time = time.time()
        snapshot_id = f"snap_{int(snapshot_time)}_{uuid.uuid4().hex[:8]}"

        # Collect CPU telemetry
        cpu_obs = self.cpu_collector.collect_cpu()

        # Collect Memory telemetry
        mem_obs = self.memory_collector.collect_memory()

        # Collect Active Processes telemetry
        proc_obs = self.process_collector.collect_processes()

        snapshot = SystemSnapshot(
            snapshot_id=snapshot_id,
            timestamp=snapshot_time,
            cpu=cpu_obs,
            memory=mem_obs,
            processes=proc_obs,
            process_count=len(proc_obs),
        )

        return snapshot

    def is_available(self) -> bool:
        """Check whether the host observation collectors are functional and accessible."""
        try:
            self.memory_collector.collect_memory()
            return True
        except Exception:
            return False
