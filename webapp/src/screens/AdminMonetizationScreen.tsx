import { useCallback, useEffect, useMemo, useState } from 'react';
import { isAxiosError } from 'axios';
import { Button, TabPageSurface, Surface, Text } from '@/components';
import { ShopPanel, type ShopSection } from '@/components/ShopPanel';
import {
  fetchMonetizationMetrics,
  fetchSeasonSnapshot,
  rewardSeasonPlacement,
  type MonetizationMetrics,
  type SeasonSnapshot,
} from '@/services/admin';
import { logClientEvent } from '@/services/telemetry';
import {
  SeasonRewardsAdminPanel,
  type SeasonRewardEntry,
} from '@/components/seasonal/SeasonRewardsAdminPanel';

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
  const [seasonSnapshot, setSeasonSnapshot] = useState<SeasonSnapshot | null>(null);
  const [seasonLoading, setSeasonLoading] = useState(false);
  const [seasonError, setSeasonError] = useState<string | null>(null);
  const [seasonRefreshNonce, setSeasonRefreshNonce] = useState(0);
  const [rewardingSeasonUserId, setRewardingSeasonUserId] = useState<string | null>(null);
  const [adminShopSection] = useState<ShopSection>('star_packs');

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

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setSeasonLoading(true);
      setSeasonError(null);
      try {
        const snapshot = await fetchSeasonSnapshot();
        if (!cancelled) {
          setSeasonSnapshot(snapshot);
        }
      } catch (err) {
        if (cancelled) {
          return;
        }

        let message = 'Не удалось загрузить данные сезона.';
        if (isAxiosError(err)) {
          const serverMessage =
            (err.response?.data && (err.response.data as { message?: string }).message) ??
            err.message;
          message = serverMessage ?? message;
        } else if (err instanceof Error) {
          message = err.message;
        }

        setSeasonError(message);
        setSeasonSnapshot(null);
      } finally {
        if (!cancelled) {
          setSeasonLoading(false);
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [seasonRefreshNonce]);

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

  const seasonEntries = useMemo<SeasonRewardEntry[]>(() => {
    if (!seasonSnapshot) {
      return [];
    }

    return seasonSnapshot.leaderboard.map(entry => {
      const fullName = [entry.firstName, entry.lastName]
        .filter((part): part is string => Boolean(part))
        .join(' ')
        .trim();
      const displayName =
        entry.username ?? (fullName.length > 0 ? fullName : `Игрок ${entry.userId.slice(0, 6)}`);

      const mappedTier: SeasonRewardEntry['rewardTier'] =
        entry.rewardTier === 'gold' ||
        entry.rewardTier === 'silver' ||
        entry.rewardTier === 'bronze'
          ? entry.rewardTier
          : entry.finalRank === 1
            ? 'gold'
            : entry.finalRank === 2
              ? 'silver'
              : 'bronze';

      return {
        rank: entry.finalRank ?? 0,
        userId: entry.userId,
        player: displayName,
        energyTotal: entry.energyTotal ?? 0,
        rewardStatus: entry.claimed ? 'granted' : 'pending',
        rewardTier: mappedTier,
        couponCode: entry.couponCode ?? null,
      };
    });
  }, [seasonSnapshot]);

  const handleChangeWindow = (preset: WindowPreset) => {
    setSelectedWindow(preset);
  };

  const handleRefresh = () => {
    setRefreshNonce(previous => previous + 1);
  };

  const handleRefreshSeason = useCallback(() => {
    setSeasonRefreshNonce(previous => previous + 1);
  }, []);

  const isProcessingSeasonReward = rewardingSeasonUserId !== null;

  const handleRewardSeasonPlayer = useCallback(
    async (entry: SeasonRewardEntry) => {
      if (!seasonSnapshot) {
        throw new Error('Сезон не загружен');
      }

      setRewardingSeasonUserId(entry.userId);
      try {
        await rewardSeasonPlacement(seasonSnapshot.seasonId, {
          userId: entry.userId,
          rewardTier: entry.rewardTier,
          couponCode: entry.couponCode ?? undefined,
        });

        const grantedAt = new Date().toISOString();
        setSeasonSnapshot(prev => {
          if (!prev) {
            return prev;
          }
          return {
            ...prev,
            leaderboard: prev.leaderboard.map(item =>
              item.userId === entry.userId
                ? {
                    ...item,
                    claimed: true,
                    claimedAt: grantedAt,
                    couponCode: entry.couponCode ?? item.couponCode ?? null,
                  }
                : item
            ),
          };
        });

        void logClientEvent('admin_season_reward_grant', {
          season_id: seasonSnapshot.seasonId,
          user_id: entry.userId,
          reward_tier: entry.rewardTier,
        });
      } finally {
        setRewardingSeasonUserId(null);
      }
    },
    [seasonSnapshot]
  );

  const handleExportSeasonSnapshot = useCallback(() => {
    if (!seasonSnapshot) {
      return;
    }
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    const snapshotBlob = new Blob([JSON.stringify(seasonSnapshot, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(snapshotBlob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `season-${seasonSnapshot.seasonNumber}-snapshot.json`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);

    void logClientEvent('admin_season_snapshot_export', {
      season_id: seasonSnapshot.seasonId,
      season_number: seasonSnapshot.seasonNumber,
    });
  }, [seasonSnapshot]);

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
    <TabPageSurface className="gap-6">
      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-col gap-1">
            <Text variant="bodySm" tone="secondary">
              Окно: последние {selectedWindow} дн. · Обновлено {renderDate(lastDayDate)}
            </Text>
            <Text variant="caption" tone="tertiary">
              Актуально с {renderDate(firstDayDate)} по {renderDate(lastDayDate)}
            </Text>
          </div>
          <div className="flex flex-wrap gap-2">
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
          <Text variant="caption" tone="tertiary">
            Последний экспорт:{' '}
            {metrics.generatedAt ? renderDate(metrics.generatedAt.slice(0, 10)) : '—'}
          </Text>
        )}
      </header>

      {loading && (
        <Surface
          tone="secondary"
          border="subtle"
          elevation="soft"
          padding="lg"
          rounded="3xl"
          className="text-body text-text-secondary"
        >
          Загружаем метрики…
        </Surface>
      )}

      {error && (
        <Surface
          tone="secondary"
          border="strong"
          elevation="soft"
          padding="lg"
          rounded="3xl"
          className="text-body text-feedback-error"
        >
          {error}
        </Surface>
      )}

      {!loading && !error && metrics && (
        <>
          <section className="grid gap-4 sm:grid-cols-3">
            <Surface
              tone="secondary"
              border="subtle"
              elevation="soft"
              padding="lg"
              rounded="3xl"
              className="flex flex-col gap-2"
            >
              <Text variant="caption" tone="tertiary" transform="uppercase">
                Shop visit rate
              </Text>
              <Text variant="heading" weight="semibold">
                {renderSummaryValue(latestDay?.shopVisitRate ?? null)}
              </Text>
              <Text variant="caption" tone="secondary">
                Среднее: {renderSummaryValue(averages?.shopVisitRate ?? null)}
              </Text>
              <Text variant="caption" tone="tertiary">
                Показы: {renderCount(latestDay?.shopTabImpressions ?? 0)} · Просмотры:{' '}
                {renderCount(latestDay?.shopViews ?? 0)}
              </Text>
            </Surface>

            <Surface
              tone="secondary"
              border="subtle"
              elevation="soft"
              padding="lg"
              rounded="3xl"
              className="flex flex-col gap-2"
            >
              <Text variant="caption" tone="tertiary" transform="uppercase">
                Quest claim success
              </Text>
              <Text variant="heading" weight="semibold">
                {renderSummaryValue(latestDay?.questClaimSuccessRate ?? null)}
              </Text>
              <Text variant="caption" tone="secondary">
                Среднее: {renderSummaryValue(averages?.questClaimSuccessRate ?? null)}
              </Text>
              <Text variant="caption" tone="tertiary">
                Стартов: {renderCount(latestDay?.questClaimStarts ?? 0)} · Успех:{' '}
                {renderCount(latestDay?.questClaimSuccess ?? 0)}
              </Text>
            </Surface>

            <Surface
              tone="secondary"
              border="subtle"
              elevation="soft"
              padding="lg"
              rounded="3xl"
              className="flex flex-col gap-2"
            >
              <Text variant="caption" tone="tertiary" transform="uppercase">
                Upsell CTR
              </Text>
              <Text variant="heading" weight="semibold">
                {renderSummaryValue(latestDay?.dailyBoostUpsellCtr ?? null)}
              </Text>
              <Text variant="caption" tone="secondary">
                Среднее: {renderSummaryValue(averages?.upsellCtr ?? null)}
              </Text>
              <Text variant="caption" tone="tertiary">
                Просмотров: {renderCount(latestDay?.dailyBoostUpsellViews ?? 0)} · Кликов:{' '}
                {renderCount(latestDay?.dailyBoostUpsellClicks ?? 0)}
              </Text>
            </Surface>
          </section>

          <Surface
            tone="secondary"
            border="subtle"
            elevation="soft"
            padding="lg"
            rounded="3xl"
            className="flex flex-col gap-3"
          >
            <Text variant="title" weight="semibold">
              Динамика по дням
            </Text>
            <div className="overflow-x-auto">
              <table className="min-w-full text-caption text-left">
                <thead className="text-text-secondary uppercase tracking-[0.08em]">
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
                      className="odd:bg-layer-overlay-ghost-soft even:bg-transparent"
                    >
                      <td className="px-4 py-2 text-text-primary">{renderDate(day.date)}</td>
                      <td className="px-4 py-2 text-text-secondary">
                        {renderCount(day.shopViews)} / {renderCount(day.shopTabImpressions)}
                      </td>
                      <td className="px-4 py-2 text-text-primary">
                        {renderSummaryValue(day.shopVisitRate)}
                      </td>
                      <td className="px-4 py-2 text-text-secondary">
                        {renderCount(day.questClaimSuccess)} / {renderCount(day.questClaimStarts)}
                      </td>
                      <td className="px-4 py-2 text-text-primary">
                        {renderSummaryValue(day.questClaimSuccessRate)}
                      </td>
                      <td className="px-4 py-2 text-text-primary">
                        {renderSummaryValue(day.dailyBoostUpsellCtr)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Surface>
        </>
      )}

      <Surface
        tone="secondary"
        border="subtle"
        elevation="soft"
        padding="lg"
        rounded="3xl"
        className="flex flex-col gap-4"
      >
        <div className="flex flex-col gap-1">
          <Text variant="title" weight="semibold">
            Premium Shop preview
          </Text>
          <Text variant="caption" tone="tertiary">
            Отражает текущую витрину ShopPanel с тем же каталогом, что видят игроки.
          </Text>
        </div>

        <ShopPanel activeSection={adminShopSection} />
      </Surface>

      <Surface
        tone="secondary"
        border="subtle"
        elevation="soft"
        padding="lg"
        rounded="3xl"
        className="flex flex-col gap-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Text variant="title" weight="semibold">
            Seasonal rewards overview
          </Text>
          <Button variant="ghost" size="sm" onClick={handleRefreshSeason} disabled={seasonLoading}>
            🔄 Обновить сезон
          </Button>
        </div>

        {seasonLoading ? (
          <Text variant="body" tone="secondary">
            Загружаем данные сезона…
          </Text>
        ) : seasonError ? (
          <Text variant="body" tone="danger">
            {seasonError}
          </Text>
        ) : seasonSnapshot && seasonEntries.length > 0 ? (
          <SeasonRewardsAdminPanel
            seasonTitle={`${seasonSnapshot.name} · #${seasonSnapshot.seasonNumber}`}
            seasonId={seasonSnapshot.seasonId}
            endedAt={seasonSnapshot.endTime}
            snapshotPlayers={seasonEntries}
            isProcessing={isProcessingSeasonReward}
            onRewardPlayer={handleRewardSeasonPlayer}
            onExportSnapshot={handleExportSeasonSnapshot}
          />
        ) : (
          <Text variant="body" tone="secondary">
            Нет данных по завершённым сезонам — проверьте позже.
          </Text>
        )}
      </Surface>
    </TabPageSurface>
  );
};
