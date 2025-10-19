import request from 'supertest';
import app from '../index';

jest.mock('../middleware/auth', () => ({
  authenticate: (req: any, _res: any, next: any) => {
    req.user = {
      id: 'test-user-id',
      telegramId: 123456,
      username: 'test_user',
      isAdmin: false,
    };
    next();
  },
  requireAdmin: (_req: any, _res: any, next: any) => next(),
}));

const mockCosmetics = [
  {
    id: 'default_frame',
    name: 'Default Frame',
    description: 'Free frame',
    category: 'avatar_frame',
    rarity: 'common',
    unlock_type: 'free',
    unlock_requirement: {},
    asset_url: 'https://cdn.energyplanet.game/cosmetics/frames/default.png',
    preview_url: 'https://cdn.energyplanet.game/cosmetics/frames/default_preview.png',
    owned: true,
    equipped: true,
    status: 'owned',
    price_stars: null,
  },
];

const mockBoost = {
  id: 'boost-id',
  boost_type: 'daily_boost',
  multiplier: 3,
  expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
};

const mockPurchase = {
  purchase_id: 'purchase-123',
  status: 'completed',
  item_id: 'stars_pack_small',
  price_stars: 100,
  purchase_type: 'stars_pack',
  created_at: new Date().toISOString(),
};

jest.mock('../services/CosmeticService', () => ({
  cosmeticService: {
    listCosmetics: jest.fn(async () => mockCosmetics),
    purchaseCosmetic: jest.fn(async () => undefined),
    equipCosmetic: jest.fn(async () => undefined),
  },
}));

jest.mock('../services/BoostService', () => ({
  boostService: {
    claimBoost: jest.fn(async () => ({
      id: mockBoost.id,
      boostType: mockBoost.boost_type,
      multiplier: mockBoost.multiplier,
      expiresAt: new Date(mockBoost.expires_at),
      createdAt: new Date(),
      userId: 'test-user-id',
    })),
  },
}));

jest.mock('../services/PurchaseService', () => ({
  purchaseService: {
    recordMockPurchase: jest.fn(async () => ({
      id: 'db-id',
      purchaseId: mockPurchase.purchase_id,
      userId: 'test-user-id',
      purchaseType: mockPurchase.purchase_type,
      itemId: mockPurchase.item_id,
      priceStars: mockPurchase.price_stars,
      status: mockPurchase.status,
      createdAt: new Date(mockPurchase.created_at),
      telegramPaymentId: null,
      adToken: null,
    })),
    markFailed: jest.fn(),
  },
}));

describe('Monetization routes', () => {
  it('GET /api/v1/cosmetics returns cosmetics with ownership flags', async () => {
    const response = await request(app).get('/api/v1/cosmetics');

    expect(response.status).toBe(200);
    expect(response.body.cosmetics).toEqual(mockCosmetics);
  });

  it('POST /api/v1/cosmetics/purchase triggers purchase flow', async () => {
    const payload = { cosmetic_id: 'golden_frame_001' };
    const response = await request(app)
      .post('/api/v1/cosmetics/purchase')
      .send(payload);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    const { cosmeticService } = require('../services/CosmeticService');
    expect(cosmeticService.purchaseCosmetic).toHaveBeenCalledWith(
      'test-user-id',
      payload.cosmetic_id
    );
  });

  it('POST /api/v1/cosmetics/equip equips cosmetic', async () => {
    const payload = { cosmetic_id: 'default_frame' };
    const response = await request(app)
      .post('/api/v1/cosmetics/equip')
      .send(payload);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    const { cosmeticService } = require('../services/CosmeticService');
    expect(cosmeticService.equipCosmetic).toHaveBeenCalledWith(
      'test-user-id',
      payload.cosmetic_id
    );
  });

  it('POST /api/v1/boost/claim returns claimed boost payload', async () => {
    const response = await request(app)
      .post('/api/v1/boost/claim')
      .send({ boost_type: 'daily_boost' });

    expect(response.status).toBe(200);
    expect(response.body.boost).toMatchObject(mockBoost);
    const { boostService } = require('../services/BoostService');
    expect(boostService.claimBoost).toHaveBeenCalledWith('test-user-id', 'daily_boost');
  });

  it('POST /api/v1/purchase records mock purchase', async () => {
    const response = await request(app)
      .post('/api/v1/purchase')
      .send({
        purchase_id: mockPurchase.purchase_id,
        item_id: mockPurchase.item_id,
        price_stars: mockPurchase.price_stars,
        purchase_type: mockPurchase.purchase_type,
        metadata: { source: 'test' },
      });

    expect(response.status).toBe(200);
    expect(response.body.purchase).toMatchObject(mockPurchase);
    const { purchaseService } = require('../services/PurchaseService');
    expect(purchaseService.recordMockPurchase).toHaveBeenCalledWith('test-user-id', {
      purchaseId: mockPurchase.purchase_id,
      itemId: mockPurchase.item_id,
      priceStars: mockPurchase.price_stars,
      purchaseType: mockPurchase.purchase_type,
      metadata: { source: 'test' },
    });
  });
});
