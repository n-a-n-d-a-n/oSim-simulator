"""Host process enumerator and collector implementation using psutil."""

from typing import Tuple, List, Optional
import psutil

from backend.live_agent.models import ProcessObservation
from backend.live_agent.collectors.base import ProcessCollector, CollectorError


class PsutilProcessCollector(ProcessCollector):
    """Real system process collector using psutil.process_iter().
    
    Fault-tolerance semantics:
    - Asynchronous process exit, permission denials, and zombie processes are
      individually caught and skipped without aborting the overall snapshot.
    - Fields not provided by the platform or restricted by OS permissions are
      modeled safely as None rather than fabricating mock values.
    - If process enumeration as a whole fails systemically, CollectorError is raised.
    """

    def collect_processes(self) -> Tuple[ProcessObservation, ...]:
        observations: List[ProcessObservation] = []

        try:
            # We query standard attributes in bulk for performance
            attrs = [
                "pid",
                "name",
                "ppid",
                "status",
                "cpu_percent",
                "memory_info",
                "num_threads",
                "cpu_times",
                "create_time",
            ]
            
            for proc in psutil.process_iter(attrs=attrs):
                try:
                    info = proc.info
                    pid = info.get("pid")
                    if pid is None or pid < 0:
                        continue

                    name = info.get("name") or "unknown"
                    ppid = info.get("ppid")
                    if ppid is not None and ppid < 0:
                        ppid = None

                    status = str(info.get("status") or "unknown")
                    
                    # CPU percent on a per-process basis
                    raw_cpu = info.get("cpu_percent")
                    cpu_percent = float(raw_cpu) if raw_cpu is not None and raw_cpu >= 0.0 else 0.0

                    # Memory RSS bytes
                    mem_info = info.get("memory_info")
                    mem_bytes = int(mem_info.rss) if mem_info and hasattr(mem_info, "rss") else 0
                    if mem_bytes < 0:
                        mem_bytes = 0

                    # Optional thread count
                    raw_threads = info.get("num_threads")
                    thread_count: Optional[int] = int(raw_threads) if raw_threads and raw_threads >= 1 else None

                    # Optional CPU time seconds (user + system)
                    cpu_times = info.get("cpu_times")
                    cpu_time_sec: Optional[float] = None
                    if cpu_times and hasattr(cpu_times, "user") and hasattr(cpu_times, "system"):
                        cpu_time_sec = float(cpu_times.user + cpu_times.system)

                    # Optional process creation timestamp
                    raw_create_time = info.get("create_time")
                    create_time: Optional[float] = float(raw_create_time) if raw_create_time and raw_create_time > 0 else None

                    obs = ProcessObservation(
                        pid=pid,
                        name=name,
                        parent_pid=ppid,
                        status=status,
                        cpu_percent=cpu_percent,
                        memory_bytes=mem_bytes,
                        thread_count=thread_count,
                        cpu_time_seconds=cpu_time_sec,
                        create_time=create_time,
                    )
                    observations.append(obs)

                except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
                    # Process died, was restricted, or is zombie during inspection; skip safely
                    continue
                except Exception:
                    # Ignore transient per-process inspect exceptions
                    continue

        except Exception as exc:
            raise CollectorError("ProcessCollector", f"Failed to enumerate host processes: {exc}", exc) from exc

        # Deterministic ordering by PID
        observations.sort(key=lambda p: p.pid)
        return tuple(observations)
