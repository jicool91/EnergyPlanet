import { runQuery } from '../repositories/base';

export interface MonetizationMetricDay {
  date: string;
  shopTabImpressions: number;
  shopViews: number;
  shopVisitRate: number | null;
  questClaimStarts: number;
  questClaimSuccess: number;
  questClaimSuccessRate: number | null;
  dailyBoostUpsellViews: number;
  dailyBoostUpsellClicks: number;
  dailyBoostUpsellCtr: number | null;
}

export interface MonetizationMetrics {
  generatedAt: string;
  windowStart: string;
  windowEnd: string;
  days: number;
  daily: MonetizationMetricDay[];
}

const MAX_DAYS = 60;
const DEFAULT_DAYS = 14;

interface DailyMetricsRow {
  day: string;
  shop_tab_impressions: string;
  shop_views: string;
  quest_claim_start: string;
  quest_claim_success: string;
  upsell_views: string;
  upsell_clicks: string;
}

export class MonetizationAnalyticsService {
  async getDailyMetrics(daysParam?: number): Promise<MonetizationMetrics> {
    const days = this.normalizeDays(daysParam);

    const windowEnd = new Date();
    const windowStart = new Date(windowEnd);
    windowStart.setUTCDate(windowEnd.getUTCDate() - (days - 1));
    windowStart.setUTCHours(0, 0, 0, 0);

    const metrics = await runQuery<DailyMetricsRow>(
      `
        WITH filtered_events AS (
          SELECT
            date_trunc('day', created_at AT TIME ZONE 'UTC')::date AS day,
            event_type,
            event_data
          FROM events
          WHERE created_at >= $1
            AND created_at < $2
        )
        SELECT
          day,
          COUNT(*) FILTER (
            WHERE event_type = 'tab_impression'
              AND COALESCE(event_data ->> 'tab', '') = 'shop'
          ) AS shop_tab_impressions,
          COUNT(*) FILTER (WHERE event_type = 'shop_view') AS shop_views,
          COUNT(*) FILTER (WHERE event_type = 'quest_claim_start') AS quest_claim_start,
          COUNT(*) FILTER (WHERE event_type = 'quest_claim_success') AS quest_claim_success,
          COUNT(*) FILTER (WHERE event_type = 'daily_boost_upsell_view') AS upsell_views,
          COUNT(*) FILTER (WHERE event_type = 'daily_boost_upsell_click') AS upsell_clicks
        FROM filtered_events
        GROUP BY day
        ORDER BY day ASC
      `,
      [windowStart.toISOString(), windowEnd.toISOString()]
    );

    const series = this.buildSeries(windowStart, windowEnd, metrics.rows);

    return {
      generatedAt: new Date().toISOString(),
      windowStart: windowStart.toISOString(),
      windowEnd: windowEnd.toISOString(),
      days,
      daily: series,
    };
  }

  private normalizeDays(days?: number): number {
    if (!days || Number.isNaN(days) || !Number.isFinite(days)) {
      return DEFAULT_DAYS;
    }
    const normalized = Math.floor(days);
    return Math.min(Math.max(normalized, 1), MAX_DAYS);
  }

  private buildSeries(
    windowStart: Date,
    windowEnd: Date,
    rows: DailyMetricsRow[]
  ): MonetizationMetricDay[] {
    const byDay = new Map<string, DailyMetricsRow>();
    for (const row of rows) {
      byDay.set(row.day, row);
    }

    const series: MonetizationMetricDay[] = [];

    const cursor = new Date(windowStart);
    while (cursor <= windowEnd) {
      const dateKey = cursor.toISOString().slice(0, 10);
      const row = byDay.get(dateKey);
      const shopTabImpressions = row ? this.toCount(row.shop_tab_impressions) : 0;
      const shopViews = row ? this.toCount(row.shop_views) : 0;
      const questClaimStart = row ? this.toCount(row.quest_claim_start) : 0;
      const questClaimSuccess = row ? this.toCount(row.quest_claim_success) : 0;
      const upsellViews = row ? this.toCount(row.upsell_views) : 0;
      const upsellClicks = row ? this.toCount(row.upsell_clicks) : 0;

      const shopVisitRate =
        shopTabImpressions > 0 ? shopViews / shopTabImpressions : null;
      const questClaimSuccessRate =
        questClaimStart > 0 ? questClaimSuccess / questClaimStart : null;
      const dailyBoostUpsellCtr =
        upsellViews > 0 ? upsellClicks / upsellViews : null;

      series.push({
        date: dateKey,
        shopTabImpressions,
        shopViews,
        shopVisitRate,
        questClaimStarts: questClaimStart,
        questClaimSuccess,
        questClaimSuccessRate,
        dailyBoostUpsellViews: upsellViews,
        dailyBoostUpsellClicks: upsellClicks,
        dailyBoostUpsellCtr,
      });

      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }

    return series;
  }

  private toCount(value?: string | null): number {
    if (!value) {
      return 0;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
}

export const monetizationAnalyticsService = new MonetizationAnalyticsService();
