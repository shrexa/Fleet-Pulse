import { Router } from 'express';
import { createMetricsSnapshot } from '../data/metrics.data';

/**
 * Snapshot endpoint: current measurements for every service.
 *
 * Mounted at /metrics so GET /metrics/snapshot returns one timestamped
 * batch. Each metrics[].serviceId maps 1:1 to GET /services[].id.
 */
export const metricsRouter = Router();

metricsRouter.get('/snapshot', (_req, res) => {
  res.status(200).json(createMetricsSnapshot());
});
