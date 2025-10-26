/**
 * Social Proof Card Component
 * Shows friends playing and encourages social engagement
 */

import React from 'react';
import { Card } from './Card';

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
      <Card className="flex items-center justify-between gap-4 bg-gradient-to-r from-cyan/10 to-lime/10 border-cyan/30 animate-pulse">
        <div className="flex flex-col gap-1">
          <p className="m-0 text-caption font-semibold text-[var(--color-text-secondary)]">
            Синхронизируем комьюнити…
          </p>
          <p className="m-0 text-sm text-[var(--color-text-secondary)] opacity-70">
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
    <Card className="flex items-center justify-between gap-4 bg-gradient-to-r from-cyan/20 to-lime/20 border-cyan/40">
      {/* Content */}
      <div className="flex flex-col gap-1">
        <p className="m-0 text-caption font-semibold text-[var(--color-text-primary)]">
          👥 Игроки рядом с тобой
        </p>
        <p className="m-0 text-sm text-[var(--color-text-secondary)]">
          {formattedCount} в рейтинге прямо сейчас
        </p>
      </div>

      {/* Action Button */}
      <button
        onClick={isActionEnabled ? onViewLeaderboard : undefined}
        className={`flex-shrink-0 px-4 py-2 rounded-lg bg-gradient-to-br from-cyan/40 to-lime/40 text-[var(--color-text-primary)] font-medium text-caption transition-all duration-200 focus-ring ${
          isActionEnabled
            ? 'hover:from-cyan/60 hover:to-lime/60 active:scale-95'
            : 'opacity-50 cursor-not-allowed'
        }`}
        type="button"
        aria-label="Открыть лидерборд"
        disabled={!isActionEnabled}
      >
        Рейтинг →
      </button>
    </Card>
  );
};
