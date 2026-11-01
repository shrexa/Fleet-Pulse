import type { ErrorRequestHandler, RequestHandler } from 'express';

/**
 * Catch-all for paths that matched no route.
 *
 * Must be registered after the real routers. Without this, Express would
 * send an HTML 404, which is awkward for an API the dashboard will call.
 */
export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    path: req.path,
  });
};

/**
 * Express error middleware — the four-argument signature is required.
 *
 * Express only treats a function as an error handler when it has
 * (err, req, res, next). `_next` is unused on purpose so we still
 * keep that fourth parameter.
 */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  const detail = err instanceof Error ? err.message : 'Unknown error';

  console.error(err);

  res.status(500).json({
    error: 'Internal Server Error',
    ...(process.env.NODE_ENV === 'production' ? {} : { detail }),
  });
};
