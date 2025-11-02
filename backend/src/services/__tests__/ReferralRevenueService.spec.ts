import type { PoolClient } from 'pg';

const getReferralConfigMock = jest.fn();
const getRelationMock = jest.fn();
const adjustStarsBalanceMock = jest.fn();
const insertRevenueEventMock = jest.fn();
const upsertRevenueTotalMock = jest.fn();
const sumRevenueSinceMock = jest.fn();
const sumRevenueAllTimeMock = jest.fn();
const listRevenueTotalsMock = jest.fn();
const listRevenueEventsMock = jest.fn();
const logEventMock = jest.fn();
const invalidateProfileCacheMock = jest.fn();
const findUserByIdMock = jest.fn();
const recordStarsCreditMetricMock = jest.fn();
const recordReferralRevenueMetricMock = jest.fn();
const runQueryMock = jest.fn();

jest.mock('../ContentService', () => ({
  contentService: {
    getReferralConfig: (...args: unknown[]) => getReferralConfigMock(...args),
  },
}));

jest.mock('../../repositories/ReferralRepository', () => ({
  getReferralRelationByReferred: (...args: unknown[]) => getRelationMock(...args),
}));

jest.mock('../../repositories/ProgressRepository', () => ({
  adjustStarsBalance: (...args: unknown[]) => adjustStarsBalanceMock(...args),
}));

jest.mock('../../repositories/ReferralRevenueRepository', () => ({
  insertReferralRevenueEvent: (...args: unknown[]) => insertRevenueEventMock(...args),
  upsertReferralRevenueTotal: (...args: unknown[]) => upsertRevenueTotalMock(...args),
  sumReferralRevenueSince: (...args: unknown[]) => sumRevenueSinceMock(...args),
  sumReferralRevenueAllTime: (...args: unknown[]) => sumRevenueAllTimeMock(...args),
  listReferralRevenueTotals: (...args: unknown[]) => listRevenueTotalsMock(...args),
  listReferralRevenueEvents: (...args: unknown[]) => listRevenueEventsMock(...args),
}));

jest.mock('../../repositories/EventRepository', () => ({
  logEvent: (...args: unknown[]) => logEventMock(...args),
}));

jest.mock('../../repositories/UserRepository', () => ({
  findById: (...args: unknown[]) => findUserByIdMock(...args),
}));

jest.mock('../../cache/invalidation', () => ({
  invalidateProfileCache: (...args: unknown[]) => invalidateProfileCacheMock(...args),
}));

jest.mock('../../metrics/business', () => ({
  recordStarsCreditMetric: (...args: unknown[]) => recordStarsCreditMetricMock(...args),
  recordReferralRevenueMetric: (...args: unknown[]) => recordReferralRevenueMetricMock(...args),
}));

jest.mock('../../repositories/base', () => ({
  runQuery: (...args: unknown[]) => runQueryMock(...args),
}));

const { referralRevenueService } = require('../ReferralRevenueService');

const mockClient = {} as PoolClient;

describe('ReferralRevenueService', () => {
  beforeEach(() => {
    getReferralConfigMock.mockReset();
    getRelationMock.mockReset();
    adjustStarsBalanceMock.mockReset();
    insertRevenueEventMock.mockReset();
    upsertRevenueTotalMock.mockReset();
    sumRevenueSinceMock.mockReset();
    sumRevenueAllTimeMock.mockReset();
    listRevenueTotalsMock.mockReset();
    listRevenueEventsMock.mockReset();
    logEventMock.mockReset();
    invalidateProfileCacheMock.mockReset();
    findUserByIdMock.mockReset();
    recordStarsCreditMetricMock.mockReset();
    recordReferralRevenueMetricMock.mockReset();
    runQueryMock.mockReset();
  });

  describe('handlePurchaseReward', () => {
    it('skips when revenue share config is missing', async () => {
      getReferralConfigMock.mockReturnValueOnce({ revenueShare: null });

      await referralRevenueService.handlePurchaseReward({
        purchaserId: 'user-1',
        purchaseId: 'purchase-1',
        purchaseType: 'stars_pack',
        creditedStars: 1000,
        metadata: {},
        client: mockClient,
      });

      expect(getRelationMock).not.toHaveBeenCalled();
      expect(insertRevenueEventMock).not.toHaveBeenCalled();
    });

    it('creates revenue record and updates totals', async () => {
      getReferralConfigMock.mockReturnValue({
        revenueShare: { percentage: 0.01, dailyCap: 1000, monthlyCap: 5000 },
      });
      getRelationMock.mockResolvedValue({
        id: 'relation-1',
        referrerId: 'referrer-1',
      });
      sumRevenueSinceMock.mockResolvedValue(0);
      adjustStarsBalanceMock.mockResolvedValue(2000);
      findUserByIdMock.mockResolvedValue({
        username: 'friend',
        firstName: 'Друг',
      });
      insertRevenueEventMock.mockResolvedValue({
        id: 'event-1',
        referrerId: 'referrer-1',
        referredId: 'user-1',
        referralRelationId: 'relation-1',
        purchaseId: 'purchase-1',
        purchaseAmount: 1000,
        shareAmount: 10,
        source: 'stars_pack',
        metadata: {},
        referredUsername: 'friend',
        referredFirstName: 'Друг',
        grantedAt: new Date('2025-11-02T10:00:00Z'),
      });
      upsertRevenueTotalMock.mockResolvedValue({
        referralRelationId: 'relation-1',
        referrerId: 'referrer-1',
        referredId: 'user-1',
        totalShareAmount: 10,
        totalPurchaseAmount: 1000,
        lastPurchaseId: 'purchase-1',
        lastShareAmount: 10,
        lastPurchaseAmount: 1000,
        lastPurchaseAt: new Date('2025-11-02T10:00:00Z'),
        updatedAt: new Date('2025-11-02T10:00:00Z'),
      });

      await referralRevenueService.handlePurchaseReward({
        purchaserId: 'user-1',
        purchaseId: 'purchase-1',
        purchaseType: 'stars_pack',
        creditedStars: 1000,
        metadata: {},
        client: mockClient,
      });

      expect(adjustStarsBalanceMock).toHaveBeenCalledWith('referrer-1', 10, mockClient);
      expect(insertRevenueEventMock).toHaveBeenCalledWith(
        expect.objectContaining({
          shareAmount: 10,
          purchaseAmount: 1000,
          referrerId: 'referrer-1',
          referralRelationId: 'relation-1',
        }),
        mockClient
      );
      expect(upsertRevenueTotalMock).toHaveBeenCalledWith(
        expect.objectContaining({
          shareDelta: 10,
          purchaseAmount: 1000,
        }),
        mockClient
      );
      expect(logEventMock).toHaveBeenCalledTimes(2);
      expect(invalidateProfileCacheMock).toHaveBeenCalledWith('referrer-1');
      expect(recordStarsCreditMetricMock).toHaveBeenCalledWith('referral_revenue', 10);
      expect(recordReferralRevenueMetricMock).toHaveBeenCalledWith('stars_pack', 10);
    });

    it('obeys daily and monthly caps', async () => {
      getReferralConfigMock.mockReturnValue({
        revenueShare: { percentage: 0.05, dailyCap: 100, monthlyCap: 150 },
      });
      getRelationMock.mockResolvedValue({
        id: 'relation-2',
        referrerId: 'referrer-2',
      });
      // First call: daily usage already 90
      sumRevenueSinceMock
        .mockResolvedValueOnce(90) // daily
        .mockResolvedValueOnce(140); // monthly
      adjustStarsBalanceMock.mockResolvedValue(3000);
      findUserByIdMock.mockResolvedValue({
        username: 'friend-cap',
        firstName: 'Кап',
      });
      insertRevenueEventMock.mockResolvedValue({
        id: 'event-cap',
        referrerId: 'referrer-2',
        referredId: 'user-2',
        referralRelationId: 'relation-2',
        purchaseId: 'purchase-2',
        purchaseAmount: 1000,
        shareAmount: 10,
        source: 'stars_pack',
        metadata: {},
        referredUsername: 'friend-cap',
        referredFirstName: 'Кап',
        grantedAt: new Date('2025-11-02T09:00:00Z'),
      });
      upsertRevenueTotalMock.mockResolvedValue({
        referralRelationId: 'relation-2',
        referrerId: 'referrer-2',
        referredId: 'user-2',
        totalShareAmount: 200,
        totalPurchaseAmount: 4000,
        lastPurchaseId: 'purchase-2',
        lastShareAmount: 10,
        lastPurchaseAmount: 1000,
        lastPurchaseAt: new Date('2025-11-02T09:00:00Z'),
        updatedAt: new Date('2025-11-02T09:00:00Z'),
      });
      await referralRevenueService.handlePurchaseReward({
        purchaserId: 'user-2',
        purchaseId: 'purchase-2',
        purchaseType: 'stars_pack',
        creditedStars: 1000, // raw share = 50, but caps should reduce to 10 (daily remaining) then 10 (monthly remaining)
        metadata: {},
        client: mockClient,
      });

      expect(insertRevenueEventMock).toHaveBeenCalledWith(
        expect.objectContaining({ shareAmount: 10 }),
        mockClient
      );
    });
  });

  describe('getTotals', () => {
    it('returns aggregated totals with config', async () => {
      const now = new Date('2025-11-02T12:00:00Z');
      jest.useFakeTimers().setSystemTime(now);
      getReferralConfigMock.mockReturnValue({
        revenueShare: { percentage: 0.01, dailyCap: 500, monthlyCap: 2000 },
      });
      sumRevenueAllTimeMock.mockResolvedValue(1200);
      sumRevenueSinceMock
        .mockResolvedValueOnce(300) // monthly
        .mockResolvedValueOnce(40); // daily

      const totals = await referralRevenueService.getTotals('referrer-3', mockClient);

      expect(totals.revenueShare).toEqual({
        percentage: 0.01,
        dailyCap: 500,
        monthlyCap: 2000,
      });
      expect(totals.totals).toEqual({
        allTime: 1200,
        month: 300,
        today: 40,
      });
      expect(new Date(totals.updatedAt).toISOString()).toBe(now.toISOString());

      jest.useRealTimers();
    });
  });

  describe('getOverview', () => {
    it('enriches totals and events with user data', async () => {
      getReferralConfigMock.mockReturnValue({
        revenueShare: { percentage: 0.02 },
      });
      sumRevenueAllTimeMock.mockResolvedValue(500);
      sumRevenueSinceMock
        .mockResolvedValueOnce(120) // monthly
        .mockResolvedValueOnce(20); // daily

      listRevenueTotalsMock.mockResolvedValue([
        {
          referralRelationId: 'rel-1',
          referrerId: 'referrer-4',
          referredId: 'user-10',
          totalShareAmount: 300,
          totalPurchaseAmount: 6000,
          lastPurchaseId: 'purchase-10',
          lastShareAmount: 50,
          lastPurchaseAmount: 1000,
          lastPurchaseAt: new Date('2025-11-01T10:00:00Z'),
          updatedAt: new Date('2025-11-01T10:05:00Z'),
        },
      ]);

      listRevenueEventsMock.mockResolvedValue([
        {
          id: 'evt-1',
          referrerId: 'referrer-4',
          referredId: 'user-10',
          referralRelationId: 'rel-1',
          purchaseId: 'purchase-10',
          purchaseAmount: 1000,
          shareAmount: 50,
          source: 'stars_pack',
          metadata: {},
          referredUsername: 'friend10',
          referredFirstName: 'Юзер',
          grantedAt: new Date('2025-11-01T10:00:00Z'),
        },
      ]);

      runQueryMock.mockResolvedValue({
        rows: [
          { id: 'user-10', username: 'friend10', first_name: 'Юзер' },
        ],
      });

      const overview = await referralRevenueService.getOverview('referrer-4', mockClient);

      expect(overview.recent).toHaveLength(1);
      expect(overview.recent[0].referred.username).toBe('friend10');
      expect(overview.friends[0].totalShare).toBe(300);
    });
  });
});
