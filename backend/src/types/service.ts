/**
 * Backend domain model for a monitored microservice.
 *
 * This is the catalog identity only. Metrics (latency, error rate, RPS)
 * are intentionally omitted in Chunk 2A so the generator can stay focused
 * on a stable list of 2,000 services.
 */

/**
 * Operational health. A string union (not a free-form string) so
 * generateServices() and GET /services cannot emit an unknown status
 * without a TypeScript error.
 */
export type ServiceStatus = 'healthy' | 'degraded' | 'down';

export const SERVICE_STATUSES: readonly ServiceStatus[] = ['healthy', 'degraded', 'down'];

export interface FleetService {
  /** Stable public id, formatted as svc-0001 … svc-2000. */
  id: string;
  /** Human-readable name such as payments-api. */
  name: string;
  /** Owning team, used later for grouping and filters. */
  team: string;
  status: ServiceStatus;
}
