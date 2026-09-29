/**
 * REST API client for Virtual Memory & Page Replacement simulation.
 */

import type {
  VirtualMemorySimulateRequest,
  VirtualMemorySimulateResponse,
  VirtualMemoryPresetItem,
} from '../types/virtualMemory';

const BASE_URL = '/api/v1';

export class VirtualMemoryApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'VirtualMemoryApiError';
    this.status = status;
  }
}

export async function simulateVirtualMemory(
  request: VirtualMemorySimulateRequest
): Promise<VirtualMemorySimulateResponse> {
  const response = await fetch(`${BASE_URL}/virtual-memory/simulate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    let errorDetail = `Virtual memory simulation request failed with status ${response.status}`;
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
    throw new VirtualMemoryApiError(errorDetail, response.status);
  }

  return response.json();
}

export async function fetchVirtualMemoryPresets(): Promise<VirtualMemoryPresetItem[]> {
  const response = await fetch(`${BASE_URL}/virtual-memory/workloads`);
  if (!response.ok) {
    throw new VirtualMemoryApiError(
      `Failed to fetch virtual memory presets (${response.status})`,
      response.status
    );
  }
  return response.json();
}

export async function fetchVirtualMemoryPresetById(
  presetId: string
): Promise<VirtualMemoryPresetItem> {
  const response = await fetch(`${BASE_URL}/virtual-memory/workloads/${presetId}`);
  if (!response.ok) {
    throw new VirtualMemoryApiError(
      `Virtual memory preset '${presetId}' not found`,
      response.status
    );
  }
  return response.json();
}
