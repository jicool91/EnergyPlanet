/**
 * Winston Logger Configuration
 */

import winston from 'winston';
import config from '../config';

const { combine, timestamp, errors, json, printf, colorize } = winston.format;

// Custom format for development
const devFormat = printf(({ level, message, timestamp, ...meta }) => {
  return `${timestamp} [${level}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''}`;
});

const isProduction = config.server.env === 'production';
const consoleTransport = new winston.transports.Console({
  level: config.logging.level,
});

const transports = [consoleTransport];

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
