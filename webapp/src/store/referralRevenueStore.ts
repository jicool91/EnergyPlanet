import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { describeError } from './storeUtils';
import { fetchReferralRevenueOverview, type ReferralRevenueOverview } from '@/services/referrals';
import { logClientEvent } from '@/services/telemetry';

interface ReferralRevenueState {
  overview: ReferralRevenueOverview | null;
  isLoading: boolean;
  error: string | null;
  lastLoadedAt: number | null;
  loadOverview: (force?: boolean) => Promise<void>;
  setOverview: (overview: ReferralRevenueOverview | null) => void;
}

export const useReferralRevenueStore = create<ReferralRevenueState>()(
  subscribeWithSelector((set, get) => ({
    overview: null,
    isLoading: false,
    error: null,
    lastLoadedAt: null,
    async loadOverview(force = false) {
      const state = get();
      if (state.isLoading) {
        return;
      }
      if (!force && state.lastLoadedAt && Date.now() - state.lastLoadedAt < 30_000) {
        return;
      }

      set({ isLoading: true, error: null });
      try {
        const overview = await fetchReferralRevenueOverview();
        set({
          overview,
          isLoading: false,
          lastLoadedAt: Date.now(),
        });
        void logClientEvent('referral_revenue_loaded', {
          total_earned: overview.totals.allTime,
        });
      } catch (error) {
        const { message } = describeError(error, 'Не удалось загрузить реферальный доход');
        set({
          error: message,
          isLoading: false,
        });
        void logClientEvent('referral_revenue_error', { message }, 'warn');
      }
    },
    setOverview(overview) {
      set({ overview });
    },
  }))
);
