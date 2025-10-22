import { PurchaseRecord } from '../../repositories/PurchaseRepository';

const findByPurchaseIdMock = jest.fn();
const createPurchaseMock = jest.fn();
const updatePurchaseStatusMock = jest.fn();
const logEventMock = jest.fn();
const transactionMock = jest.fn(async (handler: (client: unknown) => Promise<unknown>) => handler({}));

jest.mock('../../config', () => ({
  config: {
    testing: { mockPayments: true, testMode: false, bypassAuth: false },
    monetization: { starsEnabled: true },
  },
}));

jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('../../repositories/PurchaseRepository', () => ({
  findByPurchaseId: jest.fn(async (...args) => findByPurchaseIdMock(...args)),
  createPurchase: jest.fn(async (...args) => createPurchaseMock(...args)),
  updatePurchaseStatus: jest.fn(async (...args) => updatePurchaseStatusMock(...args)),
}));

jest.mock('../../repositories/EventRepository', () => ({
  logEvent: jest.fn(async (...args) => logEventMock(...args)),
}));

jest.mock('../../db/connection', () => ({
  transaction: jest.fn(async (fn: (client: unknown) => Promise<unknown>) => transactionMock(fn)),
}));

const { purchaseService } = require('../PurchaseService');
const { logger } = require('../../utils/logger');

describe('PurchaseService', () => {
  beforeEach(() => {
    findByPurchaseIdMock.mockReset();
    createPurchaseMock.mockReset();
    updatePurchaseStatusMock.mockReset();
    logEventMock.mockReset();
    transactionMock.mockClear();
    logger.info.mockClear();
    logger.warn.mockClear();
  });

  const baseRecord: PurchaseRecord = {
    id: 'db-id',
    purchaseId: 'purchase-1',
    userId: 'user-1',
    purchaseType: 'cosmetic',
    itemId: 'item-1',
    priceStars: 10,
    telegramPaymentId: null,
    adToken: null,
    status: 'pending',
    createdAt: new Date('2025-10-20T00:00:00Z'),
  };

  it('creates a new succeeded purchase when none exists', async () => {
    findByPurchaseIdMock.mockResolvedValueOnce(null);
    createPurchaseMock.mockResolvedValueOnce({ ...baseRecord, status: 'succeeded' });

    const result = await purchaseService.recordMockPurchase('user-1', {
      purchaseId: 'purchase-1',
      itemId: 'item-1',
      priceStars: 10,
      purchaseType: 'cosmetic',
      metadata: { origin: 'test' },
    });

    expect(createPurchaseMock).toHaveBeenCalledWith(
      'purchase-1',
      'user-1',
      'cosmetic',
      'item-1',
      10,
      'succeeded',
      expect.objectContaining({ client: {} })
    );
    expect(result.status).toBe('succeeded');
    expect(logEventMock).toHaveBeenCalledWith(
      'user-1',
      'purchase_succeeded',
      expect.objectContaining({ purchase_id: 'purchase-1', previous_status: null }),
      expect.objectContaining({ client: {} })
    );
  });

  it('updates a pending purchase to succeeded', async () => {
    findByPurchaseIdMock.mockResolvedValueOnce(baseRecord);
    updatePurchaseStatusMock.mockResolvedValueOnce({ ...baseRecord, status: 'succeeded' });

    const result = await purchaseService.recordMockPurchase('user-1', {
      purchaseId: 'purchase-1',
      itemId: 'item-1',
      priceStars: 10,
      purchaseType: 'cosmetic',
      metadata: {},
    });

    expect(updatePurchaseStatusMock).toHaveBeenCalledWith('purchase-1', 'succeeded', {});
    expect(result.status).toBe('succeeded');
    expect(logEventMock).toHaveBeenCalledWith(
      'user-1',
      'purchase_succeeded',
      expect.objectContaining({ previous_status: 'pending' }),
      expect.objectContaining({ client: {} })
    );
  });

  it('returns existing succeeded purchase without updating', async () => {
    findByPurchaseIdMock.mockResolvedValueOnce({ ...baseRecord, status: 'succeeded' });

    const result = await purchaseService.recordMockPurchase('user-1', {
      purchaseId: 'purchase-1',
      itemId: 'item-1',
      priceStars: 10,
      purchaseType: 'cosmetic',
      metadata: {},
    });

    expect(updatePurchaseStatusMock).not.toHaveBeenCalled();
    expect(result.status).toBe('succeeded');
    expect(logger.info).toHaveBeenCalledWith(
      'purchase_succeeded_idempotent',
      expect.objectContaining({ purchase_id: 'purchase-1' })
    );
  });

  it('throws on user mismatch for existing purchase', async () => {
    findByPurchaseIdMock.mockResolvedValueOnce({ ...baseRecord, userId: 'other-user' });

    await expect(
      purchaseService.recordMockPurchase('user-1', {
        purchaseId: 'purchase-1',
        itemId: 'item-1',
        priceStars: 10,
        purchaseType: 'cosmetic',
        metadata: {},
      })
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it('marks an existing purchase as failed and logs event', async () => {
    findByPurchaseIdMock.mockResolvedValueOnce(baseRecord);
    updatePurchaseStatusMock.mockResolvedValueOnce({ ...baseRecord, status: 'failed' });

    const result = await purchaseService.markFailed('purchase-1');

    expect(findByPurchaseIdMock).toHaveBeenCalledWith('purchase-1', {});
    expect(updatePurchaseStatusMock).toHaveBeenCalledWith('purchase-1', 'failed', {});
    expect(result.status).toBe('failed');
    expect(logEventMock).toHaveBeenCalledWith(
      'user-1',
      'purchase_failed',
      expect.objectContaining({ previous_status: 'pending' }),
      expect.objectContaining({ client: {} })
    );
    expect(logger.warn).toHaveBeenCalledWith(
      'purchase_failed',
      expect.objectContaining({ purchase_id: 'purchase-1' })
    );
  });
});
