import { NextFunction, Response, Request } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { AppError } from '../../middleware/errorHandler';
import { logEvent } from '../../repositories/EventRepository';
import { logger } from '../../utils/logger';
import config from '../../config';
import { telemetryMetrics } from '../../metrics/telemetry';

interface ClientEventPayload {
  event: string;
  severity?: 'info' | 'warn' | 'error' | 'debug';
  context?: Record<string, unknown>;
  timestamp?: string;
}

const SAFE_AREA_EDGES = ['top', 'right', 'bottom', 'left'] as const;
type SafeAreaEdge = (typeof SAFE_AREA_EDGES)[number];
type SanitizedSafeArea = Partial<Record<SafeAreaEdge, number>>;

type SanitizedViewportMetrics = {
  height?: number;
  stableHeight?: number;
  width?: number;
  isFullscreen?: boolean;
  isExpanded?: boolean;
};

function toNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return null;
}

function toBoolean(value: unknown): boolean | null {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'number') {
    return value !== 0;
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true' || normalized === '1') {
      return true;
    }
    if (normalized === 'false' || normalized === '0') {
      return false;
    }
  }
  return null;
}

function sanitizeLabel(value: unknown, fallback = 'unknown'): string {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.length > 0) {
      return trimmed;
    }
  }
  return fallback;
}

function extractSafeAreaSnapshot(input: unknown): SanitizedSafeArea | null {
  if (!input || typeof input !== 'object') {
    return null;
  }
  const source = input as Record<string, unknown>;
  const snapshot: SanitizedSafeArea = {};
  let hasValue = false;
  SAFE_AREA_EDGES.forEach(edge => {
    const numeric = toNumber(source[edge]);
    if (numeric !== null) {
      snapshot[edge] = numeric;
      hasValue = true;
    }
  });
  return hasValue ? snapshot : null;
}

function extractViewportMetrics(input: unknown): SanitizedViewportMetrics | null {
  if (!input || typeof input !== 'object') {
    return null;
  }
  const source = input as Record<string, unknown>;
  const metrics: SanitizedViewportMetrics = {};

  const height = toNumber(source.height ?? source.viewport_height);
  if (height !== null) {
    metrics.height = height;
  }

  const stableHeight = toNumber(source.stableHeight ?? source.stable_height);
  if (stableHeight !== null) {
    metrics.stableHeight = stableHeight;
  }

  const width = toNumber(source.width ?? source.viewport_width);
  if (width !== null) {
    metrics.width = width;
  }

  const isFullscreen = toBoolean(source.isFullscreen ?? source.is_fullscreen);
  if (isFullscreen !== null) {
    metrics.isFullscreen = isFullscreen;
  }

  const isExpanded = toBoolean(source.isExpanded ?? source.is_expanded);
  if (isExpanded !== null) {
    metrics.isExpanded = isExpanded;
  }

  return Object.keys(metrics).length > 0 ? metrics : null;
}

export class TelemetryController {
  logClientEvent = async (req: Request | AuthRequest, res: Response, next: NextFunction) => {
    try {
      const body = req.body as ClientEventPayload;
      if (!body || typeof body.event !== 'string' || body.event.trim().length === 0) {
        throw new AppError(400, 'invalid_client_event');
      }

      const event = body.event.trim();
      const severity = body.severity ?? 'info';
      const context: Record<string, unknown> =
        body.context && typeof body.context === 'object' ? { ...body.context } : {};
      const timestamp = body.timestamp || new Date().toISOString();

      // Get userId if authenticated, otherwise use null
      const userId = (req as AuthRequest).user?.id || null;

      if (event === 'render_latency') {
        const latency = Number(context.render_latency_ms);
        const screen = String(context.screen ?? 'unknown');
        if (Number.isFinite(latency) && latency > 0) {
          telemetryMetrics.recordRenderLatencyMetric({
            screen,
            latencyMs: latency,
            theme: context.theme,
            deviceClass: context.device_class ?? context.deviceClass,
          });
        }
      } else if (event === 'tap_success') {
        const batchSize = Number(context.batch_size);
        if (Number.isFinite(batchSize) && batchSize > 0) {
          telemetryMetrics.recordTapSuccessMetric({
            batchSize,
            energyGained: Number(context.energy_gained),
            xpGained: Number(context.xp_gained),
            levelUp: Boolean(context.level_up),
          });
        }
      } else if (event === 'safe_area_changed') {
        const origin = sanitizeLabel(context.origin);
        const safeSnapshot = extractSafeAreaSnapshot(context.safe);
        const contentSnapshot = extractSafeAreaSnapshot(context.content);
        telemetryMetrics.recordSafeAreaMetric({
          origin,
          safe: safeSnapshot,
          content: contentSnapshot,
        });

        const viewportMetrics = extractViewportMetrics(context.viewport);
        if (viewportMetrics) {
          telemetryMetrics.recordViewportMetric({ origin, metrics: viewportMetrics });
        }
      } else if (event === 'viewport_metrics_changed') {
        const origin = sanitizeLabel(context.origin);
        const viewportMetrics =
          extractViewportMetrics(context.metrics ?? context.viewport ?? context) ?? null;
        if (viewportMetrics) {
          telemetryMetrics.recordViewportMetric({ origin, metrics: viewportMetrics });
        }
      } else if (event === 'viewport_action') {
        telemetryMetrics.recordViewportActionMetric({
          action: typeof context.action === 'string' ? context.action : undefined,
          status: typeof context.status === 'string' ? context.status : undefined,
          path: typeof context.path === 'string' ? context.path : undefined,
        });
      } else if (event === 'ui_safe_area_delta') {
        telemetryMetrics.recordSafeAreaDeltaMetric({
          safeDelta: toNumber(context.safeDelta ?? context.safe_delta),
          contentDelta: toNumber(context.contentDelta ?? context.content_delta),
        });
      }

      const shouldLogTelemetryEvent = () => {
        if (config.server.env !== 'production') {
          return true;
        }

        if (severity === 'warn' || severity === 'error') {
          return true;
        }

        const rate = config.logging.telemetrySampleRate;
        if (!rate) {
          return false;
        }

        return Math.random() < rate;
      };

      if (shouldLogTelemetryEvent()) {
        const level: 'debug' | 'info' | 'warn' | 'error' =
          severity === 'debug' ? 'debug' : severity;
        logger[level]({
          userId,
          severity,
          timestamp,
          ...context,
        }, 'client_event');
      }

      // If user is authenticated, also save to database
      if (userId && (req as AuthRequest).user) {
        const payload = {
          severity,
          ...context,
          platform: 'client',
          timestamp,
        };
        await logEvent(userId, event, payload).catch(dbError => {
          logger.warn(
            {
              event,
              error: dbError instanceof Error ? dbError.message : 'unknown',
            },
            'client_event_persist_failed'
          );
        });
      }

      res.status(202).json({ success: true });
    } catch (error) {
      next(error);
    }
  };
}

export const telemetryController = new TelemetryController();
