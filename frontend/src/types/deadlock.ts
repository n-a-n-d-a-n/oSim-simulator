/**
 * TypeScript definitions for Deadlock Detection & Banker's Algorithm subsystem (Phase 5).
 */

export type RequestOutcome = 'GRANTED' | 'WAITING' | 'DENIED' | 'ERROR';

export type DeadlockPresetCategory = 'BANKER_AVOIDANCE' | 'DEADLOCK_DETECTION';

export interface GraphNode {
  id: string;
  label: string;
  node_type: 'PROCESS' | 'RESOURCE';
  capacity?: number | null;
  available?: number | null;
}

export interface GraphEdge {
  source: string;
  target: string;
  edge_type: 'REQUEST' | 'ASSIGNMENT' | 'WAIT_FOR';
  weight: number;
}

export interface GraphSnapshot {
  nodes: GraphNode[];
  edges: GraphEdge[];
  has_cycle: boolean;
  cycles: string[][];
  is_wfg: boolean;
}

export interface SafetyStep {
  step_index: number;
  evaluated_process?: string | null;
  work_before: number[];
  work_after: number[];
  finish_vector: boolean[];
  is_satisfied: boolean;
  safe_sequence_so_far: string[];
  description: string;
}

export interface DetectionStep {
  step_index: number;
  evaluated_process?: string | null;
  work_before: number[];
  work_after: number[];
  finish_vector: boolean[];
  is_reduced: boolean;
  unreduced_processes: string[];
  description: string;
}

export interface RequestEvaluation {
  process_id: string;
  request_vector: number[];
  decision: RequestOutcome;
  reason: string;
  tentative_available?: number[] | null;
  tentative_allocation?: number[][] | null;
  tentative_need?: number[][] | null;
  safe_sequence?: string[] | null;
}

export interface DeadlockSystemState {
  step_index: number;
  processes: string[];
  resource_types: string[];
  total: number[];
  available: number[];
  allocation: number[][];
  maximum: number[][];
  need: number[][];
  request: number[][];
}

export interface DeadlockTimelineSnapshot {
  tick: number;
  description: string;
  system_state: DeadlockSystemState;
  safety_step?: SafetyStep | null;
  detection_step?: DetectionStep | null;
  request_step?: RequestEvaluation | null;
  metrics?: Record<string, unknown> | null;
}

export interface DeadlockEvent {
  event_id: string;
  tick: number;
  event_type: string;
  component: string;
  description: string;
  details: Record<string, unknown>;
}

export interface DeadlockMetrics {
  total_processes: number;
  total_resource_types: number;
  total_resource_instances: number;
  allocated_instances: number;
  available_instances: number;
  resource_utilization_ratio: number;
  is_safe?: boolean | null;
  safe_sequence: string[];
  is_deadlocked?: boolean | null;
  deadlocked_process_count: number;
  deadlocked_processes: string[];
  request_count: number;
  granted_requests: number;
  waiting_requests: number;
  denied_requests: number;
  safety_checks: number;
  detection_checks: number;
}

export interface DeadlockSimulationResponse {
  mode: string;
  timeline: DeadlockTimelineSnapshot[];
  events: DeadlockEvent[];
  metrics: DeadlockMetrics;
  rag_snapshot: GraphSnapshot;
  wfg_snapshot?: GraphSnapshot | null;
  is_safe?: boolean | null;
  safe_sequence?: string[] | null;
  is_deadlocked?: boolean | null;
  deadlocked_processes?: string[] | null;
  request_result?: RequestEvaluation | null;
}

export interface DeadlockPresetItem {
  id: string;
  name: string;
  category: DeadlockPresetCategory;
  description: string;
  processes: string[];
  resource_types: string[];
  total: number[];
  available: number[];
  allocation: number[][];
  maximum: number[][];
  need: number[][];
  request: number[][];
  default_request_process_id?: string | null;
  default_request_vector?: number[] | null;
  expected_is_safe?: boolean | null;
  expected_safe_sequence?: string[] | null;
  expected_is_deadlocked?: boolean | null;
  expected_deadlocked_processes?: string[] | null;
  pedagogical_notes: string;
}

export interface DeadlockSafetyRequest {
  processes: string[];
  resource_types: string[];
  total: number[];
  available: number[];
  allocation: number[][];
  maximum: number[][];
  need?: number[][] | null;
}

export interface DeadlockResourceRequestInput {
  processes: string[];
  resource_types: string[];
  total: number[];
  available: number[];
  allocation: number[][];
  maximum: number[][];
  requesting_process_id: string;
  request_vector: number[];
}

export interface DeadlockDetectRequest {
  processes: string[];
  resource_types: string[];
  total: number[];
  available: number[];
  allocation: number[][];
  request: number[][];
}
