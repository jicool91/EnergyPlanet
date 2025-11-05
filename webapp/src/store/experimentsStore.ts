import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { logClientEvent } from '@/services/telemetry';

interface ExperimentState {
  variants: Record<string, string>;
  assignVariant: (experiment: string, variant: string) => void;
}

const storageKey = 'energy-experiments';

export const useExperimentsStore = create<ExperimentState>()(
  persist(
    set => ({
      variants: {},
      assignVariant: (experiment, variant) =>
        set(state => ({
          variants: {
            ...state.variants,
            [experiment]: variant,
          },
        })),
    }),
    {
      name: storageKey,
    }
  )
);

export function ensureExperimentVariant(experiment: string, assigner: () => string): string {
  const store = useExperimentsStore.getState();
  const existing = store.variants[experiment];
  if (existing) {
    return existing;
  }
  const variant = assigner();
  store.assignVariant(experiment, variant);
  void logClientEvent('experiment_assign', {
    experiment,
    variant,
  });
  return variant;
}

export function useExperimentVariant(experiment: string): string | undefined {
  return useExperimentsStore(state => state.variants[experiment]);
}
