import { apiClient } from './apiClient';

type Severity = 'info' | 'warn' | 'error';

const TELEMETRY_DISABLED = import.meta.env.VITE_DISABLE_TELEMETRY !== 'false';

export async function logClientEvent(
  event: string,
  context: Record<string, unknown> = {},
  severity: Severity = 'info'
): Promise<void> {
  if (TELEMETRY_DISABLED) {
    return;
  }

  try {
    const trimmed = event.trim();
    if (!trimmed) {
      return;
    }

    await apiClient.post('/telemetry/client', {
      event: trimmed,
      severity,
      context,
    });
  } catch (error) {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.warn('Failed to log client event', { event, error });
    }
  }
}
