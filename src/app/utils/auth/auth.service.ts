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

    // Check both storages for auth state and related data
    const localStorageData = {
      authState: localStorage.getItem('auth_state') === 'true',
      authTime: localStorage.getItem('auth_time'),
      storageType: localStorage.getItem('storage_type'),
      lastCharacter: localStorage.getItem('last_character')
    };

    const sessionStorageData = {
      authState: sessionStorage.getItem('auth_state') === 'true',
      authTime: sessionStorage.getItem('auth_time'),
      storageType: sessionStorage.getItem('storage_type')
    };

    console.log('Initial auth state check:', {
      local: localStorageData,
      session: sessionStorageData
    });

    // Determine if we have a valid auth state
    const hasValidAuth = (localStorageData.storageType === 'local' && localStorageData.authState) ||
                        (sessionStorageData.storageType === 'session' && sessionStorageData.authState);

    if (hasValidAuth) {
      this.checkAuthStatus().subscribe({
        next: (response) => {
          console.log('Initial auth check response:', response);
          const isPersistent = localStorageData.storageType === 'local';
          
          if (response.isAuthenticated) {
            // Ensure storage is consistent
            const storage = isPersistent ? localStorage : sessionStorage;
            storage.setItem('auth_state', 'true');
            storage.setItem('auth_time', Date.now().toString());
            storage.setItem('storage_type', isPersistent ? 'local' : 'session');
          }

          this.isAuthenticatedSignal.set(response.isAuthenticated);
          this.isPersistentSession.set(isPersistent);
          this.authInitializedSignal.set(true);
        },
        error: (error) => {
          console.error('Initial auth check failed:', error);
          this.clearAuthState();
          this.authInitializedSignal.set(true);
        },
      });
    } else {
      console.log('No valid auth state found');
      this.clearAuthState();
      this.authInitializedSignal.set(true);
    }
  }

  login(consent: boolean = false): void {
    const timestamp = Date.now().toString();
    const state = this.generateState();
    const storageType = consent ? 'local' : 'session';

    // Clear any existing auth states first
    this.clearAuthState();

    // Store state in both storages to ensure it's available during callback
    localStorage.setItem('oauth_state', state);
    sessionStorage.setItem('oauth_state', state);
    
    // Store other auth data in the appropriate storage
    const storage = consent ? localStorage : sessionStorage;
    storage.setItem('auth_time', timestamp);
    storage.setItem('storage_type', storageType);

    console.log('Starting login with:', {
      consent,
      storageType,
      state,
      timestamp,
      storedStates: {
        local: localStorage.getItem('oauth_state'),
        session: sessionStorage.getItem('oauth_state')
      }
    });

    this.http
      .get<{url: string, sessionId: string}>(`${this.apiUrl}/bnet`, {
        params: {
          callback: this.frontendCallbackUrl,
          consent: consent.toString(),
          timestamp,
          state,
          storageType
        },
        withCredentials: true
      })
      .subscribe({
        next: (response) => {
          if (response.url) {
            // Store the session ID before redirect
            const storage = consent ? localStorage : sessionStorage;
            storage.setItem('session_id', response.sessionId);
            
            console.log('Redirecting to auth with:', {
              storageType,
              state,
              sessionId: response.sessionId,
              storedStates: {
                local: localStorage.getItem('oauth_state'),
                session: sessionStorage.getItem('oauth_state')
              }
            });
            window.location.href = response.url;
          } else {
            console.error('No URL received from backend');
            this.clearAuthState();
          }
        },
        error: (error) => {
          console.error('Failed to initiate auth:', error);
          this.clearAuthState();
        },
      });
  }

  handleOAuthCallback(code: string, state: string): Observable<any> {
    // Check both storages for the state and session ID
    const storedStateLocal = localStorage.getItem('oauth_state');
    const storedStateSession = sessionStorage.getItem('oauth_state');
    const storageType = localStorage.getItem('storage_type') || sessionStorage.getItem('storage_type') || 'session';
    const sessionId = localStorage.getItem('session_id') || sessionStorage.getItem('session_id');

    console.log('Handling OAuth callback:', {
      code: code ? 'present' : 'missing',
      state,
      storedStates: {
        local: storedStateLocal,
        session: storedStateSession
      },
      storageType,
      sessionId
    });

    // Check if state matches either storage
    if ((!storedStateLocal && !storedStateSession) || 
        (state !== storedStateLocal && state !== storedStateSession)) {
      console.error('State mismatch:', {
        storedStateLocal,
        storedStateSession,
        receivedState: state
      });
      return throwError(() => new Error('invalid_state'));
    }

    return this.http
      .post(
        `${this.apiUrl}/callback`,
        { code, state },
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
            'X-Storage-Type': storageType,
            'X-Session-ID': sessionId || ''
          },
        }
      )
      .pipe(
        tap((response: any) => {
          console.log('OAuth callback response:', response);
          if (response.isAuthenticated) {
            // Clear OAuth states from both storages
            localStorage.removeItem('oauth_state');
            sessionStorage.removeItem('oauth_state');

            // Store auth state in the correct storage
            const storage = response.isPersistent ? localStorage : sessionStorage;
            storage.setItem('auth_state', 'true');
            storage.setItem('auth_time', Date.now().toString());
            storage.setItem('storage_type', response.isPersistent ? 'local' : 'session');
            storage.setItem('session_id', response.sessionId || sessionId);

            // Update auth state
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

  checkAuthStatus(): Observable<{ isAuthenticated: boolean; isPersistent: boolean }> {
    const sessionId = localStorage.getItem('session_id') || sessionStorage.getItem('session_id');
    const storageType = localStorage.getItem('storage_type') || sessionStorage.getItem('storage_type');

    if (!sessionId || !storageType) {
      return of({ isAuthenticated: false, isPersistent: false });
    }

    return this.http
      .get<{ isAuthenticated: boolean; isPersistent: boolean }>(
        `${this.apiUrl}/validate`,
        {
          withCredentials: true,
          headers: {
            'X-Session-ID': sessionId,
            'X-Storage-Type': storageType
          },
        }
      )
      .pipe(
        tap(response => {
          if (response.isAuthenticated) {
            const storage = response.isPersistent ? localStorage : sessionStorage;
            storage.setItem('auth_state', 'true');
            storage.setItem('auth_time', Date.now().toString());
            storage.setItem('storage_type', response.isPersistent ? 'local' : 'session');
            storage.setItem('session_id', sessionId);
          }
          this.updateAuthState(response.isAuthenticated, response.isPersistent);
        }),
        catchError(error => {
          console.error('Auth validation failed:', error);
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

  public updateAuthState(
    isAuthenticated: boolean,
    isPersistent: boolean = false
  ) {
    console.log('Updating auth state:', { isAuthenticated, isPersistent });
    
    const storage = isPersistent ? localStorage : sessionStorage;
    
    if (isAuthenticated) {
      storage.setItem('auth_state', 'true');
      storage.setItem('auth_time', Date.now().toString());
      storage.setItem('storage_type', isPersistent ? 'local' : 'session');
    }

    // Set signals after storage is updated
    this.isPersistentSession.set(isPersistent);
    this.isAuthenticatedSignal.set(isAuthenticated);
    this.authInitializedSignal.set(true);
  }

  private clearAuthState() {
    const itemsToClear = [
      'oauth_state',
      'auth_time',
      'auth_state',
      'storage_type',
      'session_id'
    ];

    itemsToClear.forEach(item => {
      sessionStorage.removeItem(item);
      localStorage.removeItem(item);
    });

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

  // Add a method to wait for auth state to be ready
  waitForAuthReady(): Observable<boolean> {
    return new Observable<boolean>(subscriber => {
      const maxAttempts = 50; // 5 seconds maximum
      let attempts = 0;
      
      const checkAuth = setInterval(() => {
        attempts++;
        if (this.isAuthCheckComplete()) {
          subscriber.next(this.isAuthenticated());
          subscriber.complete();
          clearInterval(checkAuth);
        } else if (attempts >= maxAttempts) {
          subscriber.error(new Error('Auth check timeout'));
          clearInterval(checkAuth);
        }
      }, 100);

      return () => clearInterval(checkAuth);
    });
  }

  public resetAuth() {
    this.clearAuthState();
  }
}
