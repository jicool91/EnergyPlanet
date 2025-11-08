import client from 'prom-client';
import { metricsEnabled, register } from './index';

type ColorScheme = 'light' | 'dark' | 'unknown';
type DeviceClass = 'desktop' | 'tablet' | 'mobile' | 'unknown';

type SafeAreaKind = 'safe' | 'content';
const SAFE_AREA_EDGES = ['top', 'right', 'bottom', 'left'] as const;
type SafeAreaEdge = (typeof SAFE_AREA_EDGES)[number];
type SafeAreaSnapshot = Partial<Record<SafeAreaEdge, number>>;

type ViewportDimension = 'height' | 'stable_height' | 'width';

type ViewportMetricsPayload = {
  height?: number | null;
  stableHeight?: number | null;
  width?: number | null;
  isFullscreen?: boolean | null;
};

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

const safeAreaEventsCounter = metricsEnabled
  ? new client.Counter({
      name: 'energyplanet_safe_area_events_total',
      help: 'Safe area change events grouped by origin/kind',
      labelNames: ['origin', 'kind'] as const,
      registers: [register],
    })
  : null;

const safeAreaInsetHistogram = metricsEnabled
  ? new client.Histogram({
      name: 'energyplanet_safe_area_inset_px',
      help: 'Safe/content inset values (px) reported by clients',
      buckets: [0, 4, 8, 12, 16, 20, 24, 32, 40, 60, 80, 120, 160],
      labelNames: ['origin', 'kind', 'edge'] as const,
      registers: [register],
    })
  : null;

const safeAreaDeltaHistogram = metricsEnabled
  ? new client.Histogram({
      name: 'energyplanet_safe_area_delta_px',
      help: 'Delta in px when UI reports large safe-area change',
      buckets: [4, 8, 12, 16, 24, 32, 48, 64, 96, 128],
      labelNames: ['kind'] as const,
      registers: [register],
    })
  : null;

const viewportMetricsCounter = metricsEnabled
  ? new client.Counter({
      name: 'energyplanet_viewport_metrics_events_total',
      help: 'Viewport metrics updates grouped by origin',
      labelNames: ['origin'] as const,
      registers: [register],
    })
  : null;

const viewportDimensionHistogram = metricsEnabled
  ? new client.Histogram({
      name: 'energyplanet_viewport_dimension_px',
      help: 'Viewport dimensions (px) reported by clients',
      buckets: [200, 320, 480, 600, 720, 900, 1080, 1280, 1440, 1720, 2000],
      labelNames: ['origin', 'dimension', 'is_fullscreen'] as const,
      registers: [register],
    })
  : null;

const viewportFullscreenCounter = metricsEnabled
  ? new client.Counter({
      name: 'energyplanet_viewport_fullscreen_state_total',
      help: 'Count viewport metric events split by fullscreen flag',
      labelNames: ['origin', 'is_fullscreen'] as const,
      registers: [register],
    })
  : null;

const viewportActionCounter = metricsEnabled
  ? new client.Counter({
      name: 'energyplanet_viewport_actions_total',
      help: 'Viewport API actions (expand/fullscreen) grouped by status',
      labelNames: ['action', 'status', 'path'] as const,
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

function coerceLabel(value?: string): string {
  if (!value) {
    return 'unknown';
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : 'unknown';
}

function isValidPixelValue(value?: number | null): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

function observeSafeAreaInsets(origin: string, kind: SafeAreaKind, snapshot?: SafeAreaSnapshot) {
  if (!safeAreaInsetHistogram || !snapshot) {
    return;
  }
  SAFE_AREA_EDGES.forEach(edge => {
    const value = snapshot[edge];
    if (isValidPixelValue(value)) {
      safeAreaInsetHistogram.observe({ origin, kind, edge }, value);
    }
  });
}

function observeViewportDimension(
  origin: string,
  dimension: ViewportDimension,
  value?: number | null,
  isFullscreen?: boolean | null
) {
  if (!viewportDimensionHistogram || !isValidPixelValue(value ?? null)) {
    return;
  }
  viewportDimensionHistogram.observe(
    { origin, dimension, is_fullscreen: isFullscreen ? 'true' : 'false' },
    value ?? 0
  );
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

export function recordSafeAreaMetric(params: {
  origin?: string;
  safe?: SafeAreaSnapshot | null;
  content?: SafeAreaSnapshot | null;
}) {
  if (!safeAreaEventsCounter) {
    return;
  }

  const origin = coerceLabel(params.origin);

  if (params.safe) {
    safeAreaEventsCounter.inc({ origin, kind: 'safe' });
    observeSafeAreaInsets(origin, 'safe', params.safe);
  }

  if (params.content) {
    safeAreaEventsCounter.inc({ origin, kind: 'content' });
    observeSafeAreaInsets(origin, 'content', params.content);
  }
}

export function recordSafeAreaDeltaMetric(params: { safeDelta?: number | null; contentDelta?: number | null }) {
  if (!safeAreaDeltaHistogram) {
    return;
  }

  if (isValidPixelValue(params.safeDelta ?? null)) {
    safeAreaDeltaHistogram.observe({ kind: 'safe' }, params.safeDelta ?? 0);
  }

  if (isValidPixelValue(params.contentDelta ?? null)) {
    safeAreaDeltaHistogram.observe({ kind: 'content' }, params.contentDelta ?? 0);
  }
}

export function recordViewportMetric(params: { origin?: string; metrics?: ViewportMetricsPayload | null }) {
  if (!viewportMetricsCounter) {
    return;
  }

  const origin = coerceLabel(params.origin);
  viewportMetricsCounter.inc({ origin });

  if (viewportFullscreenCounter) {
    const fullscreenLabel = params.metrics?.isFullscreen ? 'true' : 'false';
    viewportFullscreenCounter.inc({ origin, is_fullscreen: fullscreenLabel });
  }

  if (params.metrics) {
    observeViewportDimension(origin, 'height', params.metrics.height, params.metrics.isFullscreen);
    observeViewportDimension(
      origin,
      'stable_height',
      params.metrics.stableHeight,
      params.metrics.isFullscreen
    );
    observeViewportDimension(origin, 'width', params.metrics.width, params.metrics.isFullscreen);
  }
}

export function recordViewportActionMetric(params: { action?: string; status?: string; path?: string }) {
  if (!viewportActionCounter) {
    return;
  }

  viewportActionCounter.inc({
    action: coerceLabel(params.action ?? 'unknown'),
    status: coerceLabel(params.status ?? 'unknown'),
    path: coerceLabel(params.path ?? 'unknown'),
  });
}

export const telemetryMetrics = {
  recordRenderLatencyMetric,
  recordTapSuccessMetric,
  recordSafeAreaMetric,
  recordSafeAreaDeltaMetric,
  recordViewportMetric,
  recordViewportActionMetric,
};
