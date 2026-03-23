import { SessionResult, LessonProgress } from '../types';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

export interface ApiError {
  error: string;
  code: string;
}

export interface SyncResult {
  synced: number;
  failed: number;
}

export interface ProgressResponse {
  lessons: LessonProgress[];
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const err = (await response.json().catch(() => ({
      error: response.statusText,
      code: String(response.status),
    }))) as ApiError;
    throw err;
  }
  return response.json() as Promise<T>;
}

export async function postSession(
  session: SessionResult,
  deviceId: string
): Promise<{ id: string }> {
  const response = await fetch(`${API_BASE}/api/sessions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Device-Id': deviceId,
    },
    body: JSON.stringify(session),
  });
  return handleResponse<{ id: string }>(response);
}

export async function getProgress(deviceId: string): Promise<ProgressResponse> {
  const response = await fetch(`${API_BASE}/api/progress/${encodeURIComponent(deviceId)}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-Device-Id': deviceId,
    },
  });
  return handleResponse<ProgressResponse>(response);
}

export async function syncSessions(
  sessions: SessionResult[],
  deviceId: string
): Promise<SyncResult> {
  const response = await fetch(`${API_BASE}/api/progress/sync`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Device-Id': deviceId,
    },
    body: JSON.stringify({ sessions }),
  });
  return handleResponse<SyncResult>(response);
}
