import cors from 'cors';
import express, { type Express } from 'express';
import { config } from './config';
import { errorHandler, notFoundHandler } from './middleware/error-handler';
import { healthRouter } from './routes/health.routes';
import { servicesRouter } from './routes/services.routes';

/**
 * Builds the Express application (middleware + routes) but does not listen.
 *
 * Splitting this from `server.ts` means HTTP wiring can be imported in
 * tests later without opening a TCP port.
 */
export function createApp(): Express {
  const app = express();

  // Angular on :4200 is a different origin than this API on :4000.
  // CORS must be first so browser preflight OPTIONS requests succeed.
  app.use(
    cors({
      origin: config.corsOrigin,
    }),
  );

  app.use(express.json());

  app.use('/health', healthRouter);
  app.use('/services', servicesRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
