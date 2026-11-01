/**
 * Runtime settings for the mock API.
 *
 * Kept in one place so `app.ts` (HTTP behavior) and `server.ts`
 * (process startup) do not hard-code ports or origins.
 */
export interface AppConfig {
  /** TCP port the HTTP server binds to. */
  port: number;
  /**
   * Browser origin allowed to call this API.
   * Defaults to the Angular dev server so Chunk 2B can use fetch()
   * without a CORS failure.
   */
  corsOrigin: string;
}

const DEFAULT_PORT = 4000;
const DEFAULT_CORS_ORIGIN = 'http://localhost:4200';

/**
 * Reads PORT from the environment and rejects values Node cannot bind.
 * A bad PORT should fail at startup, not silently fall back.
 */
function parsePort(value: string | undefined): number {
  if (value === undefined || value.trim() === '') {
    return DEFAULT_PORT;
  }

  const parsed = Number.parseInt(value, 10);

  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535) {
    throw new Error(`Invalid PORT "${value}". Expected an integer from 1 to 65535.`);
  }

  return parsed;
}

export const config: AppConfig = {
  port: parsePort(process.env.PORT),
  corsOrigin: process.env.CORS_ORIGIN?.trim() || DEFAULT_CORS_ORIGIN,
};
