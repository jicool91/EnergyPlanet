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
    <div className="flex flex-col gap-4 p-0">
      <div className="relative flex flex-col gap-1">
        <h2 className="m-0 text-xl text-[#f8fbff]">Boost Hub</h2>
        <p className="m-0 text-[13px] text-white/60">Активируйте бусты, чтобы ускорить прогресс</p>
        <button
          type="button"
          className="absolute top-0 right-0 px-[14px] py-2 rounded-md border-0 bg-cyan/[0.18] text-[#f8fbff] text-[13px] font-semibold cursor-pointer transition-all duration-[120ms] ease-in-out hover:enabled:-translate-y-px hover:enabled:shadow-[0_8px_18px_rgba(0,217,255,0.25)] disabled:opacity-60 disabled:cursor-default"
          onClick={() => loadBoostHub(true)}
          disabled={isBoostHubLoading}
        >
          {isBoostHubLoading ? 'Обновление…' : 'Обновить'}
        </button>
      </div>

      {boostHubError && <div className="px-4 py-3 bg-red-error/[0.15] border border-red-error/40 text-[#ffb8b8] rounded-md text-[13px]">{boostHubError}</div>}

      <div className="flex flex-col gap-4">
        {isBoostHubLoading && boostHub.length === 0 ? (
          <div className="p-6 text-center text-white/70 text-sm">Получаем данные о бустах…</div>
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
              <div key={item.boost_type} className="flex flex-col gap-[14px] p-[18px] rounded-lg bg-[rgba(10,14,32,0.92)] border border-cyan/[0.14] shadow-[0_18px_40px_rgba(7,12,35,0.35)]">
                <div>
                  <div className="flex justify-between items-center gap-3">
                    <h3 className="m-0 text-base text-[#f8fbff]">{label}</h3>
                    <span className="px-[10px] py-1 rounded-full bg-[rgba(255,193,77,0.25)] text-[#ffd27d] font-semibold text-[13px]">x{item.multiplier}</span>
                  </div>
                  <p className="m-0 text-[13px] text-white/70">{description}</p>
                </div>
                <div className="flex gap-4 text-xs text-white/60">
                  <span>Длительность: {formatDuration(item.duration_minutes)}</span>
                  <span>Кулдаун: {formatDuration(item.cooldown_minutes)}</span>
                </div>
                <button
                  type="button"
                  className="self-start px-[18px] py-[10px] rounded-md border-0 bg-gradient-to-br from-cyan/25 to-[rgba(38,127,255,0.35)] text-[#f8fbff] text-[13px] font-semibold cursor-pointer transition-all duration-[120ms] ease-in-out hover:enabled:-translate-y-px hover:enabled:shadow-[0_10px_26px_rgba(0,217,255,0.3)] disabled:opacity-60 disabled:cursor-default disabled:shadow-none"
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
