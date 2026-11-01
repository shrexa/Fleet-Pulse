import { FleetService, ServiceStatus } from '../types/service';

/**
 * Name + team pairs used as a repeating blueprint.
 *
 * The first twelve names match the Chunk 1 dummy rows so a later
 * frontend swap feels familiar. We do not import the Angular file —
 * that would couple the backend package to the UI build.
 */
const SERVICE_BLUEPRINTS: readonly { name: string; team: string }[] = [
  { name: 'payments-api', team: 'Payments' },
  { name: 'auth-service', team: 'Identity' },
  { name: 'order-service', team: 'Commerce' },
  { name: 'inventory-service', team: 'Fulfillment' },
  { name: 'notification-service', team: 'Notifications' },
  { name: 'shipping-api', team: 'Fulfillment' },
  { name: 'billing-service', team: 'Payments' },
  { name: 'user-profile-service', team: 'Identity' },
  { name: 'search-service', team: 'Platform' },
  { name: 'analytics-api', team: 'Data' },
  { name: 'catalog-service', team: 'Commerce' },
  { name: 'recommendation-engine', team: 'Growth' },
  { name: 'checkout-api', team: 'Payments' },
  { name: 'session-service', team: 'Identity' },
  { name: 'cart-service', team: 'Commerce' },
  { name: 'warehouse-service', team: 'Fulfillment' },
  { name: 'email-worker', team: 'Notifications' },
  { name: 'tracking-api', team: 'Fulfillment' },
  { name: 'ledger-service', team: 'Payments' },
  { name: 'sso-gateway', team: 'Identity' },
  { name: 'pricing-engine', team: 'Commerce' },
  { name: 'feature-flag-service', team: 'Platform' },
  { name: 'metrics-collector', team: 'Data' },
  { name: 'fraud-service', team: 'Risk' },
];

export const DEFAULT_SERVICE_COUNT = 2000;

function formatServiceId(index: number): string {
  return `svc-${String(index).padStart(4, '0')}`;
}

/**
 * Picks a status from the 1-based service index.
 *
 * Using modulo (not Math.random) keeps the same IDs healthy/degraded/down
 * after every restart. Rough mix: ~88% healthy, ~10% degraded, ~2% down.
 */
function statusForIndex(index: number): ServiceStatus {
  const slot = index % 50;

  if (slot === 0) {
    return 'down';
  }

  if (slot === 5 || slot === 15 || slot === 25 || slot === 35 || slot === 45) {
    return 'degraded';
  }

  return 'healthy';
}

/**
 * Builds a unique display name from a repeating blueprint.
 *
 * First cycle: payments-api
 * Later cycles: payments-api-02, payments-api-03, …
 * so all 2,000 rows stay distinguishable without a database.
 */
function nameForIndex(index: number): { name: string; team: string } {
  const blueprint = SERVICE_BLUEPRINTS[(index - 1) % SERVICE_BLUEPRINTS.length];
  const cycle = Math.floor((index - 1) / SERVICE_BLUEPRINTS.length);

  if (cycle === 0) {
    return blueprint;
  }

  return {
    name: `${blueprint.name}-${String(cycle + 1).padStart(2, '0')}`,
    team: blueprint.team,
  };
}

/**
 * Creates the in-memory service catalog.
 *
 * GET /services returns this array. Generate once here so each request
 * does not rebuild 2,000 rows.
 */
export function generateServices(count = DEFAULT_SERVICE_COUNT): FleetService[] {
  if (!Number.isInteger(count) || count < 1) {
    throw new Error(`Service count must be a positive integer. Received: ${count}`);
  }

  const services: FleetService[] = [];

  for (let index = 1; index <= count; index += 1) {
    const { name, team } = nameForIndex(index);

    services.push({
      id: formatServiceId(index),
      name,
      team,
      status: statusForIndex(index),
    });
  }

  return services;
}

/** Precomputed catalog so later routes do not regenerate 2,000 rows per request. */
export const SERVICE_CATALOG: readonly FleetService[] = generateServices();
