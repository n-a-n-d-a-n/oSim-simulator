/**
 * TypeScript definitions for OSim Phase 3 Contiguous Memory Allocation.
 */

export type MemoryAlgorithmType = 'FIRST_FIT' | 'BEST_FIT' | 'WORST_FIT' | 'NEXT_FIT';

export type MemoryOperationType = 'ALLOCATE' | 'DEALLOCATE';

export interface MemoryOperationInput {
  tick: number;
  operation_type: MemoryOperationType;
  request_id: string;
  size?: number;
}

export interface MemoryBlockSnapshot {
  start_address: number;
  size: number;
  end_address: number;
  is_free: boolean;
  owner_id?: string | null;
}

export interface MemoryMetricsSnapshot {
  total_memory: number;
  used_memory: number;
  free_memory: number;
  allocated_block_count: number;
  free_block_count: number;
  largest_free_block: number;
  external_fragmentation: number;
  external_fragmentation_ratio: number;
  internal_fragmentation: number;
  allocation_success_count: number;
  allocation_failure_count: number;
}

export interface OperationResultSnapshot {
  tick: number;
  operation_type: string;
  request_id: string;
  size?: number | null;
  success: boolean;
  allocated_start_address?: number | null;
  allocated_size?: number | null;
  reason?: string | null;
}

export interface MemoryStateSnapshot {
  tick: number;
  total_memory: number;
  blocks: MemoryBlockSnapshot[];
  next_fit_cursor: number;
  metrics: MemoryMetricsSnapshot;
  last_operation_result?: OperationResultSnapshot | null;
}

export interface MemoryEvent {
  event_id: string;
  tick: number;
  event_type: string;
  component: string;
  description: string;
  details: Record<string, any>;
}

export interface MemorySimulateRequest {
  algorithm: MemoryAlgorithmType;
  memory_size: number;
  operations: MemoryOperationInput[];
  max_ticks?: number;
}

export interface MemorySimulateResponse {
  algorithm_name: string;
  memory_size: number;
  terminated_normally: boolean;
  timeline: MemoryStateSnapshot[];
  events: MemoryEvent[];
  operation_results: OperationResultSnapshot[];
  final_metrics: MemoryMetricsSnapshot;
}

export interface MemoryPresetItem {
  id: string;
  name: string;
  category: string;
  description: string;
  recommended_algorithm: MemoryAlgorithmType;
  memory_size: number;
  operations: MemoryOperationInput[];
}
