import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../utils/auth/auth.service';
import { CharacterService } from '../../services/character.service';
import { take, map, tap, switchMap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-auth-callback',
  standalone: true,
  imports: [],
  templateUrl: './auth-callback.component.html',
})
export class AuthCallbackComponent implements OnInit {
  private apiUrl = `${environment.apiUrl}/auth`;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private characterService: CharacterService,
    private http: HttpClient
  ) { }

  ngOnInit() {
    console.log('Auth Callback Initialization');
  
    // First check if we're on an error redirect
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    if (error) {
      console.error('Auth error from URL:', {
        error,
        message: urlParams.get('message')
      });
      this.handleAuthError(urlParams.get('message') || error);
      return;
    }

    // Get code and state directly from URL first
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const sessionId = localStorage.getItem('session_id') || sessionStorage.getItem('session_id');
    const storageType = localStorage.getItem('storage_type') || sessionStorage.getItem('storage_type');

    console.log('Initial callback params:', {
      code,
      state,
      sessionId,
      storageType,
      storedState: {
        local: localStorage.getItem('oauth_state'),
        session: sessionStorage.getItem('oauth_state')
      }
    });

    if (!code || !state) {
      this.handleAuthError('Missing required OAuth parameters');
      return;
    }

    // Try direct callback first
    this.http.get(`${this.apiUrl}/callback`, {
      params: { code, state },
      withCredentials: true,
      headers: {
        'X-Session-ID': sessionId || '',
        'X-Storage-Type': storageType || 'session'
      }
    }).pipe(
      catchError(error => {
        console.error('GET callback failed, trying POST:', error);
        return this.authService.handleOAuthCallback(code, state);
      }),
      switchMap(response => {
        if (response.isAuthenticated) {
          return this.authService.waitForAuthReady().pipe(
            map(() => response)
          );
        }
        return of(response);
      })
    ).subscribe({
      next: (response) => {
        if (response.isAuthenticated) {
          const storage = response.isPersistent ? localStorage : sessionStorage;
          storage.setItem('session_id', response.sessionId);
          storage.setItem('storage_type', response.storageType);
          
          const lastCharacter = this.characterService.getLastViewedCharacter();
          const targetRoute = lastCharacter
            ? `/${lastCharacter.realm}/${lastCharacter.name}/character`
            : '/dashboard';

          console.log('Navigation after auth:', {
            targetRoute,
            isAuthenticated: this.authService.isAuthenticated(),
            authInitialized: this.authService.isAuthCheckComplete(),
            sessionId: response.sessionId,
            storageType: response.storageType
          });

          this.router.navigate([targetRoute]);
        } else {
          this.handleAuthError('Authentication failed');
        }
      },
      error: (error) => {
        console.error('Auth callback error:', error);
        this.handleAuthError(error.message || 'Authentication failed');
      }
    });
  }

  private handleAuthError(message: string) {
    this.router.navigate(['/'], {
      queryParams: {
        error: 'auth_failed',
        message
      }
    });
  }
}