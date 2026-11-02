import type { UserRole } from '../types/auth';

/**
 * In-memory test accounts for the take-home.
 *
 * Passwords are plain text on purpose: this is a mock, not a production
 * user store. A real system would hash passwords and keep them in a DB.
 */
export interface TestUser {
  email: string;
  password: string;
  role: UserRole;
}

export const TEST_USERS: readonly TestUser[] = [
  { email: 'operator@pulse.dev', password: 'pulse123', role: 'operator' },
  { email: 'viewer@pulse.dev', password: 'pulse123', role: 'viewer' },
];

export function findUserByEmail(email: string): TestUser | undefined {
  const normalized = email.trim().toLowerCase();
  return TEST_USERS.find((user) => user.email === normalized);
}
