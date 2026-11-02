import { createHmac, timingSafeEqual } from 'crypto';
import { config } from '../config';
import type { AuthUser, TokenPayload, TokenType } from '../types/auth';

/** Assignment login response: access tokens last 60 seconds. */
export const ACCESS_TOKEN_TTL_SECONDS = 60;
export const REFRESH_TOKEN_TTL_SECONDS = 60 * 60;

function sign(body: string): string {
  return createHmac('sha256', config.authSecret).update(body).digest('base64url');
}

function encodePayload(payload: TokenPayload): string {
  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
}

/**
 * HMAC-signed mock JWT (payload.signature). Node's crypto is enough —
 * no extra JWT library for a take-home mock.
 */
export function createToken(user: AuthUser, typ: TokenType, now = Date.now()): string {
  const ttl = typ === 'access' ? ACCESS_TOKEN_TTL_SECONDS : REFRESH_TOKEN_TTL_SECONDS;
  const payload: TokenPayload = {
    sub: user.email,
    role: user.role,
    typ,
    exp: Math.floor(now / 1000) + ttl,
  };
  const body = encodePayload(payload);
  return `${body}.${sign(body)}`;
}

export function verifyToken(token: string, expectedType: TokenType, now = Date.now()): TokenPayload | null {
  const parts = token.split('.');

  if (parts.length !== 2) {
    return null;
  }

  const [body, signature] = parts;
  const expected = sign(body);

  const actualBuf = Buffer.from(signature);
  const expectedBuf = Buffer.from(expected);

  if (actualBuf.length !== expectedBuf.length || !timingSafeEqual(actualBuf, expectedBuf)) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    const payload = asTokenPayload(parsed);

    if (!payload || payload.typ !== expectedType || payload.exp * 1000 <= now) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

function asTokenPayload(value: unknown): TokenPayload | null {
  if (typeof value !== 'object' || value === null) {
    return null;
  }

  const record = value as Record<string, unknown>;
  const sub = record['sub'];
  const role = record['role'];
  const typ = record['typ'];
  const exp = record['exp'];

  if (typeof sub !== 'string' || typeof exp !== 'number') {
    return null;
  }

  if (role !== 'operator' && role !== 'viewer') {
    return null;
  }

  if (typ !== 'access' && typ !== 'refresh') {
    return null;
  }

  return { sub, role, typ, exp };
}

export function passwordsMatch(stored: string, provided: string): boolean {
  const storedBuf = Buffer.from(stored);
  const providedBuf = Buffer.from(provided);

  if (storedBuf.length !== providedBuf.length) {
    timingSafeEqual(storedBuf, storedBuf);
    return false;
  }

  return timingSafeEqual(storedBuf, providedBuf);
}
