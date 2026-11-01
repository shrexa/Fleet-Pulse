import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import request from 'supertest';
import { createApp } from './app';
import { DEFAULT_SERVICE_COUNT } from './data/services.data';
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
