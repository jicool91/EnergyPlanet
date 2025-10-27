/****\*
 \* Browser Logger Configuration
 \* Similar to backend Winston logger but for client-side
 \* Logs errors and warnings are sent to backend via telemetry endpoint
 \*/

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
  private storageKey = 'ENERGY_PLANET_LOGS';

  private getTimestamp(): string {
    return new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  }

  private saveToLocalStorage(entry: LogEntry) {
    try {
      const existing = localStorage.getItem(this.storageKey);
      const logs = existing ? JSON.parse(existing) : [];
      logs.push(entry);
      // Keep only last 50 entries in localStorage
      if (logs.length > 50) {
        logs.shift();
      }
      localStorage.setItem(this.storageKey, JSON.stringify(logs));
    } catch {
      // localStorage full or unavailable - ignore
    }
  }

  public getStorageLogs(): LogEntry[] {
    try {
      const logs = localStorage.getItem(this.storageKey);
      return logs ? JSON.parse(logs) : [];
    } catch {
      return [];
    }
  }

  public clearStorageLogs() {
    try {
      localStorage.removeItem(this.storageKey);
    } catch {
      // ignore
    }
  }

  private formatMessage(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>
  ): string {
    const timestamp = this.getTimestamp();
    const levelLabel = `[${level.toUpperCase()}]`;
    const contextStr =
      context && Object.keys(context).length ? JSON.stringify(context, null, 2) : '';

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
    // Send ALL logs to backend (including info/debug for auth flow debugging)
    // This is a Telegram Mini App - we can't use browser DevTools!
    try {
      // Non-blocking send to telemetry endpoint
      // Don't await to avoid blocking logger calls
      void apiClient
        .post('/telemetry/client', {
          event: message,
          severity: level,
          context,
          timestamp: new Date().toISOString(),
        })
        .catch(() => {
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

    // Always save to localStorage for debugging
    this.saveToLocalStorage(entry);

    if (this.isDev || level === 'warn' || level === 'error') {
      const formatted = this.formatMessage(level, message, context);
      const method = this.getConsoleMethod(level);
      console[method](formatted);
    }

    // Send ALL logs to backend (no filtering - Telegram Mini App needs full visibility)
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

