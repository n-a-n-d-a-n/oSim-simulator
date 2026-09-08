/**
 * TypeScript types for OSim Live System Observation Foundation.
 */

export interface ProcessObservation {
  pid: number;
  name: string;
  parent_pid: number | null;
  status: string;
  cpu_percent: number;
  memory_bytes: number;
  thread_count: number | null;
  cpu_time_seconds: number | null;
  create_time: number | null;
}

export interface CPUObservation {
  total_cpu_percent: number;
  logical_cpu_count: number;
  per_cpu_percent: number[];
  timestamp: number;
}

export interface MemoryObservation {
  total_bytes: number;
  used_bytes: number;
  available_bytes: number;
  percent_used: number;
  timestamp: number;
}

export interface SystemSnapshot {
  snapshot_id: string;
  timestamp: number;
  cpu: CPUObservation;
  memory: MemoryObservation;
  processes: ProcessObservation[];
  process_count: number;
}

export interface LiveStatus {
  available: boolean;
  platform: string;
  psutil_version: string | null;
  message: string;
}
