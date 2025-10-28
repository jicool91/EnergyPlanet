import { useEffect, useMemo, useState } from 'react';
import { isAxiosError } from 'axios';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { fetchMonetizationMetrics, type MonetizationMetrics } from '@/services/admin';
import { logClientEvent } from '@/services/telemetry';

const WINDOW_PRESETS = [7, 14, 30] as const;

const percentFormatter = new Intl.NumberFormat('ru-RU', {
  style: 'percent',
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

const numberFormatter = new Intl.NumberFormat('ru-RU');
const dateFormatter = new Intl.DateTimeFormat('ru-RU', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

type WindowPreset = (typeof WINDOW_PRESETS)[number];

const getLast = <T,>(items: T[]): T | null => {
  if (!items.length) {
    return null;
  }
  return items[items.length - 1];
};

export const AdminMonetizationScreen: React.FC = () => {
  const [selectedWindow, setSelectedWindow] = useState<WindowPreset>(14);
  const [metrics, setMetrics] = useState<MonetizationMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshNonce, setRefreshNonce] = useState(0);

  useEffect(() => {
    void logClientEvent('admin_monetization_window_select', { days: selectedWindow });
  }, [selectedWindow]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const payload = await fetchMonetizationMetrics(selectedWindow);
        if (!cancelled) {
          setMetrics(payload);
          const lastDay = getLast(payload.daily);
          void logClientEvent('admin_monetization_fetch_success', {
            days: selectedWindow,
            last_date: lastDay?.date ?? null,
          });
        }
      } catch (err) {
        if (cancelled) {
          return;
        }

        let message = 'Не удалось загрузить метрики.';
        let status: number | undefined;

        if (isAxiosError(err)) {
          status = err.response?.status;
          const serverMessage =
            (err.response?.data && (err.response.data as { message?: string }).message) ??
            err.message;
          message = status ? `Ошибка ${status}: ${serverMessage}` : serverMessage;
        } else if (err instanceof Error) {
          message = err.message;
        }

        setError(message);
        void logClientEvent('admin_monetization_fetch_error', {
          days: selectedWindow,
          status,
          message,
        });
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [selectedWindow, refreshNonce]);

  const latestDay = useMemo(() => {
    if (!metrics) {
      return null;
    }
    return getLast(metrics.daily);
  }, [metrics]);

  const averages = useMemo(() => {
    if (!metrics || metrics.daily.length === 0) {
      return null;
    }

    const sum = metrics.daily.reduce(
      (acc, day) => {
        acc.shop.impressions += day.shopTabImpressions;
        acc.shop.views += day.shopViews;
        if (day.shopVisitRate !== null) {
          acc.shop.rates.push(day.shopVisitRate);
        }

        acc.quests.starts += day.questClaimStarts;
        acc.quests.success += day.questClaimSuccess;
        if (day.questClaimSuccessRate !== null) {
          acc.quests.rates.push(day.questClaimSuccessRate);
        }

        acc.upsell.views += day.dailyBoostUpsellViews;
        acc.upsell.clicks += day.dailyBoostUpsellClicks;
        if (day.dailyBoostUpsellCtr !== null) {
          acc.upsell.rates.push(day.dailyBoostUpsellCtr);
        }

        return acc;
      },
      {
        shop: { impressions: 0, views: 0, rates: [] as number[] },
        quests: { starts: 0, success: 0, rates: [] as number[] },
        upsell: { views: 0, clicks: 0, rates: [] as number[] },
      }
    );

    const averageRate = (values: number[]): number | null => {
      if (!values.length) {
        return null;
      }
      const total = values.reduce((acc, value) => acc + value, 0);
      return total / values.length;
    };

    return {
      shopVisitRate: sum.shop.impressions > 0 ? sum.shop.views / sum.shop.impressions : null,
      questClaimSuccessRate: sum.quests.starts > 0 ? sum.quests.success / sum.quests.starts : null,
      upsellCtr: sum.upsell.views > 0 ? sum.upsell.clicks / sum.upsell.views : null,
      shopVisitRateMean: averageRate(sum.shop.rates),
      questClaimSuccessMean: averageRate(sum.quests.rates),
      upsellCtrMean: averageRate(sum.upsell.rates),
    };
  }, [metrics]);

  const handleChangeWindow = (preset: WindowPreset) => {
    setSelectedWindow(preset);
  };

  const handleRefresh = () => {
    setRefreshNonce(previous => previous + 1);
  };

  const renderSummaryValue = (value: number | null) => {
    if (value === null || Number.isNaN(value)) {
      return '—';
    }
    return percentFormatter.format(value);
  };

  const renderDate = (date: string | null) => {
    if (!date) {
      return '—';
    }
    const parsed = new Date(`${date}T00:00:00Z`);
    return dateFormatter.format(parsed);
  };

  const renderCount = (value: number) => numberFormatter.format(value);

  const firstDayDate = metrics && metrics.daily.length > 0 ? metrics.daily[0].date : null;
  const lastDayDate = latestDay?.date ?? null;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="m-0 text-sm text-token-secondary">
              Окно: последние {selectedWindow} дн. · Обновлено {renderDate(lastDayDate)}
            </p>
            <p className="m-0 text-xs text-token-tertiary">
              Актуально с {renderDate(firstDayDate)} по {renderDate(lastDayDate)}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {WINDOW_PRESETS.map(preset => (
              <Button
                key={preset}
                variant={preset === selectedWindow ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => handleChangeWindow(preset)}
              >
                {preset} дн.
              </Button>
            ))}
            <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={loading}>
              🔄 Обновить
            </Button>
          </div>
        </div>
        {metrics && (
          <p className="m-0 text-xs text-token-tertiary">
            Последний экспорт:{' '}
            {metrics.generatedAt ? renderDate(metrics.generatedAt.slice(0, 10)) : '—'}
          </p>
        )}
      </header>

      {loading && (
        <Card className="text-sm text-token-secondary border-dashed border-token-subtle bg-token-surface-tertiary">
          Загружаем метрики…
        </Card>
      )}

      {error && (
        <Card className="text-sm text-red-error border-red-error/40 bg-red-error/5">{error}</Card>
      )}

      {!loading && !error && metrics && (
        <>
          <section className="grid sm:grid-cols-3 gap-4">
            <Card variant="elevated" className="flex flex-col gap-2 bg-cyan/5 border-cyan/20">
              <span className="text-xs uppercase tracking-wide text-cyan/80">Shop visit rate</span>
              <strong className="text-2xl text-token-primary">
                {renderSummaryValue(latestDay?.shopVisitRate ?? null)}
              </strong>
              <p className="m-0 text-xs text-token-secondary">
                Среднее: {renderSummaryValue(averages?.shopVisitRate ?? null)}
              </p>
              <p className="m-0 text-xs text-token-tertiary">
                Показы: {renderCount(latestDay?.shopTabImpressions ?? 0)} · Просмотры:{' '}
                {renderCount(latestDay?.shopViews ?? 0)}
              </p>
            </Card>

            <Card variant="elevated" className="flex flex-col gap-2 bg-lime/5 border-lime/20">
              <span className="text-xs uppercase tracking-wide text-lime/80">
                Quest claim success
              </span>
              <strong className="text-2xl text-token-primary">
                {renderSummaryValue(latestDay?.questClaimSuccessRate ?? null)}
              </strong>
              <p className="m-0 text-xs text-token-secondary">
                Среднее: {renderSummaryValue(averages?.questClaimSuccessRate ?? null)}
              </p>
              <p className="m-0 text-xs text-token-tertiary">
                Стартов: {renderCount(latestDay?.questClaimStarts ?? 0)} · Успех:{' '}
                {renderCount(latestDay?.questClaimSuccess ?? 0)}
              </p>
            </Card>

            <Card
              variant="elevated"
              className="flex flex-col gap-2 bg-amber-500/5 border-amber-500/20"
            >
              <span className="text-xs uppercase tracking-wide text-amber-500/80">Upsell CTR</span>
              <strong className="text-2xl text-token-primary">
                {renderSummaryValue(latestDay?.dailyBoostUpsellCtr ?? null)}
              </strong>
              <p className="m-0 text-xs text-token-secondary">
                Среднее: {renderSummaryValue(averages?.upsellCtr ?? null)}
              </p>
              <p className="m-0 text-xs text-token-tertiary">
                Просмотров: {renderCount(latestDay?.dailyBoostUpsellViews ?? 0)} · Кликов:{' '}
                {renderCount(latestDay?.dailyBoostUpsellClicks ?? 0)}
              </p>
            </Card>
          </section>

          <section className="flex flex-col gap-3">
            <h3 className="m-0 text-sm font-semibold text-token-primary">Динамика по дням</h3>
            <div className="overflow-x-auto rounded-lg border border-token-subtle">
              <table className="min-w-full text-xs text-left">
                <thead className="bg-token-surface-tertiary text-token-secondary uppercase tracking-wide">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Дата</th>
                    <th className="px-4 py-3 font-semibold">Shop visits</th>
                    <th className="px-4 py-3 font-semibold">Shop rate</th>
                    <th className="px-4 py-3 font-semibold">Quests success</th>
                    <th className="px-4 py-3 font-semibold">Quests rate</th>
                    <th className="px-4 py-3 font-semibold">Upsell CTR</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.daily.map(day => (
                    <tr
                      key={day.date}
                      className="odd:bg-token-surface-secondary even:bg-token-surface"
                    >
                      <td className="px-4 py-2 text-token-primary">{renderDate(day.date)}</td>
                      <td className="px-4 py-2 text-token-secondary">
                        {renderCount(day.shopViews)} / {renderCount(day.shopTabImpressions)}
                      </td>
                      <td className="px-4 py-2 text-token-primary">
                        {renderSummaryValue(day.shopVisitRate)}
                      </td>
                      <td className="px-4 py-2 text-token-secondary">
                        {renderCount(day.questClaimSuccess)} / {renderCount(day.questClaimStarts)}
                      </td>
                      <td className="px-4 py-2 text-token-primary">
                        {renderSummaryValue(day.questClaimSuccessRate)}
                      </td>
                      <td className="px-4 py-2 text-token-primary">
                        {renderSummaryValue(day.dailyBoostUpsellCtr)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
};
