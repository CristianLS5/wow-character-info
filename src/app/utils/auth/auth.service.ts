import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  private frontendCallbackUrl = `${environment.frontendUrl}/auth/callback`;

  private isAuthenticatedSignal = signal(false);
  private authInitializedSignal = signal(false);
  private isPersistentSession = signal(false);

  constructor(private http: HttpClient, private router: Router) {
    this.initializeAuthState();
  }

  private initializeAuthState() {
    console.log('Initializing auth state');

    this.checkAuthStatus().subscribe({
      next: (response) => {
        console.log('Initial auth check response:', response);
        this.isAuthenticatedSignal.set(response.isAuthenticated);
        this.authInitializedSignal.set(true);
      },
      error: (error) => {
        console.error('Initial auth check failed:', error);
        this.isAuthenticatedSignal.set(false);
        this.authInitializedSignal.set(true);
      },
    });
  }

  login(consent: boolean = false): void {
    const params = new URLSearchParams({
      callback: this.frontendCallbackUrl,
      consent: consent.toString(),
    });
    window.location.href = `${this.apiUrl}/bnet?${params.toString()}`;
  }

  handleOAuthCallback(code: string, state: string): Observable<any> {
    return this.http
      .post(
        `${this.apiUrl}/callback`,
        { code, state },
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
      .pipe(
        tap((response: any) => {
          console.log('OAuth callback response:', response);
          if (response.isAuthenticated) {
            this.isAuthenticatedSignal.set(true);
          }
        }),
        catchError((error) => {
          console.error('OAuth callback error:', error);
          this.isAuthenticatedSignal.set(false);
          throw {
            error: error.error?.error || 'unknown_error',
            message: error.error?.message || 'Unknown error occurred',
            status: error.status,
          };
        })
      );
  }

  checkAuthStatus(): Observable<{ isAuthenticated: boolean; isPersistent: boolean }> {
    const sid = localStorage.getItem('sid') || sessionStorage.getItem('sid');
    const hasLocalStorage = !!localStorage.getItem('auth_state');
    const hasSessionStorage = !!sessionStorage.getItem('auth_time');

    if (!sid || (!hasLocalStorage && !hasSessionStorage)) {
      this.updateAuthState(false, false);
      return of({ isAuthenticated: false, isPersistent: false });
    }

    return this.http
      .get<{ isAuthenticated: boolean; isPersistent: boolean }>(
        `${this.apiUrl}/validate`,
        {
          withCredentials: true,
          headers: {
            'X-Session-ID': sid,
            'X-Storage-Type': hasLocalStorage ? 'local' : 'session'
          }
        }
      )
      .pipe(
        tap((response) => {
          this.updateAuthState(response.isAuthenticated, response.isPersistent);
        }),
        catchError(() => {
          this.clearAuthState();
          return of({ isAuthenticated: false, isPersistent: false });
        })
      );
  }

  logout(): Observable<any> {
    return this.http
      .post(`${this.apiUrl}/logout`, {}, { withCredentials: true })
      .pipe(
        tap(() => {
          this.isAuthenticatedSignal.set(false);
        })
      );
  }

  isAuthenticated(): boolean {
    return this.isAuthenticatedSignal();
  }

  isAuthInitialized(): Observable<boolean> {
    if (this.authInitializedSignal()) {
      return of(true);
    }

    return new Observable<boolean>((subscriber) => {
      const checkInterval = setInterval(() => {
        if (this.authInitializedSignal()) {
          subscriber.next(true);
          subscriber.complete();
          clearInterval(checkInterval);
        }
      }, 50);

      return () => clearInterval(checkInterval);
    });
  }

  private updateAuthState(isAuthenticated: boolean, isPersistent: boolean = false) {
    const hasLocalStorage = !!localStorage.getItem('auth_state');
    const hasSessionStorage = !!sessionStorage.getItem('auth_time');

    if (isPersistent && !hasLocalStorage) {
      isAuthenticated = false;
    } else if (!isPersistent && !hasSessionStorage) {
      isAuthenticated = false;
    }

    this.isAuthenticatedSignal.set(isAuthenticated);
    this.isPersistentSession.set(isPersistent);
  }

  private clearAuthState() {
    sessionStorage.removeItem('sid');
    sessionStorage.removeItem('auth_time');
    localStorage.removeItem('sid');
    localStorage.removeItem('auth_state');
    localStorage.removeItem('auth_time');
    this.isAuthenticatedSignal.set(false);
    this.isPersistentSession.set(false);
  }

  isPersistent(): boolean {
    return this.isPersistentSession();
  }
}
