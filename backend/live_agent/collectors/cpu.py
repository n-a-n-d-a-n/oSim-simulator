"""Host CPU collector implementation using psutil."""

import time
from typing import Optional
import psutil

from backend.live_agent.models import CPUObservation
from backend.live_agent.collectors.base import CPUCollector, CollectorError


class PsutilCPUCollector(CPUCollector):
    """Real system CPU collector using psutil.
    
    Sampling semantics:
    - On initialization, an initial non-blocking sample is taken to seed psutil's internal counters.
    - If `sample_interval` is provided (e.g. 0.1s), `collect_cpu()` samples CPU busy time over
      that exact duration, guaranteeing an accurate, honest reading for on-demand requests.
    - If `sample_interval` is None, it measures usage since the last call without blocking.
    """

    def __init__(self, sample_interval: Optional[float] = 0.1):
        self.sample_interval = sample_interval
        # Seed baseline counters
        try:
            psutil.cpu_percent(interval=None)
            psutil.cpu_percent(interval=None, percpu=True)
        except Exception:
            pass

    def collect_cpu(self) -> CPUObservation:
        try:
            ts = time.time()
            logical_cores = psutil.cpu_count(logical=True) or 1
            
            # Measure total CPU over sample_interval
            total_pct = float(psutil.cpu_percent(interval=self.sample_interval))
            
            # Measure per-core percentage
            per_cpu_raw = psutil.cpu_percent(interval=None, percpu=True)
            per_cpu = tuple(float(val) for val in per_cpu_raw) if per_cpu_raw else (total_pct,)

            return CPUObservation(
                total_cpu_percent=total_pct,
                logical_cpu_count=logical_cores,
                per_cpu_percent=per_cpu,
                timestamp=ts,
            )
        except Exception as exc:
            raise CollectorError("CPUCollector", f"Failed to collect CPU observation: {exc}", exc) from exc
