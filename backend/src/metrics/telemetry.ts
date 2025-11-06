import client from 'prom-client';
import { metricsEnabled, register } from './index';

type ColorScheme = 'light' | 'dark' | 'unknown';
type DeviceClass = 'desktop' | 'tablet' | 'mobile' | 'unknown';

const renderLatencyHistogram = metricsEnabled
  ? new client.Histogram({
      name: 'energyplanet_render_latency_ms',
      help: 'Client-reported render latency',
      buckets: [50, 100, 200, 400, 800, 1500, 2500, 5000, 7500, 10_000],
      labelNames: ['screen', 'theme', 'device_class'] as const,
      registers: [register],
    })
  : null;

const tapSuccessCounter = metricsEnabled
  ? new client.Counter({
      name: 'energyplanet_client_tap_success_total',
      help: 'Count of tap success events reported by clients',
      labelNames: ['batch_bucket', 'level_up'] as const,
      registers: [register],
    })
  : null;

const tapSuccessEnergyCounter = metricsEnabled
  ? new client.Counter({
      name: 'energyplanet_client_tap_success_energy_total',
      help: 'Energy gained within tap success telemetry',
      labelNames: ['batch_bucket', 'level_up'] as const,
      registers: [register],
    })
  : null;

const tapSuccessXpCounter = metricsEnabled
  ? new client.Counter({
      name: 'energyplanet_client_tap_success_xp_total',
      help: 'XP gained within tap success telemetry',
      labelNames: ['batch_bucket', 'level_up'] as const,
      registers: [register],
    })
  : null;

function coerceColorScheme(input: unknown): ColorScheme {
  return input === 'light' || input === 'dark' ? input : 'unknown';
}

function coerceDeviceClass(input: unknown): DeviceClass {
  return input === 'desktop' || input === 'tablet' || input === 'mobile' ? input : 'unknown';
}

function bucketBatchSize(size: number): string {
  if (!Number.isFinite(size) || size <= 0) {
    return 'unknown';
  }
  if (size === 1) {
    return '1';
  }
  if (size <= 5) {
    return '2-5';
  }
  if (size <= 10) {
    return '6-10';
  }
  if (size <= 20) {
    return '11-20';
  }
  return '21+';
}

export function recordRenderLatencyMetric(params: {
  screen: string;
  latencyMs: number;
  theme?: unknown;
  deviceClass?: unknown;
}) {
  if (!renderLatencyHistogram || !Number.isFinite(params.latencyMs) || params.latencyMs <= 0) {
    return;
  }

  const screen = params.screen || 'unknown';
  const latencyMs = Math.max(0, params.latencyMs);
  const theme = coerceColorScheme(params.theme);
  const deviceClass = coerceDeviceClass(params.deviceClass);

  renderLatencyHistogram.observe(
    { screen, theme, device_class: deviceClass },
    latencyMs
  );
}

export function recordTapSuccessMetric(params: {
  batchSize: number;
  energyGained?: number;
  xpGained?: number;
  levelUp?: boolean;
}) {
  if (!tapSuccessCounter) {
    return;
  }

  const batchBucket = bucketBatchSize(params.batchSize);
  const levelUp = params.levelUp ? 'true' : 'false';
  tapSuccessCounter.inc({ batch_bucket: batchBucket, level_up: levelUp });

  if (tapSuccessEnergyCounter && Number.isFinite(params.energyGained) && params.energyGained) {
    tapSuccessEnergyCounter.inc(
      { batch_bucket: batchBucket, level_up: levelUp },
      params.energyGained ?? 0
    );
  }

  if (tapSuccessXpCounter && Number.isFinite(params.xpGained) && params.xpGained) {
    tapSuccessXpCounter.inc(
      { batch_bucket: batchBucket, level_up: levelUp },
      params.xpGained ?? 0
    );
  }
}

export const telemetryMetrics = {
  recordRenderLatencyMetric,
  recordTapSuccessMetric,
};
