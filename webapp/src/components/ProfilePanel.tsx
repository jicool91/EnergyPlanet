import { useMemo } from 'react';
import { useGameStore } from '../store/gameStore';
import { ProfileSkeleton, ErrorBoundary } from './skeletons';
import { Card } from './Card';
import { Badge } from './Badge';
import { formatCompactNumber } from '../utils/number';

export function ProfilePanel() {
  const { isProfileLoading, profileError, profile, profileBoosts } = useGameStore(state => ({
    isProfileLoading: state.isProfileLoading,
    profileError: state.profileError,
    profile: state.profile,
    profileBoosts: state.profileBoosts,
  }));

  const boosts = useMemo(() => profileBoosts, [profileBoosts]);
  const energyValue = profile?.progress.energy ?? 0;
  const totalEnergyValue = profile?.progress.total_energy_produced ?? 0;
  const energyCompact = useMemo(() => formatCompactNumber(Math.floor(energyValue)), [energyValue]);
  const totalEnergyCompact = useMemo(
    () => formatCompactNumber(Math.floor(totalEnergyValue)),
    [totalEnergyValue]
  );

  if (isProfileLoading && !profile) {
    return (
      <ErrorBoundary>
        <ProfileSkeleton />
      </ErrorBoundary>
    );
  }

  if (profileError) {
    return (
      <div className="p-0 flex flex-col gap-4">
        <Card className="bg-[var(--color-text-destructive)]/10 border-[var(--color-text-destructive)]/40 text-[var(--color-text-destructive)]">
          <p className="m-0 mb-2 font-semibold">Не удалось получить профиль.</p>
          <small className="text-token-secondary">{profileError}</small>
        </Card>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-0 flex flex-col gap-4 items-center justify-center text-center text-token-secondary">
        <p>Профиль недоступен.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-md">
      <header className="flex items-center gap-3">
        <div
          className="w-14 h-14 rounded-lg bg-cyan/[0.15] flex items-center justify-center text-heading"
          aria-hidden
        >
          {profile.profile.equipped_avatar_frame ? '🛡️' : '🙂'}
        </div>
        <div>
          <h3 className="m-0">{profile.user.username || profile.user.first_name || 'Игрок'}</h3>
          <span className="text-xs text-[var(--color-text-secondary)]">
            ID: {profile.user.id.slice(0, 8)}
          </span>
        </div>
      </header>

      {/* Stats Grid */}
      <section className="grid grid-cols-2 gap-3">
        <Card className="flex flex-col gap-2">
          <span className="text-micro uppercase text-[var(--color-text-secondary)]">Уровень</span>
          <strong className="text-heading">{profile.progress.level}</strong>
        </Card>
        <Card className="flex flex-col gap-2">
          <span className="text-micro uppercase text-[var(--color-text-secondary)]">Энергия</span>
          <strong className="text-heading">{energyCompact}</strong>
        </Card>
        <Card className="flex flex-col gap-2">
          <span className="text-micro uppercase text-[var(--color-text-secondary)]">
            Всего энергии
          </span>
          <strong className="text-heading">{totalEnergyCompact}</strong>
        </Card>
        <Card className="flex flex-col gap-2">
          <span className="text-micro uppercase text-[var(--color-text-secondary)]">Тап lvl</span>
          <strong className="text-heading">{profile.progress.tap_level}</strong>
        </Card>
      </section>

      {/* Bio Section */}
      {profile.profile.bio && (
        <Card>
          <h4 className="mb-2 text-body uppercase font-semibold">О себе</h4>
          <p className="m-0 text-caption text-token-secondary">{profile.profile.bio}</p>
        </Card>
      )}

      {/* Active Boosts Section */}
      {boosts.length > 0 && (
        <Card>
          <h4 className="mb-3 text-body uppercase font-semibold">Активные бусты</h4>
          <ul className="list-none flex flex-col gap-2 m-0 p-0">
            {boosts.map(boost => (
              <li key={boost.id} className="flex justify-between items-center text-caption">
                <span className="text-token-primary">{boost.boost_type}</span>
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
