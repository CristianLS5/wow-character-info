import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
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
    const timestamp = Date.now().toString();
    const state = this.generateState();
    const storageType = consent ? 'local' : 'session';

    // Store state and timestamp in the appropriate storage
    if (consent) {
      localStorage.setItem('auth_time', timestamp);
      localStorage.setItem('oauth_state', state);
    } else {
      sessionStorage.setItem('auth_time', timestamp);
      sessionStorage.setItem('oauth_state', state);
    }

    // Store storage type preference
    sessionStorage.setItem('auth_storage_type', storageType);

    this.http
      .get(`${this.apiUrl}/bnet`, {
        params: {
          callback: this.frontendCallbackUrl,
          consent: consent.toString(),
          timestamp,
          state,
        },
        withCredentials: true
      })
      .subscribe({
        next: (response: any) => {
          if (response.url) {
            console.log('Redirecting to:', response.url);
            window.location.href = response.url;
          } else {
            console.error('No URL received from backend');
          }
        },
        error: (error) => {
          console.error('Failed to initiate auth:', error);
          this.clearAuthState();
        },
      });
  }

  handleOAuthCallback(code: string, state: string): Observable<any> {
    const storageType = sessionStorage.getItem('auth_storage_type') || 'session';
    const storedState = storageType === 'local' 
      ? localStorage.getItem('oauth_state')
      : sessionStorage.getItem('oauth_state');

    console.log('Handling OAuth callback:', {
      code: code ? 'present' : 'missing',
      state,
      storedState,
      storageType
    });

    if (!storedState || storedState !== state) {
      console.error('State mismatch:', { storedState, receivedState: state });
      return throwError(() => new Error('invalid_state'));
    }

    return this.http
      .post(
        `${this.apiUrl}/callback`,
        {
          code,
          state,
          storageType
        },
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
            'X-Storage-Type': storageType
          },
        }
      )
      .pipe(
        tap((response: any) => {
          console.log('OAuth callback response:', response);
          if (response.isAuthenticated) {
            // Clear OAuth states
            sessionStorage.removeItem('oauth_state');
            localStorage.removeItem('oauth_state');
            sessionStorage.removeItem('auth_storage_type');

            this.updateAuthState(
              response.isAuthenticated,
              response.isPersistent
            );
          }
        }),
        catchError((error) => {
          console.error('OAuth Exchange Error:', error);
          this.clearAuthState();
          throw error;
        })
      );
  }

  checkAuthStatus(): Observable<{
    isAuthenticated: boolean;
    isPersistent: boolean;
  }> {
    const sid = localStorage.getItem('sid') || sessionStorage.getItem('sid');
    const hasLocalStorage = !!localStorage.getItem('auth_state');
    const hasSessionStorage = !!sessionStorage.getItem('auth_time');
    const storageType = hasLocalStorage ? 'local' : 'session';

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
            'X-Storage-Type': storageType,
          },
        }
      )
      .pipe(
        tap((response) => {
          console.log('Auth status response:', response);
          this.updateAuthState(response.isAuthenticated, response.isPersistent);

          // Update storage if needed
          if (
            response.isAuthenticated &&
            response.isPersistent &&
            !hasLocalStorage
          ) {
            this.storeSessionData(sid, true);
          }
        }),
        catchError((error) => {
          console.error('Auth status check failed:', error);
          if (error.status === 401) {
            // Token expired or invalid, clear state
            this.clearAuthState();
          }
          return of({ isAuthenticated: false, isPersistent: false });
        })
      );
  }

  logout(): Observable<any> {
    return this.http
      .post(`${this.apiUrl}/logout`, {}, { withCredentials: true })
      .pipe(
        tap(() => {
          this.clearAuthState();
        }),
        catchError((error) => {
          console.error('Logout failed:', error);
          // Clear state anyway
          this.clearAuthState();
          throw error;
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

  isAuthCheckComplete(): boolean {
    return this.authInitializedSignal();
  }

  getAuthInitializedSignal() {
    return this.authInitializedSignal;
  }

  private updateAuthState(
    isAuthenticated: boolean,
    isPersistent: boolean = false
  ) {
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
    sessionStorage.removeItem('oauth_state');
    localStorage.removeItem('oauth_state');
    sessionStorage.removeItem('auth_time');
    localStorage.removeItem('auth_time');
    sessionStorage.removeItem('auth_storage_type');
    this.isAuthenticatedSignal.set(false);
    this.isPersistentSession.set(false);
  }

  isPersistent(): boolean {
    return this.isPersistentSession();
  }

  private storeSessionData(sessionId: string, isPersistent: boolean = false) {
    if (isPersistent) {
      localStorage.setItem('sid', sessionId);
      localStorage.setItem('auth_state', 'true');
      localStorage.setItem('auth_time', Date.now().toString());
    } else {
      sessionStorage.setItem('sid', sessionId);
      sessionStorage.setItem('auth_time', Date.now().toString());
    }

    this.isPersistentSession.set(isPersistent);
    this.isAuthenticatedSignal.set(true);
  }

  private generateState(): string {
    const array = new Uint8Array(16);
    window.crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join(
      ''
    );
  }
}
