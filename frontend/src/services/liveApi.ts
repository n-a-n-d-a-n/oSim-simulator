/**
 * REST API client for Live System Observation.
 */

import type { SystemSnapshot, LiveStatus } from '../types/live';

const BASE_URL = '/api/v1/live';

export class LiveApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'LiveApiError';
    this.status = status;
  }
}

export async function fetchLiveStatus(): Promise<LiveStatus> {
  const response = await fetch(`${BASE_URL}/status`);
  if (!response.ok) {
    throw new LiveApiError(`Failed to fetch live subsystem status (${response.status})`, response.status);
  }
  return response.json();
}

export async function fetchLiveSnapshot(): Promise<SystemSnapshot> {
  const response = await fetch(`${BASE_URL}/snapshot`);
  if (!response.ok) {
    let errorDetail = `Snapshot capture failed with status ${response.status}`;
    try {
      const errorJson = await response.json();
      if (errorJson.detail) {
        errorDetail = String(errorJson.detail);
      }
    } catch {
      // ignore JSON parse error
    }
    throw new LiveApiError(errorDetail, response.status);
  }
  return response.json();
}
