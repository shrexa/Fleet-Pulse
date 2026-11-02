import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Service, inject, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { API_BASE_URL } from '../../core/api.config';
import {
  FleetService,
  MISSING_METRICS,
  MetricsSnapshotItem,
  ServiceCatalogItem,
  ServiceMetrics,
  ServiceStatus,
} from './service.model';

/**
 * Owns the dashboard's source list.
 *
 * Two GETs run together: /services (who the fleet is) and
 * /metrics/snapshot (how each service is performing). HttpClient is used
 * so both calls share provideHttpClient() and HttpErrorResponse handling.
 *
 * Results are joined by id/serviceId into one services signal. The
 * dashboard keeps using that signal for search, filter, sort, and summary.
 */
@Service()
export class FleetServices {
  private readonly http = inject(HttpClient);

  private readonly loadingState = signal(true);
  private readonly errorState = signal<string | null>(null);
  private readonly serviceList = signal<readonly FleetService[]>([]);
  private readonly snapshotAtState = signal<string | null>(null);
  private inFlight = false;

  readonly isLoading = this.loadingState.asReadonly();
  readonly error = this.errorState.asReadonly();
  readonly services = this.serviceList.asReadonly();
  readonly snapshotAt = this.snapshotAtState.asReadonly();

  constructor() {
    this.loadServices();
  }

  /**
   * Loads catalog + snapshot, or reloads both on Retry.
   *
   * forkJoin waits until both requests complete, then we join once.
   * That avoids a half-updated table and a second click while in flight.
   */
  loadServices(): void {
    if (this.inFlight) {
      return;
    }

    this.inFlight = true;
    this.loadingState.set(true);
    this.errorState.set(null);

    forkJoin({
      catalog: this.http.get<unknown>(`${API_BASE_URL}/services`),
      snapshot: this.http.get<unknown>(`${API_BASE_URL}/metrics/snapshot`),
    }).subscribe({
      next: ({ catalog, snapshot }) => {
        try {
          const parsedSnapshot = parseSnapshot(snapshot);
          this.serviceList.set(joinCatalogWithMetrics(parseCatalog(catalog), parsedSnapshot.metricsById));
          this.snapshotAtState.set(parsedSnapshot.timestamp);
          this.errorState.set(null);
        } catch (err: unknown) {
          this.serviceList.set([]);
          this.snapshotAtState.set(null);
          this.errorState.set(err instanceof Error ? err.message : 'Could not read the API response.');
        } finally {
          this.loadingState.set(false);
          this.inFlight = false;
        }
      },
      error: (err: unknown) => {
        this.serviceList.set([]);
        this.snapshotAtState.set(null);
        this.errorState.set(messageFromHttpError(err));
        this.loadingState.set(false);
        this.inFlight = false;
      },
    });
  }
}

function isServiceStatus(value: unknown): value is ServiceStatus {
  return value === 'healthy' || value === 'degraded' || value === 'down';
}

function parseCatalog(body: unknown): ServiceCatalogItem[] {
  if (!Array.isArray(body)) {
    throw new Error('Services response was not an array.');
  }

  return body.map((row, index) => parseCatalogItem(row, index));
}

function parseCatalogItem(row: unknown, index: number): ServiceCatalogItem {
  if (typeof row !== 'object' || row === null) {
    throw new Error(`Service at index ${index} is not an object.`);
  }

  const record = row as Record<string, unknown>;
  const id = record['id'];
  const name = record['name'];
  const team = record['team'];
  const status = record['status'];

  if (typeof id !== 'string' || typeof name !== 'string' || typeof team !== 'string') {
    throw new Error(`Service at index ${index} is missing id, name, or team.`);
  }

  if (!isServiceStatus(status)) {
    throw new Error(`Service ${id} has an invalid status.`);
  }

  return { id, name, team, status };
}

function parseSnapshot(body: unknown): { timestamp: string; metricsById: Map<string, ServiceMetrics> } {
  if (typeof body !== 'object' || body === null) {
    throw new Error('Metrics snapshot was not an object.');
  }

  const record = body as Record<string, unknown>;
  const timestamp = record['timestamp'];
  const metrics = record['metrics'];

  if (typeof timestamp !== 'string' || !Array.isArray(metrics)) {
    throw new Error('Metrics snapshot must include timestamp and a metrics array.');
  }

  const metricsById = new Map<string, ServiceMetrics>();

  metrics.forEach((row, index) => {
    const item = parseSnapshotItem(row, index);
    metricsById.set(item.serviceId, toServiceMetrics(item));
  });

  return { timestamp, metricsById };
}

function parseSnapshotItem(row: unknown, index: number): MetricsSnapshotItem {
  if (typeof row !== 'object' || row === null) {
    throw new Error(`Metric at index ${index} is not an object.`);
  }

  const record = row as Record<string, unknown>;
  const serviceId = record['serviceId'];
  const latencyMs = record['latencyMs'];
  const errorRate = record['errorRate'];
  const requestsPerSecond = record['requestsPerSecond'];

  if (
    typeof serviceId !== 'string' ||
    typeof latencyMs !== 'number' ||
    typeof errorRate !== 'number' ||
    typeof requestsPerSecond !== 'number'
  ) {
    throw new Error(`Metric at index ${index} is missing required numeric fields.`);
  }

  return { serviceId, latencyMs, errorRate, requestsPerSecond };
}

function toServiceMetrics(item: MetricsSnapshotItem): ServiceMetrics {
  return {
    p95LatencyMs: item.latencyMs,
    errorRatePercent: item.errorRate,
    requestsPerSecond: item.requestsPerSecond,
  };
}

/**
 * Catalog rows stay the source of identity. Snapshot rows overlay measurements
 * by matching serviceId to id. A Map makes that join O(n) instead of nested loops.
 */
function joinCatalogWithMetrics(
  catalog: ServiceCatalogItem[],
  metricsById: Map<string, ServiceMetrics>,
): FleetService[] {
  return catalog.map((item) => ({
    id: item.id,
    name: item.name,
    team: item.team,
    status: item.status,
    metrics: metricsById.get(item.id) ?? MISSING_METRICS,
  }));
}

function messageFromHttpError(err: unknown): string {
  if (err instanceof HttpErrorResponse) {
    if (err.status === 0) {
      return `Could not reach the API at ${API_BASE_URL}. Start the backend and click Retry.`;
    }

    return `The API returned HTTP ${err.status}. ${err.statusText}`;
  }

  if (err instanceof Error) {
    return err.message;
  }

  return 'Could not load fleet data.';
}
