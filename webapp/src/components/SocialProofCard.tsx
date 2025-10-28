/**
 * Social Proof Card Component
 * Shows friends playing and encourages social engagement
 */

import React from 'react';
import { Card } from './Card';
import { Button } from './Button';

interface SocialProofCardProps {
  friendsCount?: number;
  onViewLeaderboard?: () => void;
  isLoading?: boolean;
}

export const SocialProofCard: React.FC<SocialProofCardProps> = ({
  friendsCount = 0,
  onViewLeaderboard,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <Card className="flex items-center justify-between gap-md bg-[rgba(12,20,48,0.64)] border-[rgba(0,217,255,0.28)] animate-pulse">
        <div className="flex flex-col gap-xs">
          <p className="m-0 text-caption font-semibold text-[var(--color-text-secondary)]">
            Синхронизируем комьюнити…
          </p>
          <p className="m-0 text-caption text-[var(--color-text-secondary)] opacity-70">
            Обновляем рейтинг друзей
          </p>
        </div>
      </Card>
    );
  }

  if (friendsCount === 0) {
    return null;
  }

  const formattedCount = friendsCount.toLocaleString('ru-RU');
  const isActionEnabled = typeof onViewLeaderboard === 'function';

  return (
    <Card className="flex flex-col gap-sm md:flex-row md:items-center md:justify-between bg-gradient-to-r from-[rgba(0,217,255,0.22)] via-[rgba(0,255,136,0.18)] to-[rgba(120,63,255,0.22)] border-[rgba(0,217,255,0.35)] shadow-elevation-2">
      {/* Content */}
      <div className="flex flex-col gap-xs">
        <p className="m-0 text-caption font-semibold text-[var(--color-text-primary)]">
          🔥 Друзья ускоряют прогресс
        </p>
        <p className="m-0 text-sm text-[var(--color-text-secondary)]">
          {formattedCount} игроков активировали бусты сегодня
        </p>
        <p className="m-0 text-caption text-[var(--color-text-secondary)] opacity-80">
          Откройте рейтинг и пригласите друга — оба получите бонусные Stars.
        </p>
      </div>

      {/* Action Button */}
      <Button
        size="sm"
        variant="secondary"
        onClick={isActionEnabled ? onViewLeaderboard : undefined}
        disabled={!isActionEnabled}
        className={`min-w-[160px] ${isActionEnabled ? 'shadow-glow' : 'opacity-60 cursor-not-allowed'}`}
        aria-label="Открыть лидерборд"
      >
        Посмотреть друзей
      </Button>
    </Card>
  );
};
