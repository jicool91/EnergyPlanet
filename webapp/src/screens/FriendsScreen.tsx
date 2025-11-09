import { useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useShallow } from 'zustand/react/shallow';
import {
  TabPageSurface,
  Surface,
  LeaderboardPanel,
  FriendsList,
  ReferralRevenueCard,
  Button,
  Text,
} from '@/components';
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
    navigate('/shop?section=boosts', { replace: false });
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
    <TabPageSurface className="gap-6">
      <Surface
        tone="secondary"
        border="subtle"
        elevation="soft"
        padding="lg"
        rounded="3xl"
        className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex flex-col gap-1">
          <Text variant="title" weight="semibold">
            Рейтинг
          </Text>
          <Text variant="body" tone="secondary">
            Следите за прогрессом друзей и поднимайтесь выше в таблице.
          </Text>
        </div>
        <Button size="md" variant="primary" onClick={handleOpenShop}>
          В магазин бустов
        </Button>
      </Surface>

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

      {leaderboardError && !isLeaderboardLoading ? (
        <Surface
          tone="secondary"
          border="subtle"
          elevation="soft"
          padding="lg"
          rounded="3xl"
          className="flex flex-col items-center gap-3 text-center text-text-secondary"
        >
          <Text variant="body" tone="secondary">
            Не удалось загрузить рейтинг.
          </Text>
          <Button size="sm" variant="secondary" onClick={handleRetry}>
            Повторить
          </Button>
        </Surface>
      ) : (
        <Surface
          tone="secondary"
          border="subtle"
          elevation="soft"
          padding="lg"
          rounded="3xl"
          className="flex flex-col gap-4"
        >
          <LeaderboardPanel onOpenShop={handleOpenShop} />
        </Surface>
      )}
    </TabPageSurface>
  );
}
