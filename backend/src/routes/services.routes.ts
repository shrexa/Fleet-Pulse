import { Router } from 'express';
import { SERVICE_CATALOG } from '../data/services.data';

/**
 * Catalog endpoint for Chunk 2B.
 *
 * Reads the precomputed SERVICE_CATALOG instead of calling generateServices()
 * on every request. The generator already ran once at module load, so this
 * handler is a JSON response of that in-memory array.
 *
 * The assignment requires the full 2,000-row list in one response, so this
 * route does not paginate, filter, or attach metrics.
 *
 * TypeScript types disappear at runtime. The response shape is guaranteed
 * because generateServices() only constructs FleetService fields (id, name,
 * team, status) and we return that array unchanged.
 */
export const servicesRouter = Router();

servicesRouter.get('/', (_req, res) => {
  res.status(200).json(SERVICE_CATALOG);
});
