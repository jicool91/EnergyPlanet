import { Request, Response, NextFunction } from 'express';
import { createRequestId, runWithRequestContext } from '../utils/logger';

export const requestContext = (req: Request, res: Response, next: NextFunction) => {
  const existingRequestId = req.header('x-request-id');
  const requestId = createRequestId(existingRequestId);

  res.setHeader('x-request-id', requestId);
  res.locals.requestId = requestId;
  (req as Request & { requestId?: string }).requestId = requestId;

  runWithRequestContext(requestId, () => {
    next();
  });
};

export default requestContext;
