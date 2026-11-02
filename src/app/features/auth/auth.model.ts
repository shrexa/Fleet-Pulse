export type UserRole = 'operator' | 'viewer';

export interface AuthUser {
  email: string;
  role: UserRole;
}

export interface AuthTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: AuthUser;
}
