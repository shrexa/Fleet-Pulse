export type UserRole = 'operator' | 'viewer';

export interface AuthUser {
  email: string;
  role: UserRole;
}

export interface AuthTokenResponse {
  accessToken: string;
  refreshToken: string;
  /** Access-token lifetime in seconds. 60s so a later chunk can demo refresh. */
  expiresIn: number;
  user: AuthUser;
}

export type TokenType = 'access' | 'refresh';

export interface TokenPayload {
  sub: string;
  role: UserRole;
  typ: TokenType;
  exp: number;
}
