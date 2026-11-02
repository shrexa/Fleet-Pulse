import { HttpClient } from '@angular/common/http';
import { Service, computed, inject, signal } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, finalize, shareReplay, tap } from 'rxjs/operators';
import { API_BASE_URL } from '../../core/api.config';
import { AuthTokenResponse, AuthUser } from './auth.model';

const ACCESS_STORAGE_KEY = 'fleet-pulse.accessToken';
const REFRESH_STORAGE_KEY = 'fleet-pulse.refreshToken';
const USER_STORAGE_KEY = 'fleet-pulse.user';

/**
 * Mock session store.
 *
 * sessionStorage survives a page refresh in this tab (so the guard can
 * restore the user) and clears when the tab closes. It is NOT safe against
 * XSS: any script on this origin can read the tokens. That is acceptable
 * for this take-home mock, not for a production auth system.
 */
@Service()
export class Auth {
  private readonly http = inject(HttpClient);

  private readonly userState = signal<AuthUser | null>(readStoredUser());
  private readonly accessTokenState = signal<string | null>(sessionStorage.getItem(ACCESS_STORAGE_KEY));
  private readonly refreshTokenState = signal<string | null>(sessionStorage.getItem(REFRESH_STORAGE_KEY));
  private refreshInFlight$: Observable<AuthTokenResponse> | null = null;

  readonly user = this.userState.asReadonly();
  readonly accessToken = this.accessTokenState.asReadonly();
  readonly isAuthenticated = computed(() => this.accessTokenState() !== null && this.userState() !== null);

  login(email: string, password: string): Observable<AuthTokenResponse> {
    return this.http
      .post<AuthTokenResponse>(`${API_BASE_URL}/auth/login`, { email, password })
      .pipe(tap((session) => this.persistSession(session)));
  }

  /**
   * Shares one POST /auth/refresh across concurrent 401s.
   *
   * The first caller creates refreshInFlight$; later callers subscribe to
   * the same observable (shareReplay). finalize() clears it so a later
   * expiry can refresh again.
   */
  refresh(): Observable<AuthTokenResponse> {
    if (this.refreshInFlight$) {
      return this.refreshInFlight$;
    }

    const refreshToken = this.refreshTokenState();

    if (!refreshToken) {
      this.clearSession();
      return throwError(() => new Error('No refresh token'));
    }

    this.refreshInFlight$ = this.http
      .post<AuthTokenResponse>(`${API_BASE_URL}/auth/refresh`, { refreshToken })
      .pipe(
        tap((session) => this.persistSession(session)),
        catchError((err: unknown) => {
          this.clearSession();
          return throwError(() => err);
        }),
        finalize(() => {
          this.refreshInFlight$ = null;
        }),
        shareReplay(1),
      );

    return this.refreshInFlight$;
  }

  logout(): void {
    this.clearSession();
  }

  private persistSession(session: AuthTokenResponse): void {
    sessionStorage.setItem(ACCESS_STORAGE_KEY, session.accessToken);
    sessionStorage.setItem(REFRESH_STORAGE_KEY, session.refreshToken);
    sessionStorage.setItem(USER_STORAGE_KEY, JSON.stringify(session.user));
    this.accessTokenState.set(session.accessToken);
    this.refreshTokenState.set(session.refreshToken);
    this.userState.set(session.user);
  }

  private clearSession(): void {
    sessionStorage.removeItem(ACCESS_STORAGE_KEY);
    sessionStorage.removeItem(REFRESH_STORAGE_KEY);
    sessionStorage.removeItem(USER_STORAGE_KEY);
    this.accessTokenState.set(null);
    this.refreshTokenState.set(null);
    this.userState.set(null);
  }
}

function readStoredUser(): AuthUser | null {
  const raw = sessionStorage.getItem(USER_STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(raw);

    if (typeof parsed !== 'object' || parsed === null) {
      return null;
    }

    const record = parsed as Record<string, unknown>;
    const email = record['email'];
    const role = record['role'];

    if (typeof email !== 'string' || (role !== 'operator' && role !== 'viewer')) {
      return null;
    }

    return { email, role };
  } catch {
    return null;
  }
}
