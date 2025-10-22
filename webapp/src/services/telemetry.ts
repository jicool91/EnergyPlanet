import { apiClient } from './apiClient';

type Severity = 'info' | 'warn' | 'error';

export async function logClientEvent(
  event: string,
  context: Record<string, unknown> = {},
  severity: Severity = 'info'
): Promise<void> {
  try {
    if (!event.trim()) {
      return;
    }

    await apiClient.post('/telemetry/client', {
      event,
      severity,
      context,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('Failed to log client event', { event, error });
  }
}
