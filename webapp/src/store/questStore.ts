import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { apiClient } from '@/services/apiClient';
import { logClientEvent } from '@/services/telemetry';
import { describeError } from './storeUtils';
import { useGameStore } from './gameStore';

export type QuestType = 'daily' | 'weekly';

export interface QuestView {
  id: string;
  title: string;
  description?: string;
  type: QuestType;
  target: number;
  progress: number;
  baseline: number;
  expiresAt: string;
  status: 'active' | 'ready' | 'claimed';
  stars: number;
  energy: number;
  xp: number;
}

interface QuestStoreState {
  quests: QuestView[];
  isLoading: boolean;
  error: string | null;
  lastLoadedAt: number | null;
  loadQuests: () => Promise<void>;
  claimQuest: (questId: string) => Promise<void>;
}

export const useQuestStore = create<QuestStoreState>()(
  subscribeWithSelector((set, get) => ({
    quests: [],
    isLoading: false,
    error: null,
    lastLoadedAt: null,

    loadQuests: async () => {
      const state = get();
      if (state.isLoading) {
        return;
      }

      set({ isLoading: true, error: null });
      try {
        const response = await apiClient.get<{ quests: QuestView[] }>('/quests');
        const quests = response.data.quests ?? [];
        set({ quests, isLoading: false, error: null, lastLoadedAt: Date.now() });
      } catch (error) {
        const { message } = describeError(error, 'Не удалось загрузить задания');
        set({ error: message, isLoading: false });
        void logClientEvent('quests_load_error', { message }, 'warn');
      }
    },

    claimQuest: async (questId: string) => {
      try {
        const response = await apiClient.post<{ quest: QuestView }>(`/quests/${questId}/claim`);
        const updated = response.data.quest;
        set(state => ({
          quests: state.quests.map(quest => (quest.id === questId ? updated : quest)),
        }));
        void logClientEvent('quest_claim_success', { quest_id: questId });
        // Refresh session to pull updated stars/energy balances
        await useGameStore.getState().refreshSession();
      } catch (error) {
        const { message, status } = describeError(error, 'Не удалось получить награду');
        set(state => ({
          error: message,
          quests: state.quests,
        }));
        void logClientEvent('quest_claim_error', { quest_id: questId, status, message }, 'warn');
        throw error;
      }
    },
  }))
);
