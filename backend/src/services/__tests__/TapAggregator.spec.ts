import { RedisClientType } from 'redis';
import type { TapAggregator as TapAggregatorClass } from '../TapAggregator';

process.env.DATABASE_URL = process.env.DATABASE_URL ?? 'postgres://test:test@localhost:5432/energy_planet';
process.env.REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { TapAggregator } = require('../TapAggregator') as { TapAggregator: typeof TapAggregatorClass };

const mockProgress = {
  userId: 'user-1',
  level: 1,
  xp: 0,
  energy: 0,
  totalEnergyProduced: 0,
  tapLevel: 1,
  lastLogin: null,
  lastLogout: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

let currentState = {
  energy: 0,
  xp: 0,
  totalEnergyProduced: 0,
  level: 1,
};

const updateProgressSpy = jest.fn(async () => ({
  ...mockProgress,
  energy: currentState.energy,
  totalEnergyProduced: currentState.totalEnergyProduced,
  xp: currentState.xp,
  level: currentState.level,
}));

const logEventSpy = jest.fn();
const createTapEventSpy = jest.fn();

jest.mock('../../repositories/ProgressRepository', () => ({
  getProgress: jest.fn(async () => ({ ...mockProgress, ...currentState })),
  updateProgress: jest.fn(async (_userId: string, data: any) => {
    currentState = {
      energy: data.energy ?? currentState.energy,
      xp: data.xp ?? currentState.xp,
      totalEnergyProduced: data.totalEnergyProduced ?? currentState.totalEnergyProduced,
      level: data.level ?? currentState.level,
    };
    return updateProgressSpy();
  }),
}));

jest.mock('../../repositories/TapEventRepository', () => ({
  createTapEvent: jest.fn(async () => createTapEventSpy()),
}));

jest.mock('../../repositories/EventRepository', () => ({
  logEvent: jest.fn(async (_userId: string, type: string, payload: any) => {
    logEventSpy({ type, payload });
  }),
}));

jest.mock('../../db/connection', () => ({
  transaction: jest.fn(async (fn: any) => {
    const fakeClient = {};
    return fn(fakeClient);
  }),
}));

class InMemoryRedis {
  private hashes = new Map<string, Record<string, string>>();
  private sets = new Map<string, Set<string>>();
  private locks = new Map<string, number>();

  private ensureHash(key: string) {
    if (!this.hashes.has(key)) {
      this.hashes.set(key, {});
    }
    return this.hashes.get(key)!;
  }

  async hIncrBy(...args: any[]): Promise<number> {
    const key = args[0] as string;
    const field = args[1] as string;
    const value = Number(args[2] ?? 0);
    const hash = this.ensureHash(key);
    const current = Number(hash[field] ?? 0);
    const result = current + value;
    hash[field] = result.toString();
    return result;
  }

  async hIncrByFloat(...args: any[]): Promise<number> {
    return this.hIncrBy(args[0], args[1], args[2]);
  }

  async hSet(...args: any[]): Promise<number> {
    const key = args[0] as string;
    const hash = this.ensureHash(key);
    if (typeof args[1] === 'string') {
      const field = args[1] as string;
      const value = String(args[2] ?? '');
      hash[field] = value;
      return 1;
    }
    const values = args[1] as Record<string, string>;
    Object.assign(hash, values);
    return Object.keys(values).length;
  }

  async expire(..._args: any[]): Promise<number> {
    return 1;
  }

  async sAdd(key: string, member: string): Promise<number> {
    if (!this.sets.has(key)) {
      this.sets.set(key, new Set());
    }
    const set = this.sets.get(key)!;
    const before = set.size;
    set.add(member);
    return set.size - before;
  }

  async hmGet(key: string, fieldsOrField: any, ...rest: string[]): Promise<(string | null)[]> {
    const hash = this.hashes.get(key);
    const list = (Array.isArray(fieldsOrField) ? fieldsOrField : [fieldsOrField, ...rest])
      .filter(Boolean)
      .map(value => String(value));
    return list.map(field => (hash?.[field] ?? null));
  }

  async sMembers(key: string): Promise<string[]> {
    return Array.from(this.sets.get(key) ?? []);
  }

  async set(key: string, value: string, options?: { NX?: boolean; PX?: number }): Promise<string | null> {
    if (options?.NX) {
      if (this.locks.has(key)) {
        return null;
      }
      this.locks.set(key, Date.now() + (options.PX ?? 0));
      return 'OK';
    }
    this.locks.set(key, Number(value));
    return 'OK';
  }

  async del(key: string): Promise<number> {
    const removedHash = this.hashes.delete(key);
    const removedSet = this.sets.delete(key);
    const removedLock = this.locks.delete(key);
    return removedHash || removedSet || removedLock ? 1 : 0;
  }

  async hGetAll(key: string): Promise<Record<string, string>> {
    return { ...(this.hashes.get(key) ?? {}) };
  }

  async sRem(key: string, member: string): Promise<number> {
    const set = this.sets.get(key);
    if (!set) {
      return 0;
    }
    const existed = set.delete(member);
    return existed ? 1 : 0;
  }

  multi() {
    const commands: Array<() => Promise<unknown>> = [];

    const chain: any = {
      hIncrBy: (key: string, field: string, value: number) => {
        commands.push(() => this.hIncrBy(key, field, value));
        return chain;
      },
      hIncrByFloat: (key: string, field: string, value: number) => {
        commands.push(() => this.hIncrByFloat(key, field, value));
        return chain;
      },
      hSet: (key: string, field: string, value: string) => {
        commands.push(() => this.hSet(key, { [field]: value }));
        return chain;
      },
      expire: (key: string, ttl: number) => {
        commands.push(() => this.expire(key, ttl));
        return chain;
      },
      sAdd: (key: string, member: string) => {
        commands.push(() => this.sAdd(key, member));
        return chain;
      },
      hGetAll: (key: string) => {
        commands.push(() => this.hGetAll(key));
        return chain;
      },
      del: (key: string) => {
        commands.push(() => this.del(key));
        return chain;
      },
      sRem: (key: string, member: string) => {
        commands.push(() => this.sRem(key, member));
        return chain;
      },
      exec: async () => {
        const results: unknown[] = [];
        for (const command of commands) {
          results.push(await command());
        }
        return results;
      },
    };

    return chain;
  }

  // Unused interface stubs
  publish = jest.fn();
  subscribe = jest.fn();
  unsubscribe = jest.fn();
  on = jest.fn();
  once = jest.fn();
  off = jest.fn();
  ping = jest.fn(async () => 'PONG');
  commandOptions = jest.fn(() => this);
  duplicate = jest.fn(() => this as unknown as RedisClientType);
  connect = jest.fn(async () => {});
  quit = jest.fn(async () => {});
  disconnect = jest.fn(async () => {});
  sendCommand = jest.fn(async () => null);
}

describe('TapAggregator', () => {
  let redis: InMemoryRedis;
  let aggregator: TapAggregatorClass;

  beforeEach(() => {
    redis = new InMemoryRedis();
    currentState = { energy: 0, xp: 0, totalEnergyProduced: 0, level: 1 };
    updateProgressSpy.mockClear();
    logEventSpy.mockClear();
    createTapEventSpy.mockClear();
    aggregator = new TapAggregator({ flushThreshold: 100 }, () => redis as unknown as RedisClientType);
  });

  it('buffers taps and flushes when threshold exceeded', async () => {
    await aggregator.bufferTap('user-1', { taps: 30, energy: 300, baseEnergy: 300, xp: 30 });
    await aggregator.bufferTap('user-1', { taps: 25, energy: 250, baseEnergy: 250, xp: 25 });

    const pending = await aggregator.getPendingTotals('user-1');
    expect(pending.taps).toBe(55);
    expect(pending.energy).toBe(550);
    expect(pending.baseEnergy).toBe(550);

    const flushed = await aggregator.flushUser('user-1');
    expect(flushed).toBe(true);

    expect(updateProgressSpy).toHaveBeenCalled();
    expect(createTapEventSpy).toHaveBeenCalled();
    expect(logEventSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'tap_batch_processed',
        payload: expect.objectContaining({
          taps: 55,
          energy_delta: 550,
          base_energy: 550,
          effective_multiplier: 1,
        }),
      })
    );
    expect(currentState.energy).toBe(550);
    expect(currentState.totalEnergyProduced).toBe(550);
  });
});
