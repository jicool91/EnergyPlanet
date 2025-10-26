import client from 'prom-client';
import { register, metricsEnabled } from './index';

const noop = () => {};

const tickSuccessCounter = metricsEnabled
  ? new client.Counter({
      name: 'energyplanet_tick_success_total',
      help: 'Total number of successful tick executions',
      registers: [register],
    })
  : null;

const tickUnauthorizedCounter = metricsEnabled
  ? new client.Counter({
      name: 'energyplanet_tick_unauthorized_total',
      help: 'Total number of unauthorized tick attempts',
      labelNames: ['reason'] as const,
      registers: [register],
    })
  : null;

const tickErrorCounter = metricsEnabled
  ? new client.Counter({
      name: 'energyplanet_tick_error_total',
      help: 'Total number of tick errors',
      labelNames: ['reason'] as const,
      registers: [register],
    })
  : null;

const tickLatencyHistogram = metricsEnabled
  ? new client.Histogram({
      name: 'energyplanet_tick_latency_seconds',
      help: 'Server-side latency for processing ticks',
      buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10],
      registers: [register],
    })
  : null;

const tickAccountedSecondsHistogram = metricsEnabled
  ? new client.Histogram({
      name: 'energyplanet_tick_accounted_seconds',
      help: 'Number of seconds processed during ticks',
      buckets: [0, 1, 5, 15, 30, 60, 120, 300, 600, 1800, 3600],
      registers: [register],
    })
  : null;

const tickCarryOverHistogram = metricsEnabled
  ? new client.Histogram({
      name: 'energyplanet_tick_carryover_seconds',
      help: 'Carry-over passive seconds remaining after tick',
      buckets: [0, 1, 5, 15, 30, 60, 120, 300, 600, 1800, 3600],
      registers: [register],
    })
  : null;

const tickEnergyHistogram = metricsEnabled
  ? new client.Histogram({
      name: 'energyplanet_tick_energy_gained',
      help: 'Energy gained per tick',
      buckets: [0, 5, 10, 25, 50, 100, 250, 500, 1000, 2500],
      registers: [register],
    })
  : null;

export const startTickLatencyTimer = metricsEnabled
  ? () => (tickLatencyHistogram?.startTimer() ?? noop)
  : () => noop;

export function recordTickSuccess({
  accountedSeconds,
  carriedSeconds,
  energyGained,
}: {
  accountedSeconds: number;
  carriedSeconds: number;
  energyGained: number;
}) {
  if (!metricsEnabled) {
    return;
  }
  tickSuccessCounter?.inc();
  if (tickAccountedSecondsHistogram) {
    tickAccountedSecondsHistogram.observe(accountedSeconds);
  }
  if (tickCarryOverHistogram) {
    tickCarryOverHistogram.observe(carriedSeconds);
  }
  if (tickEnergyHistogram) {
    tickEnergyHistogram.observe(energyGained);
  }
}

export function recordTickUnauthorized(reason: string) {
  if (!metricsEnabled) {
    return;
  }
  tickUnauthorizedCounter?.inc({ reason });
}

export function recordTickError(reason: string) {
  if (!metricsEnabled) {
    return;
  }
  tickErrorCounter?.inc({ reason });
}
