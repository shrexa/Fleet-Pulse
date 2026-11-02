import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Auth } from '../auth/auth';
import { FleetServices } from '../services/fleet-services';
import {
  FleetService,
  SortableColumn,
  SortDirection,
  STATUS_SORT_RANK,
  StatusFilter,
  isStatusFilter,
} from '../services/service.model';

/**
 * Fleet Pulse dashboard.
 *
 * Local UI state (search, status filter, sort) stays on this component.
 * FleetServices loads catalog + metrics and exposes one joined list.
 */
@Component({
  imports: [DatePipe, DecimalPipe],
  selector: 'app-dashboard',
  styleUrl: './dashboard.scss',
  templateUrl: './dashboard.html',
})
export class Dashboard {
  readonly fleetServices = inject(FleetServices);
  readonly auth = inject(Auth);
  private readonly router = inject(Router);

  /** Free-text query matched against service name or service ID. */
  readonly searchQuery = signal('');

  /** "all" shows every status; otherwise only that status remains. */
  readonly statusFilter = signal<StatusFilter>('all');

  readonly sortColumn = signal<SortableColumn>('name');
  readonly sortDirection = signal<SortDirection>('asc');

  /**
   * Fleet-wide counts from the unfiltered source list.
   *
   * These stay stable while the user searches or filters so the cards
   * always describe overall fleet health, not just the current table view.
   */
  readonly summary = computed(() => {
    const services = this.fleetServices.services();
    let healthy = 0;
    let degraded = 0;
    let down = 0;

    for (const service of services) {
      if (service.status === 'healthy') {
        healthy += 1;
      } else if (service.status === 'degraded') {
        degraded += 1;
      } else {
        down += 1;
      }
    }

    return {
      total: services.length,
      healthy,
      degraded,
      down,
    };
  });

  /**
   * Rows shown in the table.
   *
   * Pipeline:
   * 1. Start from the source list.
   * 2. Keep rows whose name or ID contains the search text (case-insensitive).
   * 3. If a status other than "all" is selected, keep only that status.
   * 4. Sort a copy of the remaining rows by the active column and direction.
   *
   * `computed` re-runs only when one of the signals it reads changes,
   * so we do not re-filter on unrelated UI updates.
   */
  readonly visibleServices = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const status = this.statusFilter();
    const column = this.sortColumn();
    const direction = this.sortDirection();

    let rows = this.fleetServices.services();

    if (query) {
      rows = rows.filter(
        (service) =>
          service.name.toLowerCase().includes(query) || service.id.toLowerCase().includes(query),
      );
    }

    if (status !== 'all') {
      rows = rows.filter((service) => service.status === status);
    }

    const directionFactor = direction === 'asc' ? 1 : -1;

    return [...rows].sort(
      (left, right) => compareServices(left, right, column) * directionFactor,
    );
  });

  readonly hasActiveFilters = computed(
    () => this.searchQuery().trim() !== '' || this.statusFilter() !== 'all',
  );

  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
  }

  onStatusFilterChange(event: Event): void {
    const select = event.target as HTMLSelectElement;

    if (isStatusFilter(select.value)) {
      this.statusFilter.set(select.value);
    }
  }

  /**
   * Clicking the same column flips direction; clicking a new column
   * starts that column in ascending order so the first click is predictable.
   */
  toggleSort(column: SortableColumn): void {
    if (this.sortColumn() === column) {
      this.sortDirection.update((direction) => (direction === 'asc' ? 'desc' : 'asc'));
      return;
    }

    this.sortColumn.set(column);
    this.sortDirection.set('asc');
  }

  /** Clears search and status only. The current sort stays so the user does not lose it. */
  resetFilters(): void {
    this.searchQuery.set('');
    this.statusFilter.set('all');
  }

  /**
   * Retry re-runs both GET /services and GET /metrics/snapshot.
   * The service no-ops if a request is already in flight.
   */
  retryLoad(): void {
    this.fleetServices.loadServices();
  }

  logout(): void {
    this.auth.logout();
    void this.router.navigateByUrl('/login');
  }

  sortAria(column: SortableColumn): 'ascending' | 'descending' | 'none' {
    if (this.sortColumn() !== column) {
      return 'none';
    }

    return this.sortDirection() === 'asc' ? 'ascending' : 'descending';
  }

  sortIndicator(column: SortableColumn): string {
    if (this.sortColumn() !== column) {
      return '';
    }

    return this.sortDirection() === 'asc' ? '↑' : '↓';
  }
}

/**
 * Returns a negative number when `left` should come first in ascending order.
 * Status uses severity rank so "healthy" sorts before "degraded" and "down".
 */
function compareServices(left: FleetService, right: FleetService, column: SortableColumn): number {
  switch (column) {
    case 'name':
      return left.name.localeCompare(right.name);
    case 'status':
      return STATUS_SORT_RANK[left.status] - STATUS_SORT_RANK[right.status];
    case 'p95LatencyMs':
      return left.metrics.p95LatencyMs - right.metrics.p95LatencyMs;
    case 'errorRatePercent':
      return left.metrics.errorRatePercent - right.metrics.errorRatePercent;
    case 'requestsPerSecond':
      return left.metrics.requestsPerSecond - right.metrics.requestsPerSecond;
  }
}
