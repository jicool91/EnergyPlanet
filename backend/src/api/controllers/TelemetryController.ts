import { NextFunction, Response, Request } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { AppError } from '../../middleware/errorHandler';
import { logEvent } from '../../repositories/EventRepository';
import { logger } from '../../utils/logger';

interface ClientEventPayload {
  event: string;
  severity?: 'info' | 'warn' | 'error' | 'debug';
  context?: Record<string, unknown>;
  timestamp?: string;
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
      const context = body.context && typeof body.context === 'object' ? body.context : {};
      const timestamp = body.timestamp || new Date().toISOString();

      // Get userId if authenticated, otherwise use null
      const userId = (req as AuthRequest).user?.id || null;

      // Log to Winston with prominent emoji prefixes for client logs
      const emoji = {
        debug: '🔍',
        info: 'ℹ️',
        warn: '⚠️',
        error: '❌',
      }[severity] || '📱';

      logger.info(`${emoji} [CLIENT] ${event}`, {
        userId,
        severity,
        timestamp,
        ...context,
      });

      // If user is authenticated, also save to database
      if (userId && (req as AuthRequest).user) {
        const payload = {
          severity,
          ...context,
          platform: 'client',
          timestamp,
        };
        await logEvent(userId, event, payload).catch(dbError => {
          logger.warn('Failed to save client event to database', {
            event,
            error: dbError instanceof Error ? dbError.message : 'unknown',
          });
        });
      }

      res.status(202).json({ success: true });
    } catch (error) {
      next(error);
    }
  };
}

export const telemetryController = new TelemetryController();
