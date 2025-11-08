import { apiClient } from './apiClient';

type Severity = 'info' | 'warn' | 'error';

const TELEMETRY_DISABLED = import.meta.env.VITE_DISABLE_TELEMETRY === 'true';
// Increased for better batching (OpenTelemetry 2025 best practice)
const FLUSH_INTERVAL_MS = 5000;
const MAX_QUEUE_SIZE = 100;

interface TelemetryEvent {
  event: string;
  context: Record<string, unknown>;
  severity: Severity;
}

const queue: TelemetryEvent[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let inflight = false;
let backoffUntil = 0;

function scheduleFlush(delay = FLUSH_INTERVAL_MS) {
  if (flushTimer) {
    return;
  }
  flushTimer = setTimeout(() => {
    flushTimer = null;
    void flushQueue();
  }, delay);
}

function enqueue(event: TelemetryEvent) {
  if (queue.length >= MAX_QUEUE_SIZE) {
    queue.shift();
  }
  queue.push(event);
  scheduleFlush();
}

async function flushQueue(): Promise<void> {
  if (inflight || queue.length === 0) {
    return;
  }

  const now = Date.now();
  if (backoffUntil > now) {
    scheduleFlush(backoffUntil - now);
    return;
  }

  const payload = queue.shift();
  if (!payload) {
    return;
  }

  inflight = true;
  try {
    await apiClient.post('/telemetry/client', {
      event: payload.event,
      severity: payload.severity,
      context: payload.context,
    });
  } catch (error) {
    if (isRateLimitedError(error)) {
      const retryAfter = parseRetryAfter(error.response?.headers?.['retry-after']);
      backoffUntil = Date.now() + (retryAfter ?? FLUSH_INTERVAL_MS);

      // Smart backpressure (OpenTelemetry 2025 pattern):
      // If backoff is too long (>30 sec), clear queue to prevent infinite growth
      if (retryAfter && retryAfter > 30000) {
        if (import.meta.env.DEV) {
          // eslint-disable-next-line no-console
          console.warn('Telemetry backpressure: clearing queue', {
            queueSize: queue.length,
            retryAfter,
          });
        }
        queue.length = 0; // Clear queue (smart mode)
      } else {
        queue.unshift(payload); // Return to queue only if short backoff
      }
    } else if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.warn('Failed to log client event', { event: payload.event, error });
    }
  } finally {
    inflight = false;
    if (queue.length > 0) {
      scheduleFlush();
    }
  }
}

function isRateLimitedError(error: unknown): error is {
  response: { status: number; headers?: Record<string, unknown> };
} {
  return (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    (error as { response: { status: number } }).response?.status === 429
  );
}

function parseRetryAfter(headerValue: unknown): number | null {
  if (!headerValue) {
    return null;
  }
  const value = Array.isArray(headerValue) ? headerValue[0] : headerValue;
  if (typeof value === 'string') {
    const numeric = Number(value);
    if (!Number.isNaN(numeric)) {
      return Math.max(1000, numeric * 1000);
    }
    const parsedDate = Date.parse(value);
    if (!Number.isNaN(parsedDate)) {
      const diff = parsedDate - Date.now();
      return diff > 0 ? diff : 1000;
    }
  } else if (typeof value === 'number') {
    return Math.max(1000, value * 1000);
  }
  return null;
}

export async function logClientEvent(
  event: string,
  context: Record<string, unknown> = {},
  severity: Severity = 'info'
): Promise<void> {
  if (TELEMETRY_DISABLED) {
    return;
  }

  const trimmed = event.trim();
  if (!trimmed) {
    return;
  }

  enqueue({ event: trimmed, context, severity });
  if (!inflight) {
    void flushQueue();
  }
}
