import { useMemo } from 'react';
import { useGameStore } from '../store/gameStore';
import { ProfileSkeleton, ErrorBoundary } from './skeletons';
import { Card } from './Card';
import { Badge } from './Badge';

export function ProfilePanel() {
  const { isProfileLoading, profileError, profile, profileBoosts } = useGameStore(state => ({
    isProfileLoading: state.isProfileLoading,
    profileError: state.profileError,
    profile: state.profile,
    profileBoosts: state.profileBoosts,
  }));

  const boosts = useMemo(() => profileBoosts, [profileBoosts]);

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
        <Card className="bg-red-error/15 border-red-error/40 text-red-error">
          <p className="m-0 mb-2 font-semibold">Не удалось получить профиль.</p>
          <small className="text-white/60">{profileError}</small>
        </Card>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-0 flex flex-col gap-4 items-center justify-center text-center text-white/70">
        <p>Профиль недоступен.</p>
      </div>
    );
  }

  return (
    <div className="p-0 flex flex-col gap-4">
      <header className="flex items-center gap-3">
        <div
          className="w-14 h-14 rounded-lg bg-cyan/[0.15] flex items-center justify-center text-[30px]"
          aria-hidden
        >
          {profile.profile.equipped_avatar_frame ? '🛡️' : '🙂'}
        </div>
        <div>
          <h3 className="m-0">{profile.user.username || profile.user.first_name || 'Игрок'}</h3>
          <span className="text-xs text-white/50">ID: {profile.user.id.slice(0, 8)}</span>
        </div>
      </header>

      {/* Stats Grid */}
      <section className="grid grid-cols-2 gap-3">
        <Card className="flex flex-col gap-2">
          <span className="text-micro uppercase text-white/45">Уровень</span>
          <strong className="text-heading">{profile.progress.level}</strong>
        </Card>
        <Card className="flex flex-col gap-2">
          <span className="text-micro uppercase text-white/45">Энергия</span>
          <strong className="text-heading">
            {Math.floor(profile.progress.energy).toLocaleString()}
          </strong>
        </Card>
        <Card className="flex flex-col gap-2">
          <span className="text-micro uppercase text-white/45">Всего энергии</span>
          <strong className="text-heading">
            {Math.floor(profile.progress.total_energy_produced).toLocaleString()}
          </strong>
        </Card>
        <Card className="flex flex-col gap-2">
          <span className="text-micro uppercase text-white/45">Тап lvl</span>
          <strong className="text-heading">{profile.progress.tap_level}</strong>
        </Card>
      </section>

      {/* Bio Section */}
      {profile.profile.bio && (
        <Card>
          <h4 className="mb-2 text-body uppercase font-semibold">О себе</h4>
          <p className="m-0 text-caption text-white/80">{profile.profile.bio}</p>
        </Card>
      )}

      {/* Active Boosts Section */}
      {boosts.length > 0 && (
        <Card>
          <h4 className="mb-3 text-body uppercase font-semibold">Активные бусты</h4>
          <ul className="list-none flex flex-col gap-2 m-0 p-0">
            {boosts.map(boost => (
              <li key={boost.id} className="flex justify-between items-center text-caption">
                <span className="text-white/80">{boost.boost_type}</span>
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
