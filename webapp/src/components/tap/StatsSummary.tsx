import { memo } from 'react';
import { Card } from '@/components/Card';
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
          <span className="text-sm uppercase tracking-[0.12em] text-[var(--color-text-secondary)]">
            Текущие показатели
          </span>
          <span className="rounded-full bg-layer-overlay-ghost-soft px-3 py-1 text-xs text-[var(--color-text-secondary)]">
            Лучшая серия: {bestStreak}
          </span>
        </header>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-[var(--color-text-secondary)]">Энергия</span>
            <span className="text-xl font-semibold text-[var(--color-text-primary)]">
              {formatNumber(energy)}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-[var(--color-text-secondary)]">Tap доход</span>
            <span className="text-xl font-semibold text-[var(--color-text-primary)]">
              {tapIncomeDisplay}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-[var(--color-text-secondary)]">Пассив</span>
            <span className="text-xl font-semibold text-[var(--color-text-primary)]">
              {passiveIncomeLabel}
            </span>
          </div>
        </div>
        <div className="rounded-2xl border border-border-layer bg-layer-overlay-ghost px-4 py-3">
          <p className="text-sm font-semibold text-[var(--color-text-primary)]">
            {multiplierLabel}
          </p>
          <p className="text-xs text-[var(--color-text-secondary)]">
            {multiplierParts.join(' · ')}
          </p>
        </div>
        <div className="flex items-center gap-3 text-sm text-[var(--color-text-secondary)]">
          <span className="rounded-full border border-border-layer-strong px-3 py-1">
            Серия {streakCount}
          </span>
          <span className="rounded-full border border-border-layer-strong px-3 py-1">
            Множитель ×{prestigeMultiplier.toFixed(2)}
          </span>
        </div>
      </Card>

      <Card className="flex flex-col gap-4">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.12em] text-[var(--color-text-secondary)]">
              Престиж
            </p>
            <p className="text-lg font-semibold text-[var(--color-text-primary)]">
              Уровень {prestigeLevel}
            </p>
          </div>
          <button
            type="button"
            onClick={onPrestige}
            disabled={!isPrestigeAvailable || isPrestigeLoading}
            className="rounded-2xl bg-[var(--color-accent-gold)] px-4 py-2 text-sm font-semibold text-[var(--color-bg-primary)] shadow-[0_12px_28px_rgba(243,186,47,0.2)] transition-transform duration-150 hover:scale-105 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPrestigeLoading
              ? 'Считаем…'
              : isPrestigeAvailable
                ? 'Сбросить прогресс'
                : 'Нужно больше энергии'}
          </button>
        </header>
        <div className="flex flex-col gap-2">
          <span className="text-xs text-[var(--color-text-secondary)]">
            Энергия с последнего престижа: {formatNumber(prestigeEnergySinceReset)}
          </span>
          <ProgressBar
            value={prestigeEnergySinceReset}
            max={prestigeNextThreshold}
            className="w-full"
          />
          <span className="text-xs text-[var(--color-text-secondary)]">
            До следующего улучшения: {formatNumber(prestigeEnergyToNext)}
          </span>
        </div>
        <div className="rounded-2xl border border-state-success-pill-strong bg-state-success-pill px-4 py-3 text-sm text-[var(--color-success)]">
          Потенциальный множитель: +{prestigeGainAvailable.toFixed(2)}×
        </div>
      </Card>
    </div>
  );
});
