import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { chatService } from '../../services/ChatService';
import { AppError } from '../../middleware/errorHandler';

export class ChatController {
  getGlobalMessages = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'unauthorized');
      }

      const { limit, cursor, since } = req.query;
      const parsedLimit = typeof limit === 'string' ? Number(limit) : undefined;

      const response = await chatService.listGlobalMessages({
        limit: Number.isNaN(parsedLimit) ? undefined : parsedLimit,
        cursor: typeof cursor === 'string' ? cursor : undefined,
        since: typeof since === 'string' ? since : undefined,
      });

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  postGlobalMessage = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'unauthorized');
      }

      const body = (req.body ?? {}) as {
        message?: unknown;
        client_message_id?: unknown;
      };
      const { message, client_message_id } = body;

      const response = await chatService.sendGlobalMessage(req.user, {
        message,
        clientMessageId: typeof client_message_id === 'string' ? client_message_id : undefined,
      });

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };
}
