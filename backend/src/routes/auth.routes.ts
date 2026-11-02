import { Router } from 'express';
import {
  ACCESS_TOKEN_TTL_SECONDS,
  createToken,
  passwordsMatch,
  verifyToken,
} from '../auth/tokens';
import { findUserByEmail } from '../data/users.data';
import type { AuthTokenResponse, AuthUser } from '../types/auth';

/**
 * Mock auth routes.
 *
 * POST /auth/login issues short-lived access tokens (60s) plus a refresh
 * token. POST /auth/refresh exists so the login response is actually usable
 * after expiry. Catalog and metrics routes require a Bearer access token.
 */
export const authRouter = Router();

function issueTokens(user: AuthUser): AuthTokenResponse {
  return {
    accessToken: createToken(user, 'access'),
    refreshToken: createToken(user, 'refresh'),
    expiresIn: ACCESS_TOKEN_TTL_SECONDS,
    user,
  };
}

function parseCredentialBody(body: unknown): { email: string; password: string } | null {
  if (typeof body !== 'object' || body === null) {
    return null;
  }

  const record = body as Record<string, unknown>;
  const email = record['email'];
  const password = record['password'];

  if (typeof email !== 'string' || typeof password !== 'string') {
    return null;
  }

  const trimmedEmail = email.trim();
  const trimmedPassword = password.trim();

  if (trimmedEmail === '' || trimmedPassword === '') {
    return null;
  }

  return { email: trimmedEmail, password: trimmedPassword };
}

authRouter.post('/login', (req, res) => {
  const credentials = parseCredentialBody(req.body);

  if (!credentials) {
    res.status(400).json({ error: 'email and password are required' });
    return;
  }

  const user = findUserByEmail(credentials.email);

  // Same 401 for unknown email and bad password so callers cannot probe accounts.
  if (!user || !passwordsMatch(user.password, credentials.password)) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }

  res.status(200).json(
    issueTokens({
      email: user.email,
      role: user.role,
    }),
  );
});

/**
 * Rotates tokens from a valid refresh token.
 * Needed because access tokens expire in 60 seconds.
 */
authRouter.post('/refresh', (req, res) => {
  if (typeof req.body !== 'object' || req.body === null) {
    res.status(400).json({ error: 'refreshToken is required' });
    return;
  }

  const refreshToken = (req.body as Record<string, unknown>)['refreshToken'];

  if (typeof refreshToken !== 'string' || refreshToken.trim() === '') {
    res.status(400).json({ error: 'refreshToken is required' });
    return;
  }

  const payload = verifyToken(refreshToken.trim(), 'refresh');

  if (!payload) {
    res.status(401).json({ error: 'Invalid or expired refresh token' });
    return;
  }

  res.status(200).json(
    issueTokens({
      email: payload.sub,
      role: payload.role,
    }),
  );
});
