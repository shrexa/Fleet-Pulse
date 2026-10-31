/**
 * Domain types for the monitored microservices shown on the Fleet Pulse dashboard.
 *
 * These live in the services feature (not a generic Angular "services" folder)
 * so later chunks can grow this model without changing dashboard UI state.
 * Metric fields are nested so a service's identity and its latest snapshot
 * stay easy to talk about separately in an interview.
 */

/** Operational health of a service. Used for badges, filters, and severity sorting. */
export type ServiceStatus = 'healthy' | 'degraded' | 'down';

/**
 * Latest performance snapshot for a service.
 * Numbers are already in display units so the table does not need conversions.
 */
export interface ServiceMetrics {
  /** 95th-percentile request latency in milliseconds. */
  p95LatencyMs: number;
  /** Failed requests as a percentage (for example 2.5 means 2.5%). */
  errorRatePercent: number;
  /** Current throughput in requests per second. */
  requestsPerSecond: number;
}

/** One row in the dashboard table: identity + current health + current metrics. */
export interface FleetService {
  /** Stable identifier such as "svc-0001". Used for search and as the table track key. */
  id: string;
  /** Human-readable service name such as "payments-api". */
  name: string;
  status: ServiceStatus;
  metrics: ServiceMetrics;
}

/** Status dropdown values, including "all" which means "do not filter by status". */
export type StatusFilter = 'all' | ServiceStatus;

/** Columns the user can sort. Service ID is intentionally omitted. */
export type SortableColumn = 'name' | 'status' | 'p95LatencyMs' | 'errorRatePercent' | 'requestsPerSecond';

export type SortDirection = 'asc' | 'desc';

/**
 * Severity rank used when sorting by status.
 * Alphabetical order would put "down" before "healthy", which is not useful
 * for an operations dashboard. Lower number = healthier.
 */
export const STATUS_SORT_RANK: Record<ServiceStatus, number> = {
  healthy: 0,
  degraded: 1,
  down: 2,
};

export const STATUS_FILTER_VALUES: readonly StatusFilter[] = ['all', 'healthy', 'degraded', 'down'];

export function isStatusFilter(value: string): value is StatusFilter {
  return (STATUS_FILTER_VALUES as readonly string[]).includes(value);
}
