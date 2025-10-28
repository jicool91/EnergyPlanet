import { useMemo, useEffect, useRef, useCallback } from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { formatNumberWithSpaces, formatCompactNumber } from '../utils/number';
import { logClientEvent } from '@/services/telemetry';

interface PrestigeCardProps {
  prestigeLevel: number;
  prestigeMultiplier: number;
  prestigeEnergySinceReset: number;
  prestigeNextThreshold: number;
  prestigeEnergyToNext: number;
  prestigeGainAvailable: number;
  isPrestigeAvailable: boolean;
  isLoading: boolean;
  onPrestige: () => void;
}

export function PrestigeCard({
  prestigeLevel,
  prestigeMultiplier,
  prestigeEnergySinceReset,
  prestigeNextThreshold,
  prestigeEnergyToNext,
  prestigeGainAvailable,
  isPrestigeAvailable,
  isLoading,
  onPrestige,
}: PrestigeCardProps) {
  const hasLoggedAvailabilityRef = useRef(false);

  const progress = useMemo(() => {
    if (prestigeNextThreshold <= 0) {
      return 0;
    }
    return Math.min(1, prestigeEnergySinceReset / prestigeNextThreshold);
  }, [prestigeEnergySinceReset, prestigeNextThreshold]);

  const energyCurrentLabel = useMemo(
    () => formatCompactNumber(Math.floor(prestigeEnergySinceReset)),
    [prestigeEnergySinceReset]
  );

  const energyTargetLabel = useMemo(
    () => formatCompactNumber(Math.floor(prestigeNextThreshold)),
    [prestigeNextThreshold]
  );

  const energyRemainingLabel = useMemo(
    () => formatNumberWithSpaces(Math.max(0, Math.floor(prestigeEnergyToNext))),
    [prestigeEnergyToNext]
  );

  const multiplierLabel = useMemo(() => prestigeMultiplier.toFixed(2), [prestigeMultiplier]);

  const gainLabel = useMemo(() => {
    if (prestigeGainAvailable <= 0) {
      return 'Готово через: ' + energyRemainingLabel + ' E';
    }
    return `Доступно +${prestigeGainAvailable} к множителю`;
  }, [prestigeGainAvailable, energyRemainingLabel]);

  useEffect(() => {
    if (isPrestigeAvailable) {
      if (!hasLoggedAvailabilityRef.current) {
        hasLoggedAvailabilityRef.current = true;
        void logClientEvent('prestige_cta_available', {
          prestige_level: prestigeLevel,
          gain_available: prestigeGainAvailable,
          multiplier: prestigeMultiplier,
        });
      }
    } else {
      hasLoggedAvailabilityRef.current = false;
    }
  }, [isPrestigeAvailable, prestigeGainAvailable, prestigeLevel, prestigeMultiplier]);

  const handlePrestigeClick = useCallback(() => {
    void logClientEvent('prestige_cta_click', {
      prestige_level: prestigeLevel,
      gain_available: prestigeGainAvailable,
      multiplier: prestigeMultiplier,
    });
    onPrestige();
  }, [onPrestige, prestigeGainAvailable, prestigeLevel, prestigeMultiplier]);

  return (
    <Card className="relative overflow-hidden rounded-2xl border border-[rgba(255,215,0,0.35)] bg-gradient-to-br from-[rgba(16,19,56,0.92)] via-[rgba(27,13,72,0.9)] to-[rgba(56,16,94,0.95)] shadow-glow-gold">
      <div
        className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,215,0,0.18),_transparent_55%)]"
        aria-hidden
      />

      <div className="relative flex flex-col gap-md">
        <header className="flex items-start justify-between gap-md">
          <div className="flex flex-col gap-xs">
            <span className="inline-flex items-center gap-xs-plus rounded-full border border-[rgba(255,215,0,0.45)] bg-[rgba(255,215,0,0.08)] px-sm-plus py-xs text-label text-[var(--color-warning)] uppercase">
              Prestige
            </span>
            <h3 className="m-0 text-heading font-bold text-[var(--color-text-primary)]">
              Уровень {prestigeLevel}
            </h3>
            <p className="m-0 text-body text-[var(--color-text-secondary)]">
              Текущий множитель{' '}
              <span className="font-semibold text-[var(--color-text-primary)]">
                ×{multiplierLabel}
              </span>
            </p>
          </div>

          <Button
            variant={isPrestigeAvailable ? 'primary' : 'secondary'}
            size="md"
            disabled={!isPrestigeAvailable}
            loading={isLoading}
            onClick={handlePrestigeClick}
            className={isPrestigeAvailable ? 'shadow-glow' : 'shadow-elevation-1'}
          >
            {isPrestigeAvailable ? 'Активировать' : 'Недоступно'}
          </Button>
        </header>

        <div className="flex flex-col gap-sm">
          <div className="flex items-center justify-between text-label text-[var(--color-text-secondary)] uppercase">
            <span>Прогресс</span>
            <span>{Math.round(progress * 100)}%</span>
          </div>
          <div className="h-3 rounded-full bg-[rgba(255,255,255,0.08)] shadow-inner relative">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[var(--color-cyan)] via-[var(--color-success)] to-[var(--color-gold)] shadow-glow"
              style={{ width: `${Math.max(6, progress * 100)}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-sm text-body-sm text-[var(--color-text-secondary)]">
          <div className="rounded-xl bg-[rgba(0,217,255,0.08)] px-md py-sm border border-[rgba(0,217,255,0.25)]">
            <span className="block text-label text-[var(--color-text-secondary)] uppercase">
              Накоплено
            </span>
            <span className="text-title font-bold text-[var(--color-text-primary)]">
              {energyCurrentLabel} E
            </span>
            <span>С момента последнего сброса</span>
          </div>
          <div className="rounded-xl bg-[rgba(255,215,0,0.1)] px-md py-sm border border-[rgba(255,215,0,0.3)] text-right">
            <span className="block text-label text-[var(--color-text-secondary)] uppercase">
              Следующая цель
            </span>
            <span className="text-title font-bold text-[var(--color-text-primary)]">
              {energyTargetLabel} E
            </span>
            <span>Чтобы усилить множитель</span>
          </div>
        </div>

        <footer className="rounded-xl bg-[rgba(255,255,255,0.08)] px-md py-sm text-body font-semibold text-[var(--color-text-primary)]">
          {gainLabel}
        </footer>
      </div>
    </Card>
  );
}
