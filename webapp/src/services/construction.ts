import { apiClient } from './apiClient';

export interface ConstructionJobPayload {
  id: string;
  building_id: string;
  action: 'build' | 'upgrade';
  builder_slot: number;
  completes_at: string;
  duration_seconds: number;
  status: 'queued' | 'running';
  xp_reward: number;
  quantity: number;
}

export interface BuilderSlotPayload {
  slot_index: number;
  status: 'active' | 'inactive' | 'expired';
  speed_multiplier: number;
  expires_at: string | null;
}

export interface ConstructionSnapshotResponse {
  builders: BuilderSlotPayload[];
  jobs: {
    active: ConstructionJobPayload[];
    queued: ConstructionJobPayload[];
  };
}

export async function fetchConstructionSnapshot(): Promise<ConstructionSnapshotResponse> {
  const response = await apiClient.get('/construction');
  return response.data;
}

export async function startConstructionJob(params: {
  buildingId: string;
  action?: 'build' | 'upgrade';
  quantity?: number;
}) {
  const response = await apiClient.post('/construction', {
    building_id: params.buildingId,
    action: params.action ?? 'build',
    quantity: params.quantity ?? 1,
  });
  return response.data;
}

export async function completeConstructionJob(jobId: string) {
  const response = await apiClient.post(`/construction/${jobId}/complete`);
  return response.data;
}

export async function purchaseBuilder(slotIndex: number, options?: { costStars?: number }) {
  const response = await apiClient.post('/builders/activate', {
    slot_index: slotIndex,
    cost_stars: options?.costStars,
  });
  return response.data;
}
