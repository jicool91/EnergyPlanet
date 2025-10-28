import { AsyncLocalStorage } from 'async_hooks';
import { randomUUID } from 'crypto';
import pino, { LoggerOptions, Logger } from 'pino';
import config from '../config';

type RequestContext = {
  requestId: string;
};

const requestContext = new AsyncLocalStorage<RequestContext>();

const isProduction = config.server.env === 'production';

let transport: LoggerOptions['transport'] | undefined;

if (!isProduction) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require.resolve('pino-pretty');
    transport = {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:yyyy-mm-dd HH:MM:ss.l',
        ignore: 'pid,hostname',
      },
    };
  } catch (error) {
    // В проде dev-зависимости могут отсутствовать — продолжаем без транспорта.
    // eslint-disable-next-line no-console
    console.warn('[logger] pino-pretty не найден, используется JSON логирование');
  }
}

const options: LoggerOptions = {
  level: config.logging.level,
  base: {
    service: 'energy-planet-backend',
    environment: config.server.env,
  },
  transport,
  hooks: {
    logMethod(args, method) {
      const store = requestContext.getStore();
      if (store?.requestId) {
        const context = { requestId: store.requestId };
        if (typeof args[0] === 'object' && args[0] !== null) {
          args[0] = { ...context, ...args[0] };
        } else {
          args.unshift(context);
        }
      }
      return method.apply(this, args);
    },
  },
};

export const logger: Logger = pino(options);

export function getRequestId(): string | undefined {
  return requestContext.getStore()?.requestId;
}

export function runWithRequestContext<T>(requestId: string, callback: () => T): T {
  return requestContext.run({ requestId }, callback);
}

export function createRequestId(existing?: string | null): string {
  if (existing && existing.trim().length > 0) {
    return existing.trim();
  }
  return randomUUID();
}

export default logger;
