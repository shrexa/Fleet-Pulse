import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import request from 'supertest';
import { createApp } from './app';
import { DEFAULT_SERVICE_COUNT, SERVICE_CATALOG } from './data/services.data';
import type { AuthTokenResponse } from './types/auth';
import type { MetricsSnapshot, ServiceMetric } from './types/metrics';
import { SERVICE_STATUSES, type FleetService } from './types/service';

/**
 * HTTP tests against createApp(), not a live port.
 * That uses the same split from Chunk 2A: app wiring is testable
 * without server.ts calling listen().
 */
const app = createApp();
const validStatuses = new Set<string>(SERVICE_STATUSES);

function isServiceBody(value: unknown): value is FleetService {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const row = value as Record<string, unknown>;

  return (
    typeof row.id === 'string' &&
    typeof row.name === 'string' &&
    typeof row.team === 'string' &&
    typeof row.status === 'string' &&
    validStatuses.has(row.status)
  );
}

describe('GET /health', () => {
  it('still returns { status: "ok" }', async () => {
    const response = await request(app).get('/health');

    assert.equal(response.status, 200);
    assert.deepEqual(response.body, { status: 'ok' });
  });
});

describe('GET /services', () => {
  it('returns exactly 2,000 typed catalog rows', async () => {
    const response = await request(app).get('/services');
    const body: unknown = response.body;

    assert.equal(response.status, 200);
    assert.ok(Array.isArray(body), 'response body must be an array');
    assert.equal(body.length, DEFAULT_SERVICE_COUNT);
    assert.equal(body.length, 2000);

    const ids = body.map((row) => {
      assert.ok(isServiceBody(row), `invalid service row: ${JSON.stringify(row)}`);
      return row.id;
    });

    assert.equal(ids[0], 'svc-0001');
    assert.equal(ids[ids.length - 1], 'svc-2000');
    assert.equal(new Set(ids).size, ids.length, 'service IDs must be unique');
  });
});

function isServiceMetric(value: unknown): value is ServiceMetric {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const row = value as Record<string, unknown>;

  return (
    typeof row.serviceId === 'string' &&
    typeof row.latencyMs === 'number' &&
    typeof row.errorRate === 'number' &&
    typeof row.requestsPerSecond === 'number'
  );
}

function isMetricsSnapshot(value: unknown): value is MetricsSnapshot {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const body = value as Record<string, unknown>;

  return typeof body.timestamp === 'string' && Array.isArray(body.metrics);
}

describe('GET /metrics/snapshot', () => {
  it('returns a timestamped snapshot for every catalog service', async () => {
    const response = await request(app).get('/metrics/snapshot');
    const body: unknown = response.body;
    const catalogIds = new Set(SERVICE_CATALOG.map((service) => service.id));

    assert.equal(response.status, 200);
    assert.ok(isMetricsSnapshot(body), 'response must include timestamp and metrics');
    assert.equal(Number.isNaN(Date.parse(body.timestamp)), false, 'timestamp must be ISO-8601');
    assert.equal(body.metrics.length, DEFAULT_SERVICE_COUNT);
    assert.equal(body.metrics.length, 2000);

    const metricIds = body.metrics.map((row) => {
      assert.ok(isServiceMetric(row), `invalid metric row: ${JSON.stringify(row)}`);
      assert.ok(catalogIds.has(row.serviceId), `unknown serviceId ${row.serviceId}`);
      assert.ok(row.latencyMs >= 0, 'latencyMs must be non-negative');
      assert.ok(row.errorRate >= 0 && row.errorRate <= 100, 'errorRate must be 0-100');
      assert.ok(row.requestsPerSecond >= 0, 'requestsPerSecond must be non-negative');
      return row.serviceId;
    });

    assert.equal(new Set(metricIds).size, metricIds.length, 'metric serviceIds must be unique');
    assert.equal(metricIds[0], 'svc-0001');
    assert.equal(metricIds[metricIds.length - 1], 'svc-2000');
  });
});

function isAuthTokenResponse(value: unknown): value is AuthTokenResponse {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const body = value as Record<string, unknown>;
  const user = body['user'];

  if (typeof user !== 'object' || user === null) {
    return false;
  }

  const account = user as Record<string, unknown>;

  return (
    typeof body.accessToken === 'string' &&
    typeof body.refreshToken === 'string' &&
    body.expiresIn === 60 &&
    typeof account.email === 'string' &&
    (account.role === 'operator' || account.role === 'viewer')
  );
}

describe('POST /auth/login', () => {
  it('returns tokens for the operator test user', async () => {
    const response = await request(app).post('/auth/login').send({
      email: 'operator@pulse.dev',
      password: 'pulse123',
    });

    assert.equal(response.status, 200);
    assert.ok(isAuthTokenResponse(response.body));
    assert.equal(response.body.user.email, 'operator@pulse.dev');
    assert.equal(response.body.user.role, 'operator');
    assert.notEqual(response.body.accessToken, response.body.refreshToken);
  });

  it('returns tokens for the viewer test user', async () => {
    const response = await request(app).post('/auth/login').send({
      email: 'viewer@pulse.dev',
      password: 'pulse123',
    });

    assert.equal(response.status, 200);
    assert.ok(isAuthTokenResponse(response.body));
    assert.equal(response.body.user.role, 'viewer');
  });

  it('rejects invalid credentials with 401', async () => {
    const response = await request(app).post('/auth/login').send({
      email: 'operator@pulse.dev',
      password: 'wrong-password',
    });

    assert.equal(response.status, 401);
    assert.deepEqual(response.body, { error: 'Invalid email or password' });
  });

  it('rejects a missing body with 400', async () => {
    const response = await request(app).post('/auth/login').send({});

    assert.equal(response.status, 400);
    assert.deepEqual(response.body, { error: 'email and password are required' });
  });
});

describe('POST /auth/refresh', () => {
  it('issues a new token pair from a valid refresh token', async () => {
    const login = await request(app).post('/auth/login').send({
      email: 'operator@pulse.dev',
      password: 'pulse123',
    });

    assert.ok(isAuthTokenResponse(login.body));

    const response = await request(app).post('/auth/refresh').send({
      refreshToken: login.body.refreshToken,
    });

    assert.equal(response.status, 200);
    assert.ok(isAuthTokenResponse(response.body));
    assert.equal(response.body.user.email, 'operator@pulse.dev');
  });

  it('rejects an access token used as a refresh token', async () => {
    const login = await request(app).post('/auth/login').send({
      email: 'viewer@pulse.dev',
      password: 'pulse123',
    });

    assert.ok(isAuthTokenResponse(login.body));

    const response = await request(app).post('/auth/refresh').send({
      refreshToken: login.body.accessToken,
    });

    assert.equal(response.status, 401);
  });
});
