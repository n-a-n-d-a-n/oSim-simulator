export type AlgorithmType =
  | 'FCFS'
  | 'SJF'
  | 'SRTF'
  | 'ROUND_ROBIN'
  | 'PRIORITY_NON_PREEMPTIVE'
  | 'PRIORITY_PREEMPTIVE';

export type ProcessState = 'NEW' | 'READY' | 'RUNNING' | 'WAITING' | 'TERMINATED';

export interface ProcessInput {
  pid: string;
  arrival_time: number;
  burst_time: number;
  priority: number;
  memory_required?: number;
}

export interface CPUSimulateRequest {
  algorithm: AlgorithmType;
  processes: ProcessInput[];
  time_quantum?: number | null;
  lower_number_higher_priority?: boolean;
  context_switch_cost?: number;
  max_ticks?: number;
}

export interface GanttSegment {
  pid: string | null;
  start_time: number;
  end_time: number;
  duration: number;
  is_context_switch: boolean;
  is_idle: boolean;
}

export interface ProcessMetrics {
  pid: string;
  arrival_time: number;
  burst_time: number;
  completion_time: number;
  turnaround_time: number;
  waiting_time: number;
  response_time: number;
}

export interface AggregateMetrics {
  total_simulation_time: number;
  total_busy_ticks: number;
  total_idle_ticks: number;
  total_context_switch_ticks: number;
  context_switch_count: number;
  cpu_utilization_percent: number;
  throughput_per_tick: number;
  average_turnaround_time: number;
  average_waiting_time: number;
  average_response_time: number;
  process_metrics: Record<string, ProcessMetrics>;
}

export interface SimulationEvent {
  event_id: string;
  tick: number;
  event_type: string;
  component: string;
  description: string;
  details: Record<string, any>;
}

export interface ProcessSnapshot {
  pid: string;
  arrival_time: number;
  burst_time: number;
  remaining_time: number;
  priority: number;
  state: ProcessState;
  executed_time: number;
  start_time: number | null;
  completion_time: number | null;
  waiting_time: number;
  turnaround_time: number;
  response_time: number | null;
  queue_level: number;
  memory_required: number;
}

export interface CPUState {
  running_pid: string | null;
  is_context_switching: boolean;
  context_switch_remaining: number;
  current_quantum_remaining: number;
  total_busy_ticks: number;
  total_idle_ticks: number;
  total_context_switch_ticks: number;
}

export interface SystemState {
  clock: number;
  cpu: CPUState;
  processes: Record<string, ProcessSnapshot>;
  ready_queue: string[];
  waiting_queue: string[];
  terminated_pids: string[];
}

export interface CPUSimulateResponse {
  scheduler_name: string;
  algorithm: AlgorithmType;
  terminated_normally: boolean;
  total_simulation_time: number;
  gantt_segments: GanttSegment[];
  metrics: AggregateMetrics;
  timeline: SystemState[];
  events: SimulationEvent[];
}

export interface PresetItem {
  id: string;
  name: string;
  description: string;
  recommended_algorithm: AlgorithmType;
  time_quantum?: number | null;
  processes: ProcessInput[];
}
