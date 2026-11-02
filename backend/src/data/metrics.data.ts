import { SERVICE_CATALOG } from './services.data';
import type { FleetService } from '../types/service';
import type { MetricsSnapshot, ServiceMetric } from '../types/metrics';

/**
 * Builds one metric row from a catalog service.
 *
 * Values come from the numeric id and current status, not Math.random().
 * That keeps svc-0001's latency the same on every request, which is easier
 * to demo and test in a take-home than a noisy live stream.
 *
 * Status shapes the ranges so down services show 0 RPS, degraded services
 * look slower, and healthy services stay in a normal band.
 */
function metricsForService(service: FleetService): ServiceMetric {
  const index = Number.parseInt(service.id.slice(4), 10);
  const jitter = Number.isFinite(index) ? index : 0;

  switch (service.status) {
    case 'down':
      return {
        serviceId: service.id,
        latencyMs: 0,
        errorRate: roundTo(5 + (jitter % 10) * 0.4, 1),
        requestsPerSecond: 0,
      };
    case 'degraded':
      return {
        serviceId: service.id,
        latencyMs: 400 + (jitter % 50) * 8,
        errorRate: roundTo(1.5 + (jitter % 20) * 0.1, 1),
        requestsPerSecond: 200 + (jitter % 40) * 10,
      };
    case 'healthy':
      return {
        serviceId: service.id,
        latencyMs: 80 + (jitter % 40) * 4,
        errorRate: roundTo((jitter % 20) * 0.05, 2),
        requestsPerSecond: 400 + (jitter % 50) * 20,
      };
  }
}

function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

/** One metric record per catalog service, generated once at startup. */
export const SERVICE_METRICS: readonly ServiceMetric[] = SERVICE_CATALOG.map(metricsForService);

/**
 * Wraps the precomputed baselines in a fresh snapshot envelope.
 *
 * Metric numbers stay stable; timestamp is "now" so the payload still
 * looks like a point-in-time reading.
 */
export function createMetricsSnapshot(takenAt = new Date()): MetricsSnapshot {
  return {
    timestamp: takenAt.toISOString(),
    metrics: [...SERVICE_METRICS],
  };
}
