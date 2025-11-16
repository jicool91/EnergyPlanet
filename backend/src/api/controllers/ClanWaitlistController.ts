import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { AppError } from '../../middleware/errorHandler';
import { clanWaitlistService } from '../../services/ClanWaitlistService';

function extractIp(req: AuthRequest): string | null {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    const [first] = forwarded.split(',');
    return first?.trim() ?? null;
  }
  if (Array.isArray(forwarded) && forwarded.length > 0) {
    return forwarded[0];
  }
  return typeof req.ip === 'string' ? req.ip : null;
}

export class ClanWaitlistController {
  submit = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      let handle: string | undefined;
      let interest: string | undefined;
      if (req.body && typeof req.body === 'object') {
        const payload = req.body as Record<string, unknown>;
        const handleCandidate = payload.handle;
        if (typeof handleCandidate === 'string') {
          handle = handleCandidate;
        }
        const interestCandidate = payload.interest;
        if (typeof interestCandidate === 'string') {
          interest = interestCandidate;
        }
      }

      if (!handle || handle.trim().length === 0) {
        throw new AppError(400, 'handle_required');
      }
      if (!interest || interest.trim().length === 0) {
        throw new AppError(400, 'interest_required');
      }

      let userId: string | undefined;
      let telegramId: number | undefined;
      let username: string | null = null;
      if (req.user && typeof req.user === 'object') {
        const authUser = req.user as Record<string, unknown>;
        if (typeof authUser.id === 'string') {
          userId = authUser.id;
        }
        if (typeof authUser.telegram_id === 'number') {
          telegramId = authUser.telegram_id;
        }
        if (typeof authUser.username === 'string') {
          username = authUser.username;
        }
      }

      const record = await clanWaitlistService.submitRequest({
        userId,
        telegramId,
        username,
        handle,
        interest,
        ip: extractIp(req) ?? undefined,
        source: 'webapp',
      });

      res.status(201).json({
        id: record.id,
        status: 'accepted',
      });
    } catch (error) {
      next(error);
    }
  };
}
