import { NextFunction, Response, Request } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { AppError } from '../../middleware/errorHandler';
import { logEvent } from '../../repositories/EventRepository';
import { logger } from '../../utils/logger';
import config from '../../config';

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
