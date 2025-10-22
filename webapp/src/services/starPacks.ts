import { apiClient } from './apiClient';

export interface StarPack {
  id: string;
  title: string;
  description?: string;
  stars: number;
  bonus_stars?: number;
  price_usd?: number;
  price_rub?: number;
  telegram_product_id?: string;
  icon_url?: string;
  featured?: boolean;
}

export async function fetchStarPacks(): Promise<StarPack[]> {
  const response = await apiClient.get<{ packs: StarPack[] }>('/purchase/packs');
  return response.data.packs ?? [];
}
