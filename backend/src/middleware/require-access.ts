import type { RequestHandler } from 'express';
import { inspectToken } from '../auth/tokens';

/**
 * Protects catalog/metrics routes.
 *
 * Expired access tokens use code `token_expired` so the frontend interceptor
 * can refresh once. Missing/invalid tokens use `unauthorized` and must not
 * trigger that refresh path.
 */
export const requireAccessToken: RequestHandler = (req, res, next) => {
  const header = req.header('authorization');

  if (!header || !header.toLowerCase().startsWith('bearer ')) {
    res.status(401).json({ error: 'Missing access token', code: 'unauthorized' });
    return;
  }

  const token = header.slice('bearer '.length).trim();
  const result = inspectToken(token, 'access');

  if (result.status === 'expired') {
    res.status(401).json({ error: 'Access token expired', code: 'token_expired' });
    return;
  }

  if (result.status === 'invalid') {
    res.status(401).json({ error: 'Invalid access token', code: 'unauthorized' });
    return;
  }

  next();
};
