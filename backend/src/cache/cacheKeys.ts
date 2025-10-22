import config from '../config';

const prefix = `energyplanet:${config.server.env}`;

export const cacheKeys = {
  leaderboardTop: (limit: number) => `${prefix}:leaderboard:top:${limit}`,
  profile: (userId: string) => `${prefix}:profile:${userId}`,
};

export function namespacedKey(namespace: string, ...parts: Array<string | number | boolean>) {
  const serialized = parts
    .map(part => (typeof part === 'boolean' ? (part ? '1' : '0') : String(part)))
    .join(':');
  return `${prefix}:${namespace}:${serialized}`;
}
