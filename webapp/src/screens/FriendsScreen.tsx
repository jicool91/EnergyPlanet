import { useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TabPageSurface, LeaderboardPanel } from '@/components';
import { useGameStore } from '@/store/gameStore';
import { useAuthStore } from '@/store/authStore';

export function FriendsScreen() {
  const navigate = useNavigate();
  const loadLeaderboard = useGameStore(state => state.loadLeaderboard);
  const isLeaderboardLoading = useGameStore(state => state.isLeaderboardLoading);
  const leaderboardError = useGameStore(state => state.leaderboardError);
  const authReady = useAuthStore(state => state.authReady);

  useEffect(() => {
    if (!authReady) {
      return;
    }
    loadLeaderboard().catch(error => {
      console.warn('Failed to load leaderboard', error);
    });
  }, [authReady, loadLeaderboard]);

  const handleOpenShop = useCallback(() => {
    navigate('/exchange?section=boosts', { replace: false });
  }, [navigate]);

  const handleRetry = useCallback(() => {
    loadLeaderboard(true).catch(error => {
      console.warn('Failed to reload leaderboard', error);
    });
  }, [loadLeaderboard]);

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-heading font-semibold text-[var(--color-text-primary)]">Рейтинг</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Следите за прогрессом друзей и поднимайтесь выше в таблице.
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenShop}
          className="rounded-2xl bg-[var(--color-accent-gold)] px-4 py-2 text-sm font-semibold text-[var(--color-bg-primary)] shadow-[0_14px_36px_rgba(243,186,47,0.26)] transition-transform duration-150 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-bg-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-accent-gold)]"
        >
          В магазин бустов
        </button>
      </header>

      <TabPageSurface>
        {leaderboardError && !isLeaderboardLoading ? (
          <div className="flex flex-col items-center gap-3 text-center text-[var(--color-text-secondary)]">
            <p>Не удалось загрузить рейтинг.</p>
            <button
              type="button"
              onClick={handleRetry}
              className="rounded-2xl border border-[rgba(255,255,255,0.12)] px-4 py-2 text-sm text-[var(--color-text-primary)] transition-colors duration-150 hover:bg-[rgba(255,255,255,0.06)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-text-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-primary)]"
            >
              Повторить
            </button>
          </div>
        ) : (
          <LeaderboardPanel onOpenShop={handleOpenShop} />
        )}
      </TabPageSurface>
    </div>
  );
}
