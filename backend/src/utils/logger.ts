/**
 * Winston Logger Configuration
 */

import winston from 'winston';
import config from '../config';

const { combine, timestamp, errors, json, printf, colorize } = winston.format;

// Custom format for development
const devFormat = printf(info => {
  const { level, message, timestamp, ...rest } = info as winston.Logform.TransformableInfo & {
    timestamp?: string;
  };
  const meta = rest as Record<string, unknown>;
  const metaPart = Object.keys(meta).length ? ` ${JSON.stringify(meta, null, 2)}` : '';
  const renderedTimestamp = timestamp ?? new Date().toISOString();
  return `${renderedTimestamp} [${String(level)}]: ${String(message)}${metaPart}`;
});

const isProduction = config.server.env === 'production';
const consoleTransport = new winston.transports.Console({
  level: config.logging.level,
});

const transports: winston.transport[] = [consoleTransport];

if (!isProduction && config.logging.enableFileTransports) {
  transports.push(
    new winston.transports.File({ filename: config.logging.errorFilePath, level: 'error' }),
    new winston.transports.File({ filename: config.logging.filePath, level: config.logging.level })
  );
}

// Create logger instance
export const logger = winston.createLogger({
  level: config.logging.level,
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    isProduction ? json() : combine(colorize(), devFormat)
  ),
  transports,
  exceptionHandlers: [new winston.transports.Console()],
  rejectionHandlers: [new winston.transports.Console()],
});

export default logger;
