/**
 * Base URL for the Fleet Pulse mock API.
 *
 * Kept in one place so a later environment (Docker, staging) can change
 * host/port without hunting through HttpClient calls.
 */
export const API_BASE_URL = 'http://localhost:4000';
