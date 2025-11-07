import { useEffect, useMemo } from 'react';
import { useGameStore } from '../store/gameStore';
import { ProfileSkeleton, ErrorBoundary } from './skeletons';
import { Card } from './Card';
import { Badge } from './Badge';
import { formatCompactNumber } from '../utils/number';
import { logClientEvent } from '@/services/telemetry';
import { useShallow } from 'zustand/react/shallow';

export function ProfilePanel() {
  const { isProfileLoading, profileError, profile, profileBoosts, userId } = useGameStore(
    useShallow(state => ({
      isProfileLoading: state.isProfileLoading,
      profileError: state.profileError,
      profile: state.profile,
      profileBoosts: state.profileBoosts,
      userId: state.userId,
    }))
  );

  const safeProfileBoosts = Array.isArray(profileBoosts) ? profileBoosts : [];

  useEffect(() => {
    if (isProfileLoading) {
      return;
    }
    if (profileError) {
      void logClientEvent('profile_panel_error', { userId, message: profileError }, 'warn');
      return;
    }
    if (!profile) {
      void logClientEvent('profile_panel_empty', { userId }, 'warn');
      return;
    }
    void logClientEvent('profile_panel_render', {
      userId,
      level: profile.progress.level,
      energy: profile.progress.energy,
      boosts: safeProfileBoosts.length,
    });
  }, [isProfileLoading, profile, safeProfileBoosts.length, profileError, userId]);

  const boosts = safeProfileBoosts;
  const energyValue = profile?.progress.energy ?? 0;
  const totalEnergyValue = profile?.progress.total_energy_produced ?? 0;
  const energyCompact = useMemo(() => formatCompactNumber(Math.floor(energyValue)), [energyValue]);
  const totalEnergyCompact = useMemo(
    () => formatCompactNumber(Math.floor(totalEnergyValue)),
    [totalEnergyValue]
  );
  const referralStats = profile?.referral ?? null;

  if (isProfileLoading && !profile) {
    return (
      <ErrorBoundary>
        <ProfileSkeleton />
      </ErrorBoundary>
    );
  }

  if (profileError) {
    return (
      <div className="flex flex-col gap-md">
        <Card className="bg-state-danger-pill border-state-danger-pill text-feedback-error">
          <p className="m-0 mb-sm font-semibold">Не удалось получить профиль.</p>
          <small className="text-text-secondary">{profileError}</small>
        </Card>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center gap-md text-center text-text-secondary">
        <p>Профиль недоступен.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-md">
      <Card className="flex items-center gap-md border border-border-cyan bg-gradient-to-r from-accent-cyan/60 via-feedback-success/50 to-accent-magenta/55 shadow-elevation-2">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-border-cyan bg-surface-glass-strong text-heading">
          {profile.profile.equipped_avatar_frame ? '🛡️' : '🙂'}
        </div>
        <div className="min-w-0">
          <h3 className="m-0 text-subheading font-bold text-text-primary truncate">
            {profile.user.username || profile.user.first_name || 'Игрок'}
          </h3>
          <span className="text-caption text-text-secondary">
            ID: {profile.user.id.slice(0, 8)}
          </span>
        </div>
      </Card>

      {/* Stats Grid */}
      <section className="grid grid-cols-2 gap-sm-plus">
        <Card className="flex flex-col gap-xs">
          <span className="text-micro uppercase text-text-secondary">Уровень</span>
          <strong className="text-title font-bold">{profile.progress.level}</strong>
        </Card>
        <Card className="flex flex-col gap-xs">
          <span className="text-micro uppercase text-text-secondary">Энергия</span>
          <strong className="text-title font-bold">{energyCompact}</strong>
        </Card>
        <Card className="flex flex-col gap-xs">
          <span className="text-micro uppercase text-text-secondary">Всего энергии</span>
          <strong className="text-title font-bold">{totalEnergyCompact}</strong>
        </Card>
        <Card className="flex flex-col gap-xs">
          <span className="text-micro uppercase text-text-secondary">Тап lvl</span>
          <strong className="text-title font-bold">{profile.progress.tap_level}</strong>
        </Card>
        {referralStats && (
          <Card className="col-span-2 flex flex-col gap-xs border border-border-cyan bg-gradient-to-br from-accent-cyan/40 via-feedback-success/45 to-accent-cyan/60 sm:col-span-1">
            <span className="text-micro uppercase text-text-secondary">Приглашено друзей</span>
            <strong className="text-title font-bold text-text-primary">
              {referralStats.total_invites}
            </strong>
            {referralStats.daily_invites_limit ? (
              <span className="text-caption text-text-secondary">
                Сегодня: {referralStats.daily_invites_used}/{referralStats.daily_invites_limit}
              </span>
            ) : (
              <span className="text-caption text-text-secondary">Без лимита сегодня</span>
            )}
          </Card>
        )}
      </section>

      {referralStats?.referred_by && (
        <Card className="flex flex-col gap-xs text-body border border-border-magenta bg-gradient-to-r from-accent-magenta/40 via-layer-overlay-strong to-accent-cyan/40">
          <span className="text-caption uppercase tracking-[0.12em] text-text-secondary">
            Вас пригласил
          </span>
          <span className="text-text-primary font-medium">
            {referralStats.referred_by.username || referralStats.referred_by.first_name || 'Друг'}
          </span>
        </Card>
      )}

      {/* Bio Section */}
      {profile.profile.bio && (
        <Card className="flex flex-col gap-sm">
          <h4 className="m-0 text-caption uppercase tracking-[0.16em] text-text-secondary">
            О себе
          </h4>
          <p className="m-0 text-body text-text-secondary">{profile.profile.bio}</p>
        </Card>
      )}

      {/* Active Boosts Section */}
      {boosts.length > 0 && (
        <Card className="flex flex-col gap-sm">
          <h4 className="m-0 text-caption uppercase tracking-[0.16em] text-text-secondary">
            Активные бусты
          </h4>
          <ul className="m-0 flex list-none flex-col gap-sm p-0">
            {boosts.map(boost => (
              <li
                key={boost.id}
                className="flex items-center justify-between rounded-2xl border border-border-cyan/60 bg-surface-glass px-sm-plus py-xs text-caption text-text-secondary"
              >
                <span className="text-text-primary">{boost.boost_type}</span>
                <Badge variant="success" size="sm">
                  x{boost.multiplier}
                </Badge>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
