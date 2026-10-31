import { Service, signal } from '@angular/core';
import { DUMMY_SERVICES } from './dummy-services';
import { FleetService } from './service.model';

/**
 * Owns the list of monitored services.
 *
 * For Chunk 1 this is a one-time dummy load. The dashboard reads these
 * signals and never reaches into the dummy-data file itself, so later
 * HTTP / WebSocket work can replace this class's internals without
 * rewriting search, filter, or sort.
 */
@Service()
export class FleetServices {
  /**
   * Starts true so the dashboard can show a loading state while the
   * dummy snapshot is applied. This is not a live stream — just a
   * short async pause that mimics a first fetch.
   */
  private readonly loadingState = signal(true);
  private readonly serviceList = signal<readonly FleetService[]>([]);

  /** Public read-only views so components cannot accidentally mutate source state. */
  readonly isLoading = this.loadingState.asReadonly();
  readonly services = this.serviceList.asReadonly();

  constructor() {
    window.setTimeout(() => {
      this.serviceList.set(DUMMY_SERVICES);
      this.loadingState.set(false);
    }, 350);
  }
}
