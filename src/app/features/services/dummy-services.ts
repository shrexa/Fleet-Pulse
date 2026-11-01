import { FleetService } from './service.model';

/**
 * Chunk 1 dummy snapshot. FleetServices no longer loads this file;
 * GET /services is the source of catalog rows. Kept so the old sample
 * names remain easy to compare during an interview.
 */
export const DUMMY_SERVICES: readonly FleetService[] = [
  {
    id: 'svc-0001',
    name: 'payments-api',
    team: 'Payments',
    status: 'healthy',
    metrics: { p95LatencyMs: 120, errorRatePercent: 0.2, requestsPerSecond: 1200 },
  },
  {
    id: 'svc-0002',
    name: 'auth-service',
    team: 'Identity',
    status: 'degraded',
    metrics: { p95LatencyMs: 450, errorRatePercent: 2.5, requestsPerSecond: 800 },
  },
  {
    id: 'svc-0003',
    name: 'order-service',
    team: 'Commerce',
    status: 'down',
    metrics: { p95LatencyMs: 0, errorRatePercent: 5.0, requestsPerSecond: 0 },
  },
  {
    id: 'svc-0004',
    name: 'inventory-service',
    team: 'Fulfillment',
    status: 'healthy',
    metrics: { p95LatencyMs: 95, errorRatePercent: 0.1, requestsPerSecond: 640 },
  },
  {
    id: 'svc-0005',
    name: 'notification-service',
    team: 'Notifications',
    status: 'healthy',
    metrics: { p95LatencyMs: 180, errorRatePercent: 0.4, requestsPerSecond: 2100 },
  },
  {
    id: 'svc-0006',
    name: 'shipping-api',
    team: 'Fulfillment',
    status: 'degraded',
    metrics: { p95LatencyMs: 620, errorRatePercent: 1.8, requestsPerSecond: 310 },
  },
  {
    id: 'svc-0007',
    name: 'billing-service',
    team: 'Payments',
    status: 'healthy',
    metrics: { p95LatencyMs: 140, errorRatePercent: 0.3, requestsPerSecond: 540 },
  },
  {
    id: 'svc-0008',
    name: 'user-profile-service',
    team: 'Identity',
    status: 'healthy',
    metrics: { p95LatencyMs: 88, errorRatePercent: 0.05, requestsPerSecond: 970 },
  },
  {
    id: 'svc-0009',
    name: 'search-service',
    team: 'Platform',
    status: 'degraded',
    metrics: { p95LatencyMs: 780, errorRatePercent: 3.1, requestsPerSecond: 1500 },
  },
  {
    id: 'svc-0010',
    name: 'analytics-api',
    team: 'Data',
    status: 'healthy',
    metrics: { p95LatencyMs: 210, errorRatePercent: 0.6, requestsPerSecond: 430 },
  },
  {
    id: 'svc-0011',
    name: 'catalog-service',
    team: 'Commerce',
    status: 'down',
    metrics: { p95LatencyMs: 0, errorRatePercent: 8.4, requestsPerSecond: 0 },
  },
  {
    id: 'svc-0012',
    name: 'recommendation-engine',
    team: 'Growth',
    status: 'healthy',
    metrics: { p95LatencyMs: 260, errorRatePercent: 0.9, requestsPerSecond: 720 },
  },
];
