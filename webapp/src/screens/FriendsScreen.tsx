import { useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TabPageSurface, LeaderboardPanel, FriendsList } from '@/components';
import { useGameStore } from '@/store/gameStore';
import { useAuthStore } from '@/store/authStore';
import { useNotification } from '@/hooks/useNotification';
import { logClientEvent } from '@/services/telemetry';

export function FriendsScreen() {
  const navigate = useNavigate();
  const loadLeaderboard = useGameStore(state => state.loadLeaderboard);
  const isLeaderboardLoading = useGameStore(state => state.isLeaderboardLoading);
  const leaderboardError = useGameStore(state => state.leaderboardError);
  const loadProfile = useGameStore(state => state.loadProfile);
  const isProfileLoading = useGameStore(state => state.isProfileLoading);
  const profileError = useGameStore(state => state.profileError);
  const referralStats = useGameStore(state => state.profile?.referral ?? null);
  const authReady = useAuthStore(state => state.authReady);
  const { success: notifySuccess } = useNotification();

  useEffect(() => {
    if (!authReady) {
      return;
    }
    loadLeaderboard().catch(error => {
      console.warn('Failed to load leaderboard', error);
    });
  }, [authReady, loadLeaderboard]);

  useEffect(() => {
    if (!authReady) {
      return;
    }
    loadProfile().catch(error => {
      console.warn('Failed to load profile for friends screen', error);
    });
  }, [authReady, loadProfile]);

  const handleOpenShop = useCallback(() => {
    navigate('/exchange?section=boosts', { replace: false });
  }, [navigate]);

  const handleRetry = useCallback(() => {
    loadLeaderboard(true).catch(error => {
      console.warn('Failed to reload leaderboard', error);
    });
  }, [loadLeaderboard]);

  const handleViewLeaderboard = useCallback(() => {
    navigate('/friends', { replace: true });
  }, [navigate]);

  const handleInvite = useCallback(() => {
    const inviteLink =
      'https://t.me/share/url?url=https%3A%2F%2Ft.me%2Fenergy_planet_bot&text=Присоединяйся%20к%20Energy%20Planet!';
    if (typeof window === 'undefined') {
      return;
    }

    logClientEvent('friends_invite_click', { source: 'friends_screen' });

    const telegram = (
      window as typeof window & {
        Telegram?: { WebApp?: { openTelegramLink?: (url: string) => void } };
      }
    ).Telegram?.WebApp;

    if (telegram?.openTelegramLink) {
      telegram.openTelegramLink(inviteLink);
      notifySuccess('Открыли приглашение в Telegram');
      return;
    }

    if (navigator.share) {
      navigator
        .share({
          title: 'Energy Planet',
          text: 'Присоединяйся ко мне в Energy Planet!',
          url: 'https://t.me/energy_planet_bot',
        })
        .then(() => {
          notifySuccess('Приглашение отправлено');
        })
        .catch(() => {
          window.open(inviteLink, '_blank');
          notifySuccess('Ссылка на приглашение открыта');
        });
      return;
    }

    window.open(inviteLink, '_blank');
    notifySuccess('Ссылка на приглашение открыта');
  }, [notifySuccess]);

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

      <FriendsList
        totalInvites={referralStats?.total_invites ?? 0}
        dailyInvitesUsed={referralStats?.daily_invites_used ?? 0}
        dailyInvitesLimit={referralStats?.daily_invites_limit ?? 0}
        referredByName={
          referralStats?.referred_by?.username || referralStats?.referred_by?.first_name || null
        }
        isLoading={isProfileLoading && !referralStats}
        error={profileError}
        onInvite={handleInvite}
        onViewLeaderboard={handleViewLeaderboard}
      />

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
