import { apiClient } from './apiClient';
import type { LobbyMode } from '@/components/pvp/MatchLobby';
import type { EventScheduleEntry } from '@/components/events/EventSchedule';
import type { AirdropEvent } from '@/components/airdrop/AirdropTimeline';

interface PvPEventsResponse {
  modes?: LobbyMode[];
  events?: EventScheduleEntry[];
  friends_online?: number;
  daily_bonus?: string;
  streak_days?: number;
  timezone?: string;
}

interface AirdropEventsResponse {
  events?: AirdropEvent[];
  timezone?: string;
}

export interface PvPEventsPayload {
  modes: LobbyMode[];
  events: EventScheduleEntry[];
  friendsOnline: number;
  dailyBonus?: string;
  streakDays?: number;
  timezone?: string;
}

export interface AirdropEventsPayload {
  events: AirdropEvent[];
  timezone?: string;
}

export async function fetchPvPEventsPayload(): Promise<PvPEventsPayload> {
  const response = await apiClient.get<PvPEventsResponse>('/api/v1/events/pvp');
  const data = response.data;
  return {
    modes: data.modes ?? [],
    events: data.events ?? [],
    friendsOnline: data.friends_online ?? 0,
    dailyBonus: data.daily_bonus ?? undefined,
    streakDays: data.streak_days ?? undefined,
    timezone: data.timezone ?? undefined,
  };
}

export async function joinPvPQueue(modeId: string): Promise<void> {
  await apiClient.post('/api/v1/events/pvp/queue', { modeId });
}

export async function schedulePvPEventReminder(eventId: string): Promise<void> {
  await apiClient.post('/api/v1/events/pvp/reminder', { eventId });
}

export async function fetchAirdropEventsPayload(): Promise<AirdropEventsPayload> {
  const response = await apiClient.get<AirdropEventsResponse>('/api/v1/events/airdrops');
  const data = response.data;
  return {
    events: data.events ?? [],
    timezone: data.timezone ?? undefined,
  };
}

export async function subscribeAirdropReminder(eventId: string): Promise<void> {
  await apiClient.post('/api/v1/events/airdrops/reminder', { eventId });
}
