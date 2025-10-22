import { useMemo } from 'react';
import { useGameStore } from '../store/gameStore';
import { ProfileSkeleton, ErrorBoundary } from './skeletons';

export function ProfilePanel() {
  const {
    isProfileLoading,
    profileError,
    profile,
    profileBoosts,
  } = useGameStore(state => ({
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
        <div className="px-4 py-3 bg-red-error/[0.15] border border-red-error/40 text-[#ffb8b8] rounded-md text-[13px]">
          <p className="m-0 mb-2">Не удалось получить профиль.</p>
          <small className="text-white/60">{profileError}</small>
        </div>
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
        <div className="w-14 h-14 rounded-lg bg-cyan/[0.15] flex items-center justify-center text-[30px]" aria-hidden>
          {profile.profile.equipped_avatar_frame ? '🛡️' : '🙂'}
        </div>
        <div>
          <h3 className="m-0">{profile.user.username || profile.user.first_name || 'Игрок'}</h3>
          <span className="text-xs text-white/50">ID: {profile.user.id.slice(0, 8)}</span>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-3">
        <div className="bg-dark-secondary/60 border border-cyan/[0.12] p-3 rounded-md flex flex-col gap-[6px]">
          <span className="text-[11px] uppercase text-white/45">Уровень</span>
          <strong>{profile.progress.level}</strong>
        </div>
        <div className="bg-dark-secondary/60 border border-cyan/[0.12] p-3 rounded-md flex flex-col gap-[6px]">
          <span className="text-[11px] uppercase text-white/45">Энергия</span>
          <strong>{Math.floor(profile.progress.energy).toLocaleString()}</strong>
        </div>
        <div className="bg-dark-secondary/60 border border-cyan/[0.12] p-3 rounded-md flex flex-col gap-[6px]">
          <span className="text-[11px] uppercase text-white/45">Всего энергии</span>
          <strong>{Math.floor(profile.progress.total_energy_produced).toLocaleString()}</strong>
        </div>
        <div className="bg-dark-secondary/60 border border-cyan/[0.12] p-3 rounded-md flex flex-col gap-[6px]">
          <span className="text-[11px] uppercase text-white/45">Тап lvl</span>
          <strong>{profile.progress.tap_level}</strong>
        </div>
      </section>

      {profile.profile.bio && (
        <section className="bg-dark-secondary/60 border border-cyan/[0.12] rounded-md p-4">
          <h4 className="mb-2 text-sm uppercase tracking-[0.6px]">О себе</h4>
          <p>{profile.profile.bio}</p>
        </section>
      )}

      {boosts.length > 0 && (
        <section className="bg-dark-secondary/60 border border-cyan/[0.12] rounded-md p-4">
          <h4 className="mb-2 text-sm uppercase tracking-[0.6px]">Активные бусты</h4>
          <ul className="list-none flex flex-col gap-2 m-0 p-0">
            {boosts.map(boost => (
              <li key={boost.id} className="flex justify-between text-[13px]">
                <span>{boost.boost_type}</span>
                <span>x{boost.multiplier}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
