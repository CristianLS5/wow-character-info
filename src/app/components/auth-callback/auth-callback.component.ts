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
  
    const urlParams = new URLSearchParams(window.location.search);
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

    if (code && state) {
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
          console.error('GET callback failed:', error);
          throw error;
        })
      ).subscribe({
        next: (response: any) => {
          console.log('Auth callback response:', response);
          
          if (response.isAuthenticated) {
            // Store the new session data
            const storage = response.isPersistent ? localStorage : sessionStorage;
            storage.setItem('auth_state', 'true');
            storage.setItem('auth_time', Date.now().toString());
            storage.setItem('storage_type', response.isPersistent ? 'local' : 'session');
            storage.setItem('session_id', response.sessionId);

            // Clear oauth state
            localStorage.removeItem('oauth_state');
            sessionStorage.removeItem('oauth_state');

            // Update auth state in service
            this.authService.updateAuthState(true, response.isPersistent);

            // Navigate to appropriate route
            const lastCharacter = this.characterService.getLastViewedCharacter();
            const targetRoute = lastCharacter
              ? `/${lastCharacter.realm}/${lastCharacter.name}/character`
              : '/dashboard';

            console.log('Navigation after auth:', {
              targetRoute,
              isAuthenticated: true,
              sessionId: response.sessionId,
              storageType: response.storageType || storageType
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
    } else {
      const error = urlParams.get('error');
      this.handleAuthError(urlParams.get('message') || error || 'Missing required OAuth parameters');
    }
  }

  private handleAuthError(message: string) {
    console.error('Auth error:', message);
    this.router.navigate(['/'], {
      queryParams: {
        error: 'auth_failed',
        message
      }
    });
  }
}