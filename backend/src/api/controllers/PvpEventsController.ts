import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { AppError } from '../../middleware/errorHandler';
import { pvpEventsService } from '../../services/PvpEventsService';
import { logger } from '../../utils/logger';

export class PvpEventsController {
  list = (_req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const payload = pvpEventsService.getEventsPayload();
      res.status(200).json(payload);
    } catch (error) {
      next(error);
    }
  };

  joinQueue = (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'unauthorized');
      }

      const { modeId } = (req.body ?? {}) as { modeId?: unknown };
      if (typeof modeId !== 'string' || modeId.trim().length === 0) {
        throw new AppError(400, 'mode_id_required');
      }

      const mode = pvpEventsService.validateMode(modeId.trim());
      if (!mode) {
        throw new AppError(404, 'mode_not_found');
      }

      logger.info({ userId: req.user.id, modeId: mode.id }, 'pvp_queue_join');

      res.status(202).json({
        status: 'queued',
        modeId: mode.id,
        queueEstimate: mode.queueEstimate ?? '≈ 1 мин.',
      });
    } catch (error) {
      next(error);
    }
  };

  scheduleReminder = (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'unauthorized');
      }

      const { eventId } = (req.body ?? {}) as { eventId?: unknown };
      if (typeof eventId !== 'string' || eventId.trim().length === 0) {
        throw new AppError(400, 'event_id_required');
      }

      const event = pvpEventsService.validateEvent(eventId.trim());
      if (!event) {
        throw new AppError(404, 'event_not_found');
      }

      logger.info({ userId: req.user.id, eventId: event.id }, 'pvp_event_reminder_set');
      res.status(200).json({ status: 'scheduled', eventId: event.id });
    } catch (error) {
      next(error);
    }
  };
}
