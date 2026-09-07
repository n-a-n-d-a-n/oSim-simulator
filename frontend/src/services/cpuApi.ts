/**
 * REST API client for CPU scheduling simulation and preset management.
 */

import type { CPUSimulateRequest, CPUSimulateResponse, PresetItem } from '../types/cpu';

const BASE_URL = '/api/v1';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export async function simulateCpu(request: CPUSimulateRequest): Promise<CPUSimulateResponse> {
  const response = await fetch(`${BASE_URL}/cpu/simulate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    let errorDetail = `Simulation request failed with status ${response.status}`;
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
      // ignore parse error and use default message
    }
    throw new ApiError(errorDetail, response.status);
  }

  return response.json();
}

export async function fetchWorkloadPresets(): Promise<PresetItem[]> {
  const response = await fetch(`${BASE_URL}/workloads`);
  if (!response.ok) {
    throw new ApiError(`Failed to fetch presets (${response.status})`, response.status);
  }
  return response.json();
}

export async function fetchWorkloadPresetById(presetId: string): Promise<PresetItem> {
  const response = await fetch(`${BASE_URL}/workloads/${presetId}`);
  if (!response.ok) {
    throw new ApiError(`Preset '${presetId}' not found`, response.status);
  }
  return response.json();
}
