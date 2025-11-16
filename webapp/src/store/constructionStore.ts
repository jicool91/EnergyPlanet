import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { logger } from '@/utils/logger';
import {
  fetchConstructionSnapshot,
  startConstructionJob,
  completeConstructionJob,
  purchaseBuilder,
} from '@/services/construction';
import type { ConstructionSnapshotResponse } from '@/services/construction';

export interface BuilderSlotState {
  slotIndex: number;
  status: 'active' | 'inactive' | 'expired';
  speedMultiplier: number;
  expiresAt: string | null;
}

export interface ConstructionJobView {
  id: string;
  buildingId: string;
  action: 'build' | 'upgrade';
  builderSlot: number;
  completesAt: string;
  durationSeconds: number;
  status: 'queued' | 'running' | 'completed';
  xpReward: number;
}

interface ConstructionState {
  builders: BuilderSlotState[];
  activeJobs: ConstructionJobView[];
  queuedJobs: ConstructionJobView[];
  hydrate: (payload: Partial<ConstructionState>) => void;
  startJob: (job: ConstructionJobView) => void;
  markComplete: (jobId: string) => void;
  fetchLatest: () => Promise<void>;
  startJobRequest: (params: {
    buildingId: string;
    action?: 'build' | 'upgrade';
    quantity?: number;
  }) => Promise<void>;
  completeJobRequest: (jobId: string) => Promise<void>;
  purchaseBuilderSlot: (slotIndex: number, options?: { costStars?: number }) => Promise<void>;
}

function mapJob(job: ConstructionSnapshotResponse['jobs']['active'][number]): ConstructionJobView {
  return {
    id: job.id,
    buildingId: job.building_id,
    action: job.action,
    builderSlot: job.builder_slot,
    completesAt: job.completes_at,
    durationSeconds: job.duration_seconds,
    status: job.status,
    xpReward: job.xp_reward,
  };
}

function mapBuilder(builder: ConstructionSnapshotResponse['builders'][number]): BuilderSlotState {
  return {
    slotIndex: builder.slot_index,
    status: builder.status,
    speedMultiplier: builder.speed_multiplier,
    expiresAt: builder.expires_at,
  };
}

export const useConstructionStore = create<ConstructionState>()(
  persist(
    (set, get) => ({
      builders: [],
      activeJobs: [],
      queuedJobs: [],
      hydrate: payload =>
        set(state => ({
          builders: payload.builders ?? state.builders,
          activeJobs: payload.activeJobs ?? state.activeJobs,
          queuedJobs: payload.queuedJobs ?? state.queuedJobs,
        })),
      startJob: job =>
        set(state => ({
          activeJobs: [...state.activeJobs.filter(item => item.id !== job.id), job],
          queuedJobs: state.queuedJobs.filter(item => item.id !== job.id),
        })),
      markComplete: jobId =>
        set(state => ({
          activeJobs: state.activeJobs.filter(job => job.id !== jobId),
        })),
      fetchLatest: async () => {
        try {
          const snapshot = await fetchConstructionSnapshot();
          set({
            builders: snapshot.builders.map(mapBuilder),
            activeJobs: (snapshot.jobs.active ?? []).map(mapJob),
            queuedJobs: (snapshot.jobs.queued ?? []).map(mapJob),
          });
        } catch (error) {
          logger.warn('Failed to fetch construction snapshot', {
            error: error instanceof Error ? error.message : 'unknown',
          });
        }
      },
      startJobRequest: async params => {
        try {
          const job = await startConstructionJob(params);
          set(state => ({
            activeJobs:
              job.status === 'running' ? [...state.activeJobs, mapJob(job)] : state.activeJobs,
            queuedJobs:
              job.status === 'queued' ? [...state.queuedJobs, mapJob(job)] : state.queuedJobs,
          }));
        } catch (error) {
          logger.error('Failed to start construction job', {
            error: error instanceof Error ? error.message : 'unknown',
          });
          throw error;
        }
      },
      completeJobRequest: async jobId => {
        try {
          await completeConstructionJob(jobId);
          set(state => ({
            activeJobs: state.activeJobs.filter(job => job.id !== jobId),
          }));
        } catch (error) {
          logger.error('Failed to complete construction job', {
            error: error instanceof Error ? error.message : 'unknown',
          });
          throw error;
        }
      },
      purchaseBuilderSlot: async (slotIndex, options) => {
        try {
          const builder = await purchaseBuilder(slotIndex, options);
          set(state => ({
            builders: state.builders.some(b => b.slotIndex === builder.slot_index)
              ? state.builders.map(b =>
                  b.slotIndex === builder.slot_index ? mapBuilder(builder) : b
                )
              : [...state.builders, mapBuilder(builder)],
          }));
        } catch (error) {
          logger.error('Failed to purchase builder', {
            error: error instanceof Error ? error.message : 'unknown',
          });
          throw error;
        }
      },
    }),
    {
      name: 'construction-store',
      partialize: state => ({ builders: state.builders }),
    }
  )
);
