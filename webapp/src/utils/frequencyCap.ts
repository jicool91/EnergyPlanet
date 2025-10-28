const STORAGE_PREFIX = 'energyPlanet:frequencyCap:';
const DEFAULT_WINDOW_MS = 24 * 60 * 60 * 1000; // 24h

interface CapState {
  windowStart: number;
  hits: number;
}

interface CapOptions {
  limit: number;
  windowMs?: number;
}

function getStorage(): Storage | null {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function loadState(id: string): CapState | null {
  const storage = getStorage();
  if (!storage) {
    return null;
  }
  const raw = storage.getItem(STORAGE_PREFIX + id);
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as CapState;
    if (typeof parsed.windowStart !== 'number' || typeof parsed.hits !== 'number') {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function saveState(id: string, state: CapState): void {
  const storage = getStorage();
  if (!storage) {
    return;
  }
  try {
    storage.setItem(STORAGE_PREFIX + id, JSON.stringify(state));
  } catch {
    // ignore quota/security errors
  }
}

function normalizeState(id: string, windowMs: number): CapState {
  const now = Date.now();
  const existing = loadState(id);
  if (!existing || now - existing.windowStart >= windowMs) {
    const fresh: CapState = {
      windowStart: now,
      hits: 0,
    };
    saveState(id, fresh);
    return fresh;
  }
  return existing;
}

export function canShowCap(id: string, { limit, windowMs }: CapOptions): boolean {
  if (limit <= 0) {
    return false;
  }
  const windowDuration = windowMs ?? DEFAULT_WINDOW_MS;
  const state = normalizeState(id, windowDuration);
  return state.hits < limit;
}

export function consumeCap(id: string, { limit, windowMs }: CapOptions): boolean {
  if (limit <= 0) {
    return false;
  }
  const windowDuration = windowMs ?? DEFAULT_WINDOW_MS;
  const state = normalizeState(id, windowDuration);
  if (state.hits >= limit) {
    return false;
  }
  const next: CapState = {
    windowStart: state.windowStart,
    hits: state.hits + 1,
  };
  saveState(id, next);
  return true;
}

export function resetCap(id: string): void {
  const storage = getStorage();
  if (!storage) {
    return;
  }
  try {
    storage.removeItem(STORAGE_PREFIX + id);
  } catch {
    // ignore
  }
}
