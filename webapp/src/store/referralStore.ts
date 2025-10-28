import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import {
  fetchReferralSummary,
  activateReferralCode,
  claimReferralMilestone,
  type ReferralSummary,
  type ReferralMilestoneView,
} from '@/services/referrals';
import { describeError } from './storeUtils';
import { logClientEvent } from '@/services/telemetry';
import { useGameStore } from './gameStore';

interface ReferralStoreState {
  referral: ReferralSummary | null;
  isLoading: boolean;
  isUpdating: boolean;
  error: string | null;
  lastLoadedAt: number | null;
  loadSummary: (force?: boolean) => Promise<void>;
  activateCode: (code: string) => Promise<void>;
  claimMilestone: (milestone: ReferralMilestoneView) => Promise<void>;
}

export const useReferralStore = create<ReferralStoreState>()(
  subscribeWithSelector((set, get) => ({
    referral: null,
    isLoading: false,
    isUpdating: false,
    error: null,
    lastLoadedAt: null,

    loadSummary: async (force = false) => {
      const state = get();
      if (
        state.isLoading ||
        (!force && state.lastLoadedAt && Date.now() - state.lastLoadedAt < 30_000)
      ) {
        return;
      }
      set({ isLoading: true, error: null });
      try {
        const summary = await fetchReferralSummary();
        set({
          referral: summary,
          isLoading: false,
          error: null,
          lastLoadedAt: Date.now(),
        });
        void logClientEvent('referral_summary_loaded', {
          total_activations: summary.totalActivations,
        });
      } catch (error) {
        const { message } = describeError(error, 'Не удалось загрузить реферальные данные');
        set({ error: message, isLoading: false });
        void logClientEvent('referral_summary_error', { message }, 'warn');
      }
    },

    activateCode: async (code: string) => {
      const trimmed = code.trim();
      if (!trimmed) {
        throw new Error('Введите код друга');
      }
      set({ isUpdating: true, error: null });
      try {
        const summary = await activateReferralCode(trimmed);
        set({
          referral: summary,
          isUpdating: false,
          error: null,
          lastLoadedAt: Date.now(),
        });
        void logClientEvent('referral_code_activated', {
          total_activations: summary.totalActivations,
        });
        await useGameStore.getState().refreshSession();
      } catch (error) {
        const { message, status } = describeError(error, 'Не удалось активировать код');
        set({ error: message, isUpdating: false });
        void logClientEvent('referral_code_activation_error', { message, status }, 'warn');
        throw new Error(message);
      }
    },

    claimMilestone: async (milestone: ReferralMilestoneView) => {
      set({ isUpdating: true, error: null });
      try {
        const summary = await claimReferralMilestone(milestone.id);
        set({
          referral: summary,
          isUpdating: false,
          error: null,
          lastLoadedAt: Date.now(),
        });
        void logClientEvent('referral_milestone_claim', {
          milestone_id: milestone.id,
          threshold: milestone.threshold,
        });
        await useGameStore.getState().refreshSession();
      } catch (error) {
        const { message, status } = describeError(error, 'Не удалось получить награду');
        set({ error: message, isUpdating: false });
        void logClientEvent(
          'referral_milestone_claim_error',
          { message, status, milestone_id: milestone.id },
          'warn'
        );
        throw new Error(message);
      }
    },
  }))
);
