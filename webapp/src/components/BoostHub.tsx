import { useEffect, useMemo, useState } from 'react';
import { useGameStore } from '../store/gameStore';

function formatSeconds(seconds: number): string {
  if (seconds <= 0) {
    return 'Доступно';
  }

  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hrs > 0) {
    return `${hrs}ч ${mins.toString().padStart(2, '0')}м`;
  }

  if (mins > 0) {
    return `${mins}м ${secs.toString().padStart(2, '0')}с`;
  }

  return `${secs}с`;
}

function formatDuration(minutes: number): string {
  if (minutes >= 60) {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hrs}ч ${mins}м` : `${hrs}ч`;
  }
  return `${minutes}м`;
}

function resolveBoostLabel(type: string): string {
  switch (type) {
    case 'ad_boost':
      return 'Рекламный буст';
    case 'daily_boost':
      return 'Ежедневный буст';
    case 'premium_boost':
      return 'Премиум буст';
    default:
      return type;
  }
}

export function BoostHub() {
  const {
    boostHub,
    isBoostHubLoading,
    boostHubError,
    isClaimingBoostType,
    loadBoostHub,
    claimBoost,
  } = useGameStore();

  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    loadBoostHub();
  }, [loadBoostHub]);

  useEffect(() => {
    if (boostHub.length === 0) {
      return;
    }

    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, [boostHub.length]);

  const items = useMemo(
    () =>
      boostHub.map(item => {
        const cooldownRemaining = Math.max(
          item.cooldown_remaining_seconds - Math.floor((Date.now() - now) / 1000),
          0
        );

        const activeRemaining = item.active
          ? Math.max(
              item.active.remaining_seconds - Math.floor((Date.now() - now) / 1000),
              0
            )
          : 0;

        return {
          ...item,
          cooldownRemaining,
          activeRemaining,
        };
      }),
    [boostHub, now]
  );

  return (
    <div className="boost-hub">
      <div className="boost-header">
        <h2>Boost Hub</h2>
        <p className="boost-subtitle">Активируйте бусты, чтобы ускорить прогресс</p>
        <button
          type="button"
          className="boost-refresh"
          onClick={() => loadBoostHub(true)}
          disabled={isBoostHubLoading}
        >
          {isBoostHubLoading ? 'Обновление…' : 'Обновить'}
        </button>
      </div>

      {boostHubError && <div className="shop-error">{boostHubError}</div>}

      <div className="boost-grid">
        {isBoostHubLoading && boostHub.length === 0 ? (
          <div className="shop-loader">Получаем данные о бустах…</div>
        ) : (
          items.map(item => {
            const label = resolveBoostLabel(item.boost_type);
            const description = item.requires_premium
              ? 'Доступно владельцам премиум-подписки'
              : item.boost_type === 'ad_boost'
                ? 'Смотрите рекламу, чтобы получить буст'
                : 'Бесплатный буст с кулдауном';

            const buttonDisabled =
              item.activeRemaining > 0 || item.cooldownRemaining > 0 || isClaimingBoostType === item.boost_type;

            const buttonLabel = item.activeRemaining > 0
              ? `Активно — ${formatSeconds(item.activeRemaining)}`
              : item.cooldownRemaining > 0
                ? `Кулдаун ${formatSeconds(item.cooldownRemaining)}`
                : isClaimingBoostType === item.boost_type
                  ? 'Активация…'
                  : item.boost_type === 'ad_boost'
                    ? 'Получить ×2'
                    : 'Активировать';

            return (
              <div key={item.boost_type} className="boost-card">
                <div className="boost-card-header">
                  <div className="boost-title-row">
                    <h3>{label}</h3>
                    <span className="boost-multiplier">x{item.multiplier}</span>
                  </div>
                  <p className="boost-description">{description}</p>
                </div>
                <div className="boost-meta">
                  <span>Длительность: {formatDuration(item.duration_minutes)}</span>
                  <span>Кулдаун: {formatDuration(item.cooldown_minutes)}</span>
                </div>
                <button
                  type="button"
                  className="boost-button"
                  onClick={() => claimBoost(item.boost_type)}
                  disabled={buttonDisabled}
                >
                  {buttonLabel}
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
