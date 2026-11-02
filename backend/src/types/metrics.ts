/**
 * A metrics snapshot is one point-in-time reading for the whole fleet.
 *
 * Catalog identity lives on GET /services (id, name, team, status).
 * This payload is only measurements, joined back to the catalog by serviceId.
 */

export interface ServiceMetric {
  /** Must match FleetService.id from GET /services, e.g. svc-0001. */
  serviceId: string;
  /** P95-style latency in milliseconds. Always >= 0. */
  latencyMs: number;
  /** Failed requests as a percentage from 0 to 100. */
  errorRate: number;
  /** Current throughput. Always >= 0. */
  requestsPerSecond: number;
}

export interface MetricsSnapshot {
  /** ISO-8601 time this snapshot was taken. */
  timestamp: string;
  metrics: ServiceMetric[];
}
