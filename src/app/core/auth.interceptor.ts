import {
  HttpContextToken,
  HttpErrorResponse,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { Auth } from '../features/auth/auth';

/** Marks a request that already went through one refresh+retry cycle. */
export const AUTH_RETRIED = new HttpContextToken(() => false);

/**
 * Attaches Bearer tokens and coordinates a single refresh on token_expired.
 *
 * Login/refresh URLs are skipped so the refresh call cannot recurse into
 * this interceptor's 401 handler.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(Auth);
  const router = inject(Router);

  if (isAuthCredentialRequest(req.url)) {
    return next(req);
  }

  const authorized = withAccessToken(req, auth.accessToken());

  return next(authorized).pipe(
    catchError((err: unknown) => {
      if (!(err instanceof HttpErrorResponse) || !isTokenExpiredError(err) || authorized.context.get(AUTH_RETRIED)) {
        return throwError(() => err);
      }

      return auth.refresh().pipe(
        catchError((refreshErr: unknown) => {
          auth.logout();
          void router.navigateByUrl('/login');
          return throwError(() => refreshErr);
        }),
        switchMap(() =>
          next(
            withAccessToken(
              authorized.clone({ context: authorized.context.set(AUTH_RETRIED, true) }),
              auth.accessToken(),
            ),
          ),
        ),
      );
    }),
  );
};

function isAuthCredentialRequest(url: string): boolean {
  return url.includes('/auth/login') || url.includes('/auth/refresh');
}

function withAccessToken<T>(req: HttpRequest<T>, token: string | null): HttpRequest<T> {
  if (!token) {
    return req;
  }

  return req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });
}

function isTokenExpiredError(err: HttpErrorResponse): boolean {
  if (err.status !== 401 || typeof err.error !== 'object' || err.error === null) {
    return false;
  }

  return (err.error as Record<string, unknown>)['code'] === 'token_expired';
}
