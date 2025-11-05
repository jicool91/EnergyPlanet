import { memo } from 'react';
import { Card } from '@/components/Card';
import { Text } from '@/components/ui/Text';
import { ProgressBar } from '@/components';

interface StatsSummaryProps {
  energy: number;
  tapIncomeDisplay: string;
  passiveIncomeLabel: string;
  streakCount: number;
  bestStreak: number;
  multiplierLabel: string;
  multiplierParts: string[];
  prestigeLevel: number;
  prestigeMultiplier: number;
  prestigeEnergySinceReset: number;
  prestigeEnergyToNext: number;
  prestigeGainAvailable: number;
  prestigeNextThreshold: number;
  isPrestigeAvailable: boolean;
  isPrestigeLoading: boolean;
  onPrestige: () => void;
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(value);
}

export const StatsSummary = memo(function StatsSummary({
  energy,
  tapIncomeDisplay,
  passiveIncomeLabel,
  streakCount,
  bestStreak,
  multiplierLabel,
  multiplierParts,
  prestigeLevel,
  prestigeMultiplier,
  prestigeEnergySinceReset,
  prestigeEnergyToNext,
  prestigeGainAvailable,
  prestigeNextThreshold,
  isPrestigeAvailable,
  isPrestigeLoading,
  onPrestige,
}: StatsSummaryProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="flex flex-col gap-3">
        <header className="flex items-center justify-between">
          <Text variant="label" tone="secondary" transform="uppercase">
            Текущие показатели
          </Text>
          <Text
            as="span"
            variant="bodySm"
            tone="secondary"
            className="rounded-full bg-layer-overlay-ghost-soft px-3 py-1"
          >
            Лучшая серия: {bestStreak}
          </Text>
        </header>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="flex flex-col gap-1">
            <Text variant="bodySm" tone="secondary">
              Энергия
            </Text>
            <Text as="span" variant="heading" weight="semibold">
              {formatNumber(energy)}
            </Text>
          </div>
          <div className="flex flex-col gap-1">
            <Text variant="bodySm" tone="secondary">
              Tap доход
            </Text>
            <Text as="span" variant="heading" weight="semibold">
              {tapIncomeDisplay}
            </Text>
          </div>
          <div className="flex flex-col gap-1">
            <Text variant="bodySm" tone="secondary">
              Пассив
            </Text>
            <Text as="span" variant="heading" weight="semibold">
              {passiveIncomeLabel}
            </Text>
          </div>
        </div>
        <div className="rounded-2xl border border-border-layer bg-layer-overlay-ghost px-4 py-3">
          <Text as="p" variant="body" weight="semibold">
            {multiplierLabel}
          </Text>
          <Text as="p" variant="bodySm" tone="secondary">
            {multiplierParts.join(' · ')}
          </Text>
        </div>
        <div className="flex items-center gap-3">
          <Text
            as="span"
            variant="bodySm"
            tone="secondary"
            className="rounded-full border border-border-layer-strong px-3 py-1"
          >
            Серия {streakCount}
          </Text>
          <Text
            as="span"
            variant="bodySm"
            tone="secondary"
            className="rounded-full border border-border-layer-strong px-3 py-1"
          >
            Множитель ×{prestigeMultiplier.toFixed(2)}
          </Text>
        </div>
      </Card>

      <Card className="flex flex-col gap-4">
        <header className="flex items-center justify-between">
          <div>
            <Text variant="label" tone="secondary" transform="uppercase">
              Престиж
            </Text>
            <Text variant="title" weight="semibold">
              Уровень {prestigeLevel}
            </Text>
          </div>
          <button
            type="button"
            onClick={onPrestige}
            disabled={!isPrestigeAvailable || isPrestigeLoading}
            className="rounded-2xl bg-accent-gold px-4 py-2 text-body font-semibold text-text-inverse shadow-glow-gold transition-transform duration-150 hover:scale-105 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPrestigeLoading
              ? 'Считаем…'
              : isPrestigeAvailable
                ? 'Сбросить прогресс'
                : 'Нужно больше энергии'}
          </button>
        </header>
        <div className="flex flex-col gap-2">
          <Text variant="bodySm" tone="secondary">
            Энергия с последнего престижа: {formatNumber(prestigeEnergySinceReset)}
          </Text>
          <ProgressBar
            value={prestigeEnergySinceReset}
            max={prestigeNextThreshold}
            className="w-full"
          />
          <Text variant="bodySm" tone="secondary">
            До следующего улучшения: {formatNumber(prestigeEnergyToNext)}
          </Text>
        </div>
        <Text
          as="div"
          variant="body"
          tone="success"
          className="rounded-2xl border border-state-success-pill-strong bg-state-success-pill px-4 py-3"
        >
          Потенциальный множитель: +{prestigeGainAvailable.toFixed(2)}×
        </Text>
      </Card>
    </div>
  );
});
