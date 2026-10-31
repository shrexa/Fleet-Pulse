import { FleetService } from './service.model';

/**
 * Static snapshot used for Chunk 1.
 *
 * Kept out of the component so the UI only deals with state and presentation.
 * The mix of healthy / degraded / down rows lets search, filters, and summary
 * counts be demonstrated without a backend.
 */
export const DUMMY_SERVICES: readonly FleetService[] = [
  {
    id: 'svc-0001',
    name: 'payments-api',
    status: 'healthy',
    metrics: { p95LatencyMs: 120, errorRatePercent: 0.2, requestsPerSecond: 1200 },
  },
  {
    id: 'svc-0002',
    name: 'auth-service',
    status: 'degraded',
    metrics: { p95LatencyMs: 450, errorRatePercent: 2.5, requestsPerSecond: 800 },
  },
  {
    id: 'svc-0003',
    name: 'order-service',
    status: 'down',
    metrics: { p95LatencyMs: 0, errorRatePercent: 5.0, requestsPerSecond: 0 },
  },
  {
    id: 'svc-0004',
    name: 'inventory-service',
    status: 'healthy',
    metrics: { p95LatencyMs: 95, errorRatePercent: 0.1, requestsPerSecond: 640 },
  },
  {
    id: 'svc-0005',
    name: 'notification-service',
    status: 'healthy',
    metrics: { p95LatencyMs: 180, errorRatePercent: 0.4, requestsPerSecond: 2100 },
  },
  {
    id: 'svc-0006',
    name: 'shipping-api',
    status: 'degraded',
    metrics: { p95LatencyMs: 620, errorRatePercent: 1.8, requestsPerSecond: 310 },
  },
  {
    id: 'svc-0007',
    name: 'billing-service',
    status: 'healthy',
    metrics: { p95LatencyMs: 140, errorRatePercent: 0.3, requestsPerSecond: 540 },
  },
  {
    id: 'svc-0008',
    name: 'user-profile-service',
    status: 'healthy',
    metrics: { p95LatencyMs: 88, errorRatePercent: 0.05, requestsPerSecond: 970 },
  },
  {
    id: 'svc-0009',
    name: 'search-service',
    status: 'degraded',
    metrics: { p95LatencyMs: 780, errorRatePercent: 3.1, requestsPerSecond: 1500 },
  },
  {
    id: 'svc-0010',
    name: 'analytics-api',
    status: 'healthy',
    metrics: { p95LatencyMs: 210, errorRatePercent: 0.6, requestsPerSecond: 430 },
  },
  {
    id: 'svc-0011',
    name: 'catalog-service',
    status: 'down',
    metrics: { p95LatencyMs: 0, errorRatePercent: 8.4, requestsPerSecond: 0 },
  },
  {
    id: 'svc-0012',
    name: 'recommendation-engine',
    status: 'healthy',
    metrics: { p95LatencyMs: 260, errorRatePercent: 0.9, requestsPerSecond: 720 },
  },
];
