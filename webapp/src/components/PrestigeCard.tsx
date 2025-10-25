import { useMemo } from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { formatNumberWithSpaces, formatCompactNumber } from '../utils/number';

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

  const multiplierLabel = useMemo(
    () => prestigeMultiplier.toFixed(2),
    [prestigeMultiplier]
  );

  const gainLabel = useMemo(() => {
    if (prestigeGainAvailable <= 0) {
      return 'Готово через: ' + energyRemainingLabel + ' E';
    }
    return `Доступно +${prestigeGainAvailable} к множителю`;
  }, [prestigeGainAvailable, energyRemainingLabel]);

  return (
    <Card>
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="m-0 text-base font-semibold">Престиж</h3>
            <p className="m-0 text-caption text-token-secondary">
              Уровень {prestigeLevel}, множитель ×{multiplierLabel}
            </p>
          </div>
          <Button
            variant={isPrestigeAvailable ? 'primary' : 'secondary'}
            size="sm"
            disabled={!isPrestigeAvailable}
            loading={isLoading}
            onClick={onPrestige}
          >
            {isPrestigeAvailable ? 'Престиж' : 'Не готово'}
          </Button>
        </div>

        <div className="w-full h-2 rounded-full bg-token-surface border border-token-border">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan via-lime to-gold"
            style={{ width: `${Math.max(4, progress * 100)}%` }}
          />
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs text-token-secondary">
          <div>
            <span className="block text-token-primary text-sm font-semibold">
              {energyCurrentLabel} E
            </span>
            <span>С момента последнего престижа</span>
          </div>
          <div className="text-right">
            <span className="block text-token-primary text-sm font-semibold">
              {energyTargetLabel} E
            </span>
            <span>Следующий порог</span>
          </div>
        </div>

        <div className="text-caption text-token-primary">{gainLabel}</div>
      </div>
    </Card>
  );
}
