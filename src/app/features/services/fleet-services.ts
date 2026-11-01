import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Service, inject, signal } from '@angular/core';
import { API_BASE_URL } from '../../core/api.config';
import {
  FleetService,
  PLACEHOLDER_METRICS,
  ServiceCatalogItem,
  ServiceStatus,
} from './service.model';

/**
 * Owns the fleet catalog loaded from GET /services.
 *
 * HttpClient is used because it is Angular's typed HTTP API: it talks to
 * provideHttpClient(), returns an Observable we subscribe to once, and
 * reports failures as HttpErrorResponse. This is a one-shot fetch, not a
 * live stream.
 *
 * Signals hold the result so the dashboard's computed search/filter/sort
 * logic can keep working without knowing about HTTP.
 */
@Service()
export class FleetServices {
  private readonly http = inject(HttpClient);

  private readonly loadingState = signal(true);
  private readonly errorState = signal<string | null>(null);
  private readonly serviceList = signal<readonly FleetService[]>([]);
  private inFlight = false;

  readonly isLoading = this.loadingState.asReadonly();
  readonly error = this.errorState.asReadonly();
  readonly services = this.serviceList.asReadonly();

  constructor() {
    this.loadServices();
  }

  /**
   * Loads (or reloads) the catalog.
   *
   * Skips a second call while one request is already in flight so a double
   * Retry click does not fire two identical GETs. Retry after failure is
   * allowed because `inFlight` is cleared in both success and error paths.
   */
  loadServices(): void {
    if (this.inFlight) {
      return;
    }

    this.inFlight = true;
    this.loadingState.set(true);
    this.errorState.set(null);

    this.http.get<unknown>(`${API_BASE_URL}/services`).subscribe({
      next: (body) => {
        try {
          this.serviceList.set(mapCatalog(body));
          this.errorState.set(null);
        } catch (err: unknown) {
          this.serviceList.set([]);
          this.errorState.set(err instanceof Error ? err.message : 'Could not read the services response.');
        } finally {
          this.loadingState.set(false);
          this.inFlight = false;
        }
      },
      error: (err: unknown) => {
        this.serviceList.set([]);
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

/**
 * Turns the JSON array into dashboard rows.
 *
 * TypeScript generics on HttpClient are not a runtime check, so we validate
 * the payload here. Metric fields are attached as placeholders — they are
 * not present on the API object.
 */
function mapCatalog(body: unknown): FleetService[] {
  if (!Array.isArray(body)) {
    throw new Error('Services response was not an array.');
  }

  return body.map((row, index) => toFleetService(parseCatalogItem(row, index)));
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

  return {
    id,
    name,
    team,
    status,
  };
}

function toFleetService(item: ServiceCatalogItem): FleetService {
  return {
    id: item.id,
    name: item.name,
    team: item.team,
    status: item.status,
    metrics: PLACEHOLDER_METRICS,
  };
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

  return 'Could not load services.';
}
