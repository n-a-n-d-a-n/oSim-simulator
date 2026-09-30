/**
 * REST API client for Deadlock Detection & Banker's Algorithm simulation (Phase 5).
 */

import type {
  DeadlockSafetyRequest,
  DeadlockResourceRequestInput,
  DeadlockDetectRequest,
  DeadlockSimulationResponse,
  DeadlockPresetItem,
} from '../types/deadlock';

const BASE_URL = '/api/v1/deadlock';

export class DeadlockApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'DeadlockApiError';
    this.status = status;
  }
}

async function handleResponse<T>(response: Response, defaultMessage: string): Promise<T> {
  if (!response.ok) {
    let errorDetail = `${defaultMessage} (${response.status})`;
    try {
      const errorJson = await response.json();
      if (errorJson.detail) {
        if (Array.isArray(errorJson.detail)) {
          errorDetail = errorJson.detail.map((d: { msg?: string }) => d.msg || JSON.stringify(d)).join('; ');
        } else {
          errorDetail = String(errorJson.detail);
        }
      }
    } catch {
      // Fallback to status text
    }
    throw new DeadlockApiError(errorDetail, response.status);
  }
  return response.json();
}

export async function evaluateBankerSafety(
  request: DeadlockSafetyRequest
): Promise<DeadlockSimulationResponse> {
  const response = await fetch(`${BASE_URL}/safety`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  return handleResponse<DeadlockSimulationResponse>(response, 'Banker safety evaluation failed');
}

export async function evaluateResourceRequest(
  request: DeadlockResourceRequestInput
): Promise<DeadlockSimulationResponse> {
  const response = await fetch(`${BASE_URL}/request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  return handleResponse<DeadlockSimulationResponse>(response, 'Resource request evaluation failed');
}

export async function detectDeadlock(
  request: DeadlockDetectRequest
): Promise<DeadlockSimulationResponse> {
  const response = await fetch(`${BASE_URL}/detect`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  return handleResponse<DeadlockSimulationResponse>(response, 'Deadlock detection failed');
}

export async function fetchDeadlockPresets(): Promise<DeadlockPresetItem[]> {
  const response = await fetch(`${BASE_URL}/workloads`);
  return handleResponse<DeadlockPresetItem[]>(response, 'Failed to fetch deadlock presets');
}

export async function fetchDeadlockPresetById(presetId: string): Promise<DeadlockPresetItem> {
  const response = await fetch(`${BASE_URL}/workloads/${presetId}`);
  return handleResponse<DeadlockPresetItem>(response, `Deadlock preset '${presetId}' not found`);
}
