import { useMemo } from 'react';
import { useGameStore } from '../store/gameStore';

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
      <div className="profile-panel loading">
        <p>Загружаем профиль…</p>
      </div>
    );
  }

  if (profileError) {
    return (
      <div className="profile-panel error">
        <p>Не удалось получить профиль.</p>
        <small>{profileError}</small>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="profile-panel empty">
        <p>Профиль недоступен.</p>
      </div>
    );
  }

  return (
    <div className="profile-panel">
      <header className="profile-header">
        <div className="avatar" aria-hidden>
          {profile.profile.equipped_avatar_frame ? '🛡️' : '🙂'}
        </div>
        <div className="title">
          <h3>{profile.user.username || profile.user.first_name || 'Игрок'}</h3>
          <span>ID: {profile.user.id.slice(0, 8)}</span>
        </div>
      </header>

      <section className="profile-stats">
        <div className="stat">
          <span className="label">Уровень</span>
          <strong>{profile.progress.level}</strong>
        </div>
        <div className="stat">
          <span className="label">Энергия</span>
          <strong>{Math.floor(profile.progress.energy).toLocaleString()}</strong>
        </div>
        <div className="stat">
          <span className="label">Всего энергии</span>
          <strong>{Math.floor(profile.progress.total_energy_produced).toLocaleString()}</strong>
        </div>
        <div className="stat">
          <span className="label">Тап lvl</span>
          <strong>{profile.progress.tap_level}</strong>
        </div>
      </section>

      {profile.profile.bio && (
        <section className="profile-bio">
          <h4>О себе</h4>
          <p>{profile.profile.bio}</p>
        </section>
      )}

      {boosts.length > 0 && (
        <section className="profile-boosts">
          <h4>Активные бусты</h4>
          <ul>
            {boosts.map(boost => (
              <li key={boost.id}>
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
