/**
 * REST API client for Memory Simulation and presets.
 */

import type { MemorySimulateRequest, MemorySimulateResponse, MemoryPresetItem } from '../types/memory';

const BASE_URL = '/api/v1';

export class MemoryApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'MemoryApiError';
    this.status = status;
  }
}

export async function simulateMemory(request: MemorySimulateRequest): Promise<MemorySimulateResponse> {
  const response = await fetch(`${BASE_URL}/memory/simulate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    let errorDetail = `Memory simulation request failed with status ${response.status}`;
    try {
      const errorJson = await response.json();
      if (errorJson.detail) {
        if (Array.isArray(errorJson.detail)) {
          errorDetail = errorJson.detail.map((d: any) => d.msg || JSON.stringify(d)).join('; ');
        } else {
          errorDetail = String(errorJson.detail);
        }
      }
    } catch {
      // fallback
    }
    throw new MemoryApiError(errorDetail, response.status);
  }

  return response.json();
}

export async function fetchMemoryPresets(): Promise<MemoryPresetItem[]> {
  const response = await fetch(`${BASE_URL}/memory/workloads`);
  if (!response.ok) {
    throw new MemoryApiError(`Failed to fetch memory presets (${response.status})`, response.status);
  }
  return response.json();
}

export async function fetchMemoryPresetById(presetId: string): Promise<MemoryPresetItem> {
  const response = await fetch(`${BASE_URL}/memory/workloads/${presetId}`);
  if (!response.ok) {
    throw new MemoryApiError(`Memory preset '${presetId}' not found`, response.status);
  }
  return response.json();
}
