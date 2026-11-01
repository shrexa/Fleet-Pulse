import { Router } from 'express';

/**
 * Liveness route used by operators and later by the frontend.
 *
 * Mounted at /health so GET /health returns { status: "ok" }
 * without pulling in the 2,000-service catalog.
 */
export const healthRouter = Router();

healthRouter.get('/', (_req, res) => {
  res.json({ status: 'ok' });
});
