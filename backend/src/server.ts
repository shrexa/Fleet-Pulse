import { createApp } from './app';
import { config } from './config';

/**
 * Process entry point.
 *
 * `app.ts` only describes HTTP behavior. This file binds that app to a
 * port so Node actually starts serving traffic.
 */
const app = createApp();

app.listen(config.port, () => {
  console.log(`Fleet Pulse API listening on http://localhost:${config.port}`);
});
