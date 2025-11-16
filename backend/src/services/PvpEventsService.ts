import { contentService, type PvpModeConfig, type PvpEventConfig } from './ContentService';
import { logger } from '../utils/logger';

export interface PvpEventsPayload {
  modes: PvpModeConfig[];
  events: PvpEventConfig[];
  friends_online: number;
  daily_bonus?: string;
  streak_days?: number;
  timezone?: string;
}

class PvpEventsService {
  getEventsPayload(): PvpEventsPayload {
    const config = contentService.getPvpEvents();

    const payload: PvpEventsPayload = {
      modes: config?.modes ?? [],
      events: config?.events ?? [],
      friends_online: config?.friendsOnline ?? 0,
      daily_bonus: config?.dailyBonus,
      streak_days: config?.streakDays,
      timezone: config?.timezone ?? 'UTC',
    };

    if (!config) {
      logger.warn('PvP events config missing; returning empty payload');
    }

    return payload;
  }

  validateMode(modeId: string): PvpModeConfig | null {
    if (!modeId) {
      return null;
    }
    const config = contentService.getPvpEvents();
    return config?.modes?.find(mode => mode.id === modeId) ?? null;
  }

  validateEvent(eventId: string): PvpEventConfig | null {
    if (!eventId) {
      return null;
    }
    const config = contentService.getPvpEvents();
    return config?.events?.find(event => event.id === eventId) ?? null;
  }
}

export const pvpEventsService = new PvpEventsService();
