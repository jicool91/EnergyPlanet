/**
 * SeasonScreen
 * Displays current season info, player progress, leaderboard, and rewards
 */

import { useEffect, useState, useCallback } from 'react';
import { TabPageSurface, Surface, Button } from '@/components';
import { apiClient } from '@/services/apiClient';
import { useAuthStore } from '@/store/authStore';

interface SeasonInfo {
  seasonId: string;
  seasonName: string;
  seasonNumber: number;
  description?: string;
  startDate: string | null;
  endDate: string | null;
  isActive: boolean;
  theme?: {
    primary_color?: string;
    secondary_color?: string;
    background_url?: string;
  } | null;
}

interface SeasonProgress {
  seasonId: string;
  seasonName: string;
  seasonNumber: number;
  seasonXp: number;
  seasonEnergyProduced: number;
  leaderboardRank: number | null;
  startDate: string | null;
  endDate: string | null;
  isActive: boolean;
  rewards: SeasonReward[];
  events: SeasonEvent[];
}

interface SeasonReward {
  rewardType: string;
  rewardTier: string | null;
  finalRank: number | null;
  rewards: Record<string, unknown>;
  claimed: boolean;
  claimedAt: string | null;
}

interface SeasonEvent {
  eventId: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  participated: boolean;
  rewardClaimed: boolean;
}

interface LeaderboardEntry {
  userId: string;
  username: string | null;
  firstName: string | null;
  rank: number;
  seasonEnergyProduced: number;
  seasonXp: number;
}

export function SeasonScreen() {
  const authReady = useAuthStore(state => state.authReady);
  const [seasonInfo, setSeasonInfo] = useState<SeasonInfo | null>(null);
  const [seasonProgress, setSeasonProgress] = useState<SeasonProgress | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSeasonData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Load season info (public)
      const infoResponse = await apiClient.get<SeasonInfo>('/api/v1/season/current');
      setSeasonInfo(infoResponse.data);

      // Load player progress (auth required)
      if (authReady) {
        try {
          const progressResponse = await apiClient.get<SeasonProgress>('/api/v1/season/progress');
          setSeasonProgress(progressResponse.data);
        } catch (err) {
          console.warn('Failed to load season progress:', err);
        }
      }

      // Load leaderboard (public)
      const leaderboardResponse = await apiClient.get<{ leaderboard: LeaderboardEntry[] }>(
        '/api/v1/season/leaderboard?limit=100'
      );
      setLeaderboard(leaderboardResponse.data.leaderboard);
    } catch (err) {
      console.error('Failed to load season data:', err);
      setError('Не удалось загрузить данные сезона');
    } finally {
      setLoading(false);
    }
  }, [authReady]);

  useEffect(() => {
    loadSeasonData();
  }, [loadSeasonData]);

  const handleClaimReward = async () => {
    try {
      await apiClient.post('/api/v1/season/claim-leaderboard-reward');
      // Reload progress after claiming
      await loadSeasonData();
    } catch (err) {
      console.error('Failed to claim reward:', err);
      alert('Не удалось получить награду');
    }
  };

  if (loading) {
    return (
      <TabPageSurface className="gap-4">
        <div className="flex items-center justify-center py-12">
          <p className="text-body text-text-secondary">Загрузка...</p>
        </div>
      </TabPageSurface>
    );
  }

  if (error || !seasonInfo) {
    return (
      <TabPageSurface className="gap-4">
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <p className="text-body text-text-secondary">{error ?? 'Сезон не найден'}</p>
          <Button variant="secondary" onClick={loadSeasonData}>
            Повторить
          </Button>
        </div>
      </TabPageSurface>
    );
  }

  return (
    <TabPageSurface className="gap-4">
      {/* Header */}
      <header className="flex flex-col gap-1">
        <h1 className="text-heading font-semibold text-text-primary">
          {seasonInfo.seasonName} (Сезон {seasonInfo.seasonNumber})
        </h1>
        {seasonInfo.description && (
          <p className="text-body text-text-secondary">{seasonInfo.description}</p>
        )}
        <div className="mt-2 flex items-center gap-2">
          <span
            className={`inline-block h-2 w-2 rounded-full ${seasonInfo.isActive ? 'bg-green-500' : 'bg-gray-400'}`}
          />
          <span className="text-caption text-text-secondary">
            {seasonInfo.isActive ? 'Активный сезон' : 'Сезон завершён'}
          </span>
        </div>
      </header>

      {/* Player Progress */}
      {seasonProgress && (
        <Surface
          tone="secondary"
          border="subtle"
          elevation="soft"
          padding="lg"
          rounded="3xl"
          className="flex flex-col gap-4"
        >
          <h2 className="text-body-lg font-semibold text-text-primary">Ваш прогресс</h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <p className="text-caption text-text-secondary">XP в сезоне</p>
              <p className="text-body-lg font-semibold text-text-primary">
                {seasonProgress.seasonXp.toLocaleString()}
              </p>
            </div>

            <div className="flex flex-col gap-1">
              <p className="text-caption text-text-secondary">Энергия произведена</p>
              <p className="text-body-lg font-semibold text-text-primary">
                {seasonProgress.seasonEnergyProduced.toLocaleString()}
              </p>
            </div>

            {seasonProgress.leaderboardRank && (
              <div className="flex flex-col gap-1">
                <p className="text-caption text-text-secondary">Место в лидерборде</p>
                <p className="text-body-lg font-semibold text-text-primary">
                  #{seasonProgress.leaderboardRank}
                </p>
              </div>
            )}
          </div>

          {/* Rewards */}
          {seasonProgress.rewards.length > 0 && (
            <div className="flex flex-col gap-2">
              <h3 className="text-body font-semibold text-text-primary">Награды</h3>
              {seasonProgress.rewards.map((reward, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-2xl bg-layer-overlay-ghost-soft p-3"
                >
                  <div>
                    <p className="text-body text-text-primary">
                      {reward.rewardType === 'leaderboard'
                        ? 'Награда за лидерборд'
                        : reward.rewardType}
                      {reward.rewardTier && ` (${reward.rewardTier})`}
                    </p>
                    {reward.finalRank && (
                      <p className="text-caption text-text-secondary">Место: #{reward.finalRank}</p>
                    )}
                  </div>
                  {!reward.claimed ? (
                    <Button size="sm" onClick={handleClaimReward}>
                      Получить
                    </Button>
                  ) : (
                    <span className="text-caption text-green-500">✓ Получено</span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Events */}
          {seasonProgress.events.length > 0 && (
            <div className="flex flex-col gap-2">
              <h3 className="text-body font-semibold text-text-primary">События сезона</h3>
              {seasonProgress.events.map(event => (
                <div
                  key={event.eventId}
                  className={`flex flex-col gap-1 rounded-2xl p-3 ${event.isActive ? 'bg-blue-500/10' : 'bg-layer-overlay-ghost-soft'}`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-body text-text-primary">{event.name}</p>
                    {event.isActive && (
                      <span className="rounded-full bg-blue-500 px-2 py-0.5 text-caption text-white">
                        Активно
                      </span>
                    )}
                  </div>
                  <p className="text-caption text-text-secondary">{event.description}</p>
                  {event.participated && (
                    <p className="text-caption text-green-500">✓ Участвуете</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </Surface>
      )}

      {/* Leaderboard */}
      <Surface
        tone="secondary"
        border="subtle"
        elevation="soft"
        padding="lg"
        rounded="3xl"
        className="flex flex-col gap-4"
      >
        <h2 className="text-body-lg font-semibold text-text-primary">
          Лидерборд (Топ {leaderboard.length})
        </h2>

        <div className="flex flex-col gap-2">
          {leaderboard.length === 0 ? (
            <p className="text-center text-body text-text-secondary">Пока нет участников</p>
          ) : (
            leaderboard.slice(0, 20).map(entry => (
              <div
                key={entry.userId}
                className="flex items-center justify-between rounded-2xl bg-layer-overlay-ghost-soft p-3"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-body font-semibold ${
                      entry.rank === 1
                        ? 'bg-yellow-500 text-white'
                        : entry.rank === 2
                          ? 'bg-gray-400 text-white'
                          : entry.rank === 3
                            ? 'bg-orange-500 text-white'
                            : 'bg-layer-overlay-ghost-medium text-text-primary'
                    }`}
                  >
                    {entry.rank}
                  </span>
                  <div>
                    <p className="text-body text-text-primary">
                      {entry.username ?? entry.firstName ?? 'Игрок'}
                    </p>
                    <p className="text-caption text-text-secondary">
                      {entry.seasonEnergyProduced.toLocaleString()} энергии
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Surface>
    </TabPageSurface>
  );
}
