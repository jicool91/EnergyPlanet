/**
 * Social Proof Card Component
 * Shows friends playing and encourages social engagement
 */

import React from 'react';
import { Card } from './Card';

interface SocialProofCardProps {
  friendsCount?: number;
  onViewLeaderboard?: () => void;
}

export const SocialProofCard: React.FC<SocialProofCardProps> = ({
  friendsCount = 0,
  onViewLeaderboard,
}) => {
  if (friendsCount === 0) {
    return null;
  }

  return (
    <Card className="flex items-center justify-between gap-4 bg-gradient-to-r from-cyan/20 to-lime/20 border-cyan/40">
      {/* Content */}
      <div className="flex flex-col gap-1">
        <p className="m-0 text-caption font-semibold text-[var(--color-text-primary)]">
          👥 Друзья играют
        </p>
        <p className="m-0 text-sm text-[var(--color-text-secondary)]">
          {friendsCount} игроков онлайн
        </p>
      </div>

      {/* Action Button */}
      <button
        onClick={onViewLeaderboard}
        className="flex-shrink-0 px-4 py-2 rounded-lg bg-gradient-to-br from-cyan/40 to-lime/40 hover:from-cyan/60 hover:to-lime/60 text-[var(--color-text-primary)] font-medium text-caption transition-all duration-200 active:scale-95 focus-ring"
        type="button"
        aria-label="View leaderboard"
      >
        Рейтинг →
      </button>
    </Card>
  );
};
