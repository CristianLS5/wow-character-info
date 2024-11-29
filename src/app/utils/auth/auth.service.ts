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
  private bnetCallbackUrl = environment.authCallbackUrl;

  private isAuthenticatedSignal = signal(false);
  private authCheckComplete = signal(false);
  private isPersistentSession = signal(false);
  public readonly authInitializedSignal = signal(false);

  constructor(private http: HttpClient, private router: Router) {
    this.initializeAuthState();
  }

  private initializeAuthState() {
    console.log('Initializing auth state');

    const hasLocalStorage = !!localStorage.getItem('auth_state');
    const sid = localStorage.getItem('sid') || sessionStorage.getItem('sid');

    if (hasLocalStorage && sid) {
      this.validateStoredSession(sid, true).subscribe({
        next: (response) => {
          if (response.isAuthenticated) {
            sessionStorage.setItem('auth_time', Date.now().toString());
            sessionStorage.setItem('sid', sid);
          } else {
            this.clearAuthState();
          }
          this.updateAuthState(response.isAuthenticated, response.isPersistent);
          this.authInitializedSignal.set(true);
          this.authCheckComplete.set(true);
        },
        error: () => {
          this.clearAuthState();
          this.authInitializedSignal.set(true);
          this.authCheckComplete.set(true);
        },
      });
    } else {
      this.checkAuthStatus().subscribe({
        next: (response) => {
          console.log('Initial auth check response:', {
            isAuthenticated: response,
            isPersistent: this.isPersistent(),
            isNewTab: this.isNewTab(),
          });
          this.authInitializedSignal.set(true);
          this.authCheckComplete.set(true);
        },
        error: (error) => {
          console.error('Initial auth check failed:', error);
          this.updateAuthState(false, false);
          this.authInitializedSignal.set(true);
          this.authCheckComplete.set(true);
        },
      });
    }
  }

  private validateStoredSession(
    sid: string,
    isPersistent: boolean
  ): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/validate-session`,
      {
        sid,
        persistentSession: isPersistent,
      },
      {
        withCredentials: true,
        headers: { 'X-Session-ID': sid },
      }
    );
  }

  private updateAuthState(
    isAuthenticated: boolean,
    isPersistent: boolean = false
  ) {
    const hasLocalStorage = !!localStorage.getItem('auth_state');
    const hasSessionStorage = !!sessionStorage.getItem('auth_time');

    console.log('Updating auth state:', {
      isAuthenticated,
      isPersistent,
      hasSessionStorage,
      hasLocalStorage,
    });

    // Only set authenticated if storage matches persistence type
    if (isPersistent && !hasLocalStorage) {
      isAuthenticated = false;
    } else if (!isPersistent && !hasSessionStorage) {
      isAuthenticated = false;
    }

    this.isAuthenticatedSignal.set(isAuthenticated);
    this.isPersistentSession.set(isPersistent);
  }

  // Update the auth-callback component to store SID properly
  public handleAuthCallback(
    sid: string,
    isPersistent: boolean
  ): Observable<any> {
    // Store SID in appropriate storage
    if (isPersistent) {
      localStorage.setItem('sid', sid);
      localStorage.setItem('auth_state', 'true');
      localStorage.setItem('auth_time', Date.now().toString());
    }
    sessionStorage.setItem('sid', sid);
    sessionStorage.setItem('auth_time', Date.now().toString());

    return this.validateStoredSession(sid, isPersistent);
  }

  login(consent: boolean = false): void {
    const params = new URLSearchParams({
      callback: this.frontendCallbackUrl,
      consent: consent.toString(),
    });

    console.log('Starting OAuth flow:', {
      frontendCallback: this.frontendCallbackUrl,
      apiUrl: this.apiUrl,
      bnetCallback: this.bnetCallbackUrl,
      timestamp: new Date().toISOString(),
    });

    // Redirect to our backend auth endpoint
    window.location.href = `${this.apiUrl}/bnet?${params.toString()}`;
  }

  private logAuthEvent(event: string, data: any) {
    console.group(`🔐 Auth Event: ${event}`);
    console.log('Timestamp:', new Date().toISOString());
    console.log('Data:', data);
    console.groupEnd();
  }

  handleCallback(sid: string, persistentSession: boolean): Observable<any> {
    this.logAuthEvent('Handle Callback Started', {
      sid: sid ? '***' : 'none',
      persistentSession,
      currentAuthState: this.isAuthenticated(),
      storage: {
        hasLocalStorage: !!localStorage.getItem('auth_state'),
        hasSessionStorage: !!sessionStorage.getItem('auth_time'),
      },
    });

    return this.http
      .post<{ isAuthenticated: boolean; isPersistent: boolean }>(
        `${this.apiUrl}/validate-session`,
        { sid, persistentSession },
        { withCredentials: true }
      )
      .pipe(
        tap((response) => {
          this.logAuthEvent('Session Validation Response', {
            response,
            persistentSession,
            storage: {
              hasLocalStorage: !!localStorage.getItem('auth_state'),
              hasSessionStorage: !!sessionStorage.getItem('auth_time'),
            },
          });
        })
      );
  }

  handleOAuthCallback(code: string, state: string): Observable<any> {
    return this.http
      .post(
        `${this.apiUrl}/auth/callback`,
        { code, state },
        { withCredentials: true }
      )
      .pipe(
        tap((response: any) => {
          if (response.isAuthenticated) {
            sessionStorage.setItem('auth_time', Date.now().toString());
            if (response.isPersistent) {
              localStorage.setItem('auth_state', 'true');
              localStorage.setItem('auth_time', Date.now().toString());
            }
          }
          this.updateAuthState(response.isAuthenticated, response.isPersistent);
        })
      );
  }

  checkAuthStatus(): Observable<boolean> {
    const sid = sessionStorage.getItem('sid');
    const hasLocalStorage = !!localStorage.getItem('auth_state');
    const hasSessionStorage = !!sessionStorage.getItem('auth_time');

    // If no storage exists, not authenticated
    if (!sid || (!hasLocalStorage && !hasSessionStorage)) {
      this.updateAuthState(false, false);
      return of(false);
    }

    return this.http
      .get<{ isAuthenticated: boolean; isPersistent: boolean }>(
        `${this.apiUrl}/validate`,
        {
          withCredentials: true,
          headers: {
            'X-Session-ID': sid,
            'X-Storage-Type': hasLocalStorage ? 'local' : 'session',
          },
        }
      )
      .pipe(
        tap((response) => {
          console.log('Auth status response:', response);
          this.updateAuthState(response.isAuthenticated, response.isPersistent);
        }),
        map((response) => response.isAuthenticated),
        catchError(() => {
          this.clearAuthState();
          return of(false);
        })
      );
  }

  logout(): Observable<any> {
    return this.http
      .post(`${this.apiUrl}/logout`, {}, { withCredentials: true })
      .pipe(
        tap(() => {
          this.clearAuthState();
        })
      );
  }

  isAuthenticated() {
    return this.isAuthenticatedSignal();
  }

  isAuthCheckComplete() {
    return this.authCheckComplete();
  }

  updateConsent(consent: boolean): Observable<any> {
    return this.http
      .post(
        `${this.apiUrl}/update-consent`,
        { consent },
        { withCredentials: true }
      )
      .pipe(
        tap(() => {
          const timestamp = Date.now().toString();
          if (consent) {
            localStorage.setItem('auth_state', 'true');
            localStorage.setItem('auth_time', timestamp);
            this.isPersistentSession.set(true);
          } else {
            localStorage.removeItem('auth_state');
            localStorage.removeItem('auth_time');
            sessionStorage.setItem('auth_time', timestamp);
            this.isPersistentSession.set(false);
          }
        })
      );
  }

  private clearAuthState() {
    sessionStorage.removeItem('sid');
    sessionStorage.removeItem('auth_time');
    localStorage.removeItem('auth_state');
    localStorage.removeItem('auth_time');
    this.isAuthenticatedSignal.set(false);
    this.isPersistentSession.set(false);
  }

  isPersistent() {
    return !!localStorage.getItem('auth_state');
  }

  private isNewTab(): boolean {
    if (this.isPersistent()) {
      return !localStorage.getItem('auth_state');
    }
    return !sessionStorage.getItem('auth_time');
  }

  private hasValidStorage(): boolean {
    const hasLocalStorage = !!localStorage.getItem('auth_state');
    const hasSessionStorage = !!sessionStorage.getItem('auth_time');

    console.log('Storage check:', {
      hasLocalStorage,
      hasSessionStorage,
      isPersistent: this.isPersistentSession(),
    });

    return this.isPersistentSession() ? hasLocalStorage : hasSessionStorage;
  }

  isAuthInitialized(): Observable<boolean> {
    if (this.authInitializedSignal()) {
      return of(true);
    }

    // Wait for initialization to complete
    return new Observable<boolean>((subscriber) => {
      const checkInterval = setInterval(() => {
        if (this.authInitializedSignal()) {
          subscriber.next(true);
          subscriber.complete();
          clearInterval(checkInterval);
        }
      }, 50);

      // Cleanup
      return () => clearInterval(checkInterval);
    });
  }
}
