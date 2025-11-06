import { useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useShallow } from 'zustand/react/shallow';
import { TabPageSurface, LeaderboardPanel, FriendsList, ReferralRevenueCard } from '@/components';
import { useGameStore } from '@/store/gameStore';
import { useAuthStore } from '@/store/authStore';
import { useReferralStore } from '@/store/referralStore';
import { useReferralRevenueStore } from '@/store/referralRevenueStore';
import { useNotification } from '@/hooks/useNotification';
import { useRenderLatencyMetric } from '@/hooks/useRenderLatencyMetric';
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
  const { referral, loadSummary: loadReferralSummary } = useReferralStore(
    useShallow(state => ({
      referral: state.referral,
      loadSummary: state.loadSummary,
    }))
  );
  const {
    overview: revenueOverview,
    isLoading: isRevenueLoading,
    error: revenueError,
    loadOverview: loadRevenueOverview,
  } = useReferralRevenueStore(
    useShallow(state => ({
      overview: state.overview,
      isLoading: state.isLoading,
      error: state.error,
      loadOverview: state.loadOverview,
    }))
  );

  useEffect(() => {
    if (!authReady || referral) {
      return;
    }
    void loadReferralSummary().catch(error => {
      console.warn('Failed to preload referral summary', error);
    });
  }, [authReady, referral, loadReferralSummary]);

  useEffect(() => {
    if (!authReady || revenueOverview) {
      return;
    }
    void loadRevenueOverview().catch(error => {
      console.warn('Failed to preload referral revenue overview', error);
    });
  }, [authReady, revenueOverview, loadRevenueOverview]);

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
    const baseBotLink = 'https://t.me/energy_planet_bot';
    const fallbackShareUrl = `https://t.me/share/url?url=${encodeURIComponent(
      baseBotLink
    )}&text=${encodeURIComponent('Присоединяйся к Energy Planet!')}`;
    const shareUrl = referral?.shareUrl ?? fallbackShareUrl;
    const nativeShareText = referral
      ? `Присоединяйся ко мне в Energy Planet! Мой код: ${referral.code}`
      : 'Присоединяйся ко мне в Energy Planet!';
    const directLink = referral
      ? `${baseBotLink}?start=ref_${encodeURIComponent(referral.code)}`
      : baseBotLink;

    if (typeof window === 'undefined') {
      return;
    }

    logClientEvent('friends_invite_click', {
      source: 'friends_screen',
      hasReferralLink: Boolean(referral?.shareUrl),
    });

    const telegram = (
      window as typeof window & {
        Telegram?: { WebApp?: { openTelegramLink?: (url: string) => void } };
      }
    ).Telegram?.WebApp;

    if (telegram?.openTelegramLink) {
      telegram.openTelegramLink(shareUrl);
      notifySuccess('Открыли приглашение в Telegram');
      return;
    }

    if (navigator.share) {
      navigator
        .share({
          title: 'Energy Planet',
          text: nativeShareText,
          url: directLink,
        })
        .then(() => {
          notifySuccess('Приглашение отправлено');
        })
        .catch(() => {
          window.open(shareUrl, '_blank');
          notifySuccess('Ссылка на приглашение открыта');
        });
      return;
    }

    window.open(shareUrl, '_blank');
    notifySuccess('Ссылка на приглашение открыта');
  }, [notifySuccess, referral]);

  useRenderLatencyMetric({ screen: 'friends_screen' });

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-heading font-semibold text-text-primary">Рейтинг</h1>
          <p className="text-body text-text-secondary">
            Следите за прогрессом друзей и поднимайтесь выше в таблице.
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenShop}
          className="rounded-2xl bg-accent-gold px-4 py-2 text-body font-semibold text-text-inverse shadow-glow-gold transition-transform duration-150 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-surface-primary focus-visible:ring-offset-2 focus-visible:ring-offset-accent-gold"
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

      <ReferralRevenueCard
        overview={revenueOverview}
        isLoading={isRevenueLoading}
        error={revenueError}
        onRetry={() => {
          void loadRevenueOverview(true);
        }}
      />

      <TabPageSurface>
        {leaderboardError && !isLeaderboardLoading ? (
          <div className="flex flex-col items-center gap-3 text-center text-text-secondary">
            <p>Не удалось загрузить рейтинг.</p>
            <button
              type="button"
              onClick={handleRetry}
              className="rounded-2xl border border-border-layer-strong px-4 py-2 text-body text-text-primary transition-colors duration-150 hover:bg-layer-overlay-ghost-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface-primary"
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
