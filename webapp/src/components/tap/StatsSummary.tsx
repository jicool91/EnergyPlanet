import { memo, useMemo, useCallback } from 'react';
import clsx from 'clsx';
import { motion } from 'framer-motion';
import { Card } from '@/components/Card';
import { Button, ProgressBar } from '@/components';
import { Text } from '@/components/ui/Text';
import { useAppReducedMotion } from '@/hooks/useAppReducedMotion';
import { useUserLocale } from '@/hooks/useUserLocale';

interface StatsSummaryProps {
  energy: number;
  tapIncome: number;
  passiveIncomePerSec: number;
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

interface LiveMetricValueProps {
  value: number;
  formatter: (value: number) => string;
  animate: boolean;
  className?: string;
}

function LiveMetricValue({ value, formatter, animate, className }: LiveMetricValueProps) {
  const content = formatter(value);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className={clsx('leading-tight text-text-primary tabular-nums', className)}
    >
      {animate ? (
        <motion.span
          key={content}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {content}
        </motion.span>
      ) : (
        content
      )}
    </div>
  );
}

export const StatsSummary = memo(function StatsSummary({
  energy,
  tapIncome,
  passiveIncomePerSec,
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
  const reduceMotion = useAppReducedMotion();
  const { localeTag, language } = useUserLocale();

  const integerFormatter = useMemo(
    () => new Intl.NumberFormat(localeTag, { maximumFractionDigits: 0 }),
    [localeTag]
  );

  const decimalFormatter = useMemo(
    () =>
      new Intl.NumberFormat(localeTag, {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      }),
    [localeTag]
  );

  const formatEnergy = useCallback(
    (value: number) => integerFormatter.format(Math.max(0, Math.round(value))),
    [integerFormatter]
  );

  const formatTapIncome = useCallback(
    (value: number) => integerFormatter.format(Math.max(0, Math.round(value))),
    [integerFormatter]
  );

  const formatPassiveIncome = useCallback(
    (value: number) => {
      if (!Number.isFinite(value) || value <= 0) {
        return '—';
      }
      const formatted =
        value >= 10 ? integerFormatter.format(Math.round(value)) : decimalFormatter.format(value);
      const unit = language === 'en' ? 'E/s' : 'E/с';
      return `${formatted} ${unit}`;
    },
    [decimalFormatter, integerFormatter, language]
  );

  const formatPrestigeMultiplier = useCallback(
    (value: number) => `${language === 'en' ? 'Multiplier' : 'Множитель'} ×${value.toFixed(2)}`,
    [language]
  );

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
            <LiveMetricValue
              value={energy}
              formatter={formatEnergy}
              animate={!reduceMotion}
              className="text-heading font-semibold"
            />
          </div>
          <div className="flex flex-col gap-1">
            <Text variant="bodySm" tone="secondary">
              Tap доход
            </Text>
            <LiveMetricValue
              value={tapIncome}
              formatter={formatTapIncome}
              animate={!reduceMotion}
              className="text-heading font-semibold"
            />
          </div>
          <div className="flex flex-col gap-1">
            <Text variant="bodySm" tone="secondary">
              Пассив
            </Text>
            <LiveMetricValue
              value={passiveIncomePerSec}
              formatter={formatPassiveIncome}
              animate={!reduceMotion}
              className="text-heading font-semibold"
            />
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
          <span className="rounded-full border border-border-layer-strong px-3 py-1 text-bodySm text-text-secondary">
            Серия {streakCount}
          </span>
          <div className="rounded-full border border-border-layer-strong px-3 py-1 text-bodySm text-text-secondary">
            <LiveMetricValue
              value={prestigeMultiplier}
              formatter={formatPrestigeMultiplier}
              animate={!reduceMotion}
              className="text-bodySm font-medium text-text-secondary"
            />
          </div>
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
          <Button
            size="md"
            variant={isPrestigeAvailable ? 'success' : 'secondary'}
            onClick={onPrestige}
            loading={isPrestigeLoading}
            loadingText="Считаем…"
            disabled={!isPrestigeAvailable && !isPrestigeLoading}
          >
            {isPrestigeAvailable ? 'Сбросить прогресс' : 'Нужно больше энергии'}
          </Button>
        </header>
        <div className="flex flex-col gap-2">
          <Text variant="bodySm" tone="secondary">
            Энергия с последнего престижа: {formatEnergy(prestigeEnergySinceReset)}
          </Text>
          <ProgressBar
            value={prestigeEnergySinceReset}
            max={prestigeNextThreshold}
            className="w-full"
          />
          <Text variant="bodySm" tone="secondary">
            До следующего улучшения: {formatEnergy(prestigeEnergyToNext)}
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
