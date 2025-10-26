/**
 * Browser Logger Configuration
 * Similar to backend Winston logger but for client-side
 * Logs errors and warnings are sent to backend via telemetry endpoint
 */

import { apiClient } from '../services/apiClient';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
}

class ClientLogger {
  private isDev = import.meta.env.DEV;
  private logHistory: LogEntry[] = [];
  private maxHistorySize = 100;

  private getTimestamp(): string {
    return new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  }

  private formatMessage(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>
  ): string {
    const timestamp = this.getTimestamp();
    const levelLabel = `[${level.toUpperCase()}]`;
    const contextStr = context && Object.keys(context).length ? JSON.stringify(context, null, 2) : '';

    return `${timestamp} ${levelLabel}: ${message}${contextStr ? '\n' + contextStr : ''}`;
  }

  private getConsoleMethod(level: LogLevel): 'log' | 'debug' | 'warn' | 'error' {
    switch (level) {
      case 'debug':
        return 'debug';
      case 'info':
        return 'log';
      case 'warn':
        return 'warn';
      case 'error':
        return 'error';
    }
  }

  private async sendToBackend(level: LogLevel, message: string, context?: Record<string, unknown>) {
    // Only send warn and error logs to backend
    if (level !== 'warn' && level !== 'error') {
      return;
    }

    try {
      // Non-blocking send to telemetry endpoint
      // Don't await to avoid blocking logger calls
      void apiClient.post('/telemetry/client', {
        event: message,
        severity: level,
        context,
      }).catch(() => {
        // Silently fail - don't double log errors
      });
    } catch {
      // Ignore errors from sending logs
    }
  }

  private log(level: LogLevel, message: string, context?: Record<string, unknown>) {
    const entry: LogEntry = {
      timestamp: this.getTimestamp(),
      level,
      message,
      context,
    };

    this.logHistory.push(entry);
    if (this.logHistory.length > this.maxHistorySize) {
      this.logHistory.shift();
    }

    if (this.isDev || level === 'warn' || level === 'error') {
      const formatted = this.formatMessage(level, message, context);
      const method = this.getConsoleMethod(level);
      console[method](formatted);
    }

    // Send errors and warnings to backend
    this.sendToBackend(level, message, context);
  }

  debug(message: string, context?: Record<string, unknown>) {
    this.log('debug', message, context);
  }

  info(message: string, context?: Record<string, unknown>) {
    this.log('info', message, context);
  }

  warn(message: string, context?: Record<string, unknown>) {
    this.log('warn', message, context);
  }

  error(message: string, context?: Record<string, unknown>) {
    this.log('error', message, context);
  }

  getHistory(): LogEntry[] {
    return [...this.logHistory];
  }

  clearHistory() {
    this.logHistory = [];
  }
}

export const logger = new ClientLogger();
