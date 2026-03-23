import { SessionResult, LessonProgress } from '../types';
import { computeLessonProgress, isLessonUnlocked as isLessonUnlockedHelper } from './mastery';

const STORAGE_KEYS = {
  DEVICE_ID: 'gnt_device_id',
  SESSIONS: 'gnt_sessions',
  PROGRESS: 'gnt_progress',
} as const;

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

function readLocalStorage<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeLocalStorage(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage unavailable (e.g. private browsing quota exceeded) — silently ignore
  }
}

function removeLocalStorage(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class ProgressTracker {
  getDeviceId(): string {
    const existing = readLocalStorage<string>(STORAGE_KEYS.DEVICE_ID);
    if (existing && typeof existing === 'string') return existing;

    const newId = crypto.randomUUID();
    writeLocalStorage(STORAGE_KEYS.DEVICE_ID, newId);
    return newId;
  }

  recordSession(
    result: Omit<SessionResult, 'id' | 'deviceId' | 'synced'>
  ): SessionResult {
    const session: SessionResult = {
      ...result,
      id: crypto.randomUUID(),
      deviceId: this.getDeviceId(),
      synced: false,
    };

    const sessions = this.getSessions();
    sessions.push(session);
    writeLocalStorage(STORAGE_KEYS.SESSIONS, sessions);

    // Trigger async sync — intentionally not awaited
    void this.syncPendingSessions();

    return session;
  }

  getSessions(): SessionResult[] {
    const sessions = readLocalStorage<SessionResult[]>(STORAGE_KEYS.SESSIONS);
    if (Array.isArray(sessions)) return sessions;
    return [];
  }

  getProgress(): LessonProgress[] {
    const cached = readLocalStorage<LessonProgress[]>(STORAGE_KEYS.PROGRESS);
    if (Array.isArray(cached) && cached.length > 0) return cached;

    return this._recomputeAndCacheProgress();
  }

  isLessonUnlocked(lessonId: string): boolean {
    return isLessonUnlockedHelper(lessonId, this.getProgress());
  }

  async syncPendingSessions(): Promise<void> {
    try {
      const sessions = this.getSessions();
      const pending = sessions.filter((s) => !s.synced);
      if (pending.length === 0) return;

      const delays = [1000, 2000, 4000];
      let lastError: unknown;

      for (let attempt = 0; attempt < delays.length; attempt++) {
        try {
          if (attempt > 0) {
            await sleep(delays[attempt - 1]);
          }

          const response = await fetch(`${API_BASE_URL}/api/progress/sync`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessions: pending }),
          });

          if (!response.ok) {
            throw new Error(`Sync failed with status ${response.status}`);
          }

          // Mark synced sessions in localStorage
          const allSessions = this.getSessions();
          const syncedIds = new Set(pending.map((s) => s.id));
          const updated = allSessions.map((s) =>
            syncedIds.has(s.id) ? { ...s, synced: true } : s
          );
          writeLocalStorage(STORAGE_KEYS.SESSIONS, updated);

          // Recompute and cache progress after successful sync
          this._recomputeAndCacheProgress();
          return;
        } catch (err) {
          lastError = err;
        }
      }

      // All retries exhausted — leave sessions in queue for next attempt
      console.warn('[ProgressTracker] Sync failed after all retries:', lastError);
    } catch {
      // syncPendingSessions must never throw
    }
  }

  clearProgress(): void {
    removeLocalStorage(STORAGE_KEYS.DEVICE_ID);
    removeLocalStorage(STORAGE_KEYS.SESSIONS);
    removeLocalStorage(STORAGE_KEYS.PROGRESS);
  }

  validateAndLoad(): { ok: boolean; error?: string } {
    // Validate gnt_sessions
    const rawSessions = (() => {
      try {
        return localStorage.getItem(STORAGE_KEYS.SESSIONS);
      } catch {
        return null;
      }
    })();

    if (rawSessions !== null) {
      try {
        const parsed = JSON.parse(rawSessions);
        if (!Array.isArray(parsed)) {
          this.clearProgress();
          return { ok: false, error: 'gnt_sessions is not an array' };
        }
        const requiredFields: (keyof SessionResult)[] = [
          'id',
          'deviceId',
          'lessonId',
          'attemptedAt',
          'correctCount',
          'incorrectCount',
          'totalTimeMs',
          'score',
          'synced',
        ];
        for (const item of parsed) {
          if (typeof item !== 'object' || item === null) {
            this.clearProgress();
            return { ok: false, error: 'gnt_sessions contains non-object entry' };
          }
          for (const field of requiredFields) {
            if (!(field in item)) {
              this.clearProgress();
              return { ok: false, error: `gnt_sessions entry missing field: ${field}` };
            }
          }
        }
      } catch {
        this.clearProgress();
        return { ok: false, error: 'gnt_sessions is not valid JSON' };
      }
    }

    // Validate gnt_progress
    const rawProgress = (() => {
      try {
        return localStorage.getItem(STORAGE_KEYS.PROGRESS);
      } catch {
        return null;
      }
    })();

    if (rawProgress !== null) {
      try {
        const parsed = JSON.parse(rawProgress);
        if (!Array.isArray(parsed)) {
          this.clearProgress();
          return { ok: false, error: 'gnt_progress is not an array' };
        }
      } catch {
        this.clearProgress();
        return { ok: false, error: 'gnt_progress is not valid JSON' };
      }
    }

    return { ok: true };
  }

  private _recomputeAndCacheProgress(): LessonProgress[] {
    const sessions = this.getSessions();
    const deviceId = this.getDeviceId();
    const progress = computeLessonProgress(sessions, deviceId);
    writeLocalStorage(STORAGE_KEYS.PROGRESS, progress);
    return progress;
  }
}

export const progressTracker = new ProgressTracker();
