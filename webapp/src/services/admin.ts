import { apiClient } from './apiClient';

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

export async function fetchMonetizationMetrics(days?: number): Promise<MonetizationMetrics> {
  const params = days ? { days } : undefined;
  const response = await apiClient.get<MonetizationMetrics>('/admin/monetization/metrics', {
    params,
  });
  return response.data;
}
