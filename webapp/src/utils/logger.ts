/**
 * Browser Logger Configuration
 * Similar to backend Winston logger but for client-side
 * Logs errors and warnings are sent to backend via telemetry endpoint
 */

import { apiClient } from '../services/apiClient';
import { authStore, useAuthStore } from '../store/authStore';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
}

interface PendingLog {
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  timestamp: string;
}

class ClientLogger {
  private isDev = import.meta.env.DEV;
  private logHistory: LogEntry[] = [];
  private maxHistorySize = 100;
  private storageKey = 'ENERGY_PLANET_LOGS';
  private pendingLogs: PendingLog[] = [];
  private isFlushing = false;
  private unsubscribe?: () => void;

  constructor() {
    if (typeof window !== 'undefined') {
      this.unsubscribe = useAuthStore.subscribe(state => {
        if (state.accessToken) {
          void this.flushPending();
        }
      });
      if (authStore.accessToken) {
        void this.flushPending();
      }
      window.addEventListener('beforeunload', () => {
        this.unsubscribe?.();
        this.unsubscribe = undefined;
      });
    }
  }

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

  private async flushPending() {
    if (this.isFlushing) {
      return;
    }
    if (!authStore.accessToken) {
      return;
    }

    this.isFlushing = true;
    try {
      while (this.pendingLogs.length > 0 && authStore.accessToken) {
        const entry = this.pendingLogs.shift();
        if (!entry) {
          break;
        }
        try {
          await apiClient.post('/telemetry/client', {
            event: entry.message,
            severity: entry.level,
            context: entry.context,
            timestamp: entry.timestamp,
          });
        } catch (error) {
          // If we still cannot deliver (e.g., token expired), push it back and stop flushing
          this.pendingLogs.unshift(entry);
          break;
        }
      }
    } finally {
      this.isFlushing = false;
    }
  }

  private sendToBackend(level: LogLevel, message: string, context?: Record<string, unknown>) {
    // Prepare payload once, irrespective of delivery path
    const payload: PendingLog = {
      level,
      message,
      context,
      timestamp: new Date().toISOString(),
    };

    if (!authStore.accessToken) {
      // Queue log until an access token is available to avoid bootstrap-breaking 401s
      this.pendingLogs.push(payload);
      // Cap queue size to prevent unbounded growth
      if (this.pendingLogs.length > this.maxHistorySize) {
        this.pendingLogs.shift();
      }
      return;
    }

    if (this.pendingLogs.length > 0) {
      void this.flushPending();
    }

    void apiClient
      .post('/telemetry/client', {
        event: payload.message,
        severity: payload.level,
        context: payload.context,
        timestamp: payload.timestamp,
      })
      .catch(_error => {
        // Re-queue on failure (e.g. token expired) so we can retry with a fresh token
        this.pendingLogs.unshift(payload);
        if (!authStore.accessToken) {
          return;
        }
        // Network hiccups will be retried on the next flush call
      });
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
