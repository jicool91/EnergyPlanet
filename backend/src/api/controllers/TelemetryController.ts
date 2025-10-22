import { NextFunction, Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { AppError } from '../../middleware/errorHandler';
import { logEvent } from '../../repositories/EventRepository';
import { logger } from '../../utils/logger';

interface ClientEventPayload {
  event: string;
  severity?: 'info' | 'warn' | 'error';
  context?: Record<string, unknown>;
}

export class TelemetryController {
  logClientEvent = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'unauthorized');
      }

      const body = req.body as ClientEventPayload;
      if (!body || typeof body.event !== 'string' || body.event.trim().length === 0) {
        throw new AppError(400, 'invalid_client_event');
      }

      const event = body.event.trim();
      const severity = body.severity ?? 'info';
      const context = body.context && typeof body.context === 'object' ? body.context : {};

      const payload = {
        severity,
        ...context,
        platform: 'client',
      };

      logger.info('client_event', {
        userId: req.user.id,
        event,
        severity,
        context,
      });

      await logEvent(req.user.id, event, payload);

      res.status(202).json({ success: true });
    } catch (error) {
      next(error);
    }
  };
}

export const telemetryController = new TelemetryController();
