/**
 * TypeScript definitions for Virtual Memory & Page Replacement simulation subsystem.
 */

export type VirtualMemoryAlgorithmType = 'FIFO' | 'LRU' | 'OPTIMAL' | 'CLOCK';

export type InputMode = 'PAGE_REFERENCE' | 'VIRTUAL_ADDRESS';

export interface MemoryReference {
  reference_index: number;
  page_number: number;
  virtual_address?: number | null;
  offset: number;
}

export interface PageTableEntry {
  page_number: number;
  is_present: boolean; // True = resident in physical memory; False = not resident
  frame_number?: number | null;
  reference_bit: number;
  loaded_at_tick?: number | null;
  last_accessed_tick?: number | null;
}

export interface PhysicalFrame {
  frame_number: number;
  is_occupied: boolean;
  page_number?: number | null;
  reference_bit: number;
  loaded_at_tick?: number | null;
  last_accessed_tick?: number | null;
}

export interface ReplacementDecision {
  step_index: number;
  requested_page: number;
  victim_page?: number | null;
  allocated_frame: number;
  algorithm_name: string;
  reason: string;
  clock_hand_before?: number | null;
  clock_hand_after?: number | null;
  frames_scanned?: number[] | null;
}

export interface VirtualMemoryMetrics {
  total_references: number;
  page_hits: number;
  page_faults: number;
  hit_ratio: number;
  fault_ratio: number;
  total_translations: number;
  replacements: number;
  evictions: number;
  free_frames: number;
  resident_pages: number;
}

export interface VirtualMemorySnapshot {
  step_index: number;
  reference: MemoryReference;
  is_hit: boolean;
  is_fault: boolean;
  frame_number: number;
  physical_address?: number | null;
  page_table: PageTableEntry[];
  frames: PhysicalFrame[];
  free_frames_count: number;
  replacement_decision?: ReplacementDecision | null;
  clock_hand?: number | null;
  metrics?: VirtualMemoryMetrics | null;
}

export interface VirtualMemoryEvent {
  event_id: string;
  tick: number;
  event_type: string;
  component: string;
  description: string;
  details?: Record<string, any>;
}

export interface VirtualMemorySimulateRequest {
  algorithm: VirtualMemoryAlgorithmType;
  frame_count: number;
  page_size: number;
  virtual_page_count: number;
  input_mode: InputMode;
  references: number[];
}

export interface VirtualMemorySimulateResponse {
  algorithm_name: string;
  num_frames: number;
  page_size: number;
  virtual_page_count: number;
  input_mode: string;
  timeline: VirtualMemorySnapshot[];
  events: VirtualMemoryEvent[];
  final_metrics: VirtualMemoryMetrics;
  terminated_normally: boolean;
}

export interface VirtualMemoryPresetItem {
  id: string;
  name: string;
  category: string;
  description: string;
  recommended_algorithm: VirtualMemoryAlgorithmType;
  frame_count: number;
  page_size: number;
  virtual_page_count: number;
  input_mode: InputMode;
  raw_references: number[];
}
