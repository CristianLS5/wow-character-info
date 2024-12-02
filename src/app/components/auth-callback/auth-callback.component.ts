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
  
    this.route.queryParams.pipe(
      take(1),
      map(params => ({
        code: params['code'],
        state: params['state'],
        error: params['error'],
        errorDescription: params['error_description']
      })),
      tap(params => {
        console.log('OAuth Callback Params:', {
          hasCode: !!params.code,
          hasState: !!params.state,
          error: params.error,
          errorDescription: params.errorDescription,
          storedState: {
            local: localStorage.getItem('oauth_state'),
            session: sessionStorage.getItem('oauth_state')
          }
        });

        if (params.error) {
          throw new Error(params.errorDescription || params.error);
        }
      }),
      switchMap(params => {
        if (!params.code || !params.state) {
          // If no code/state, try to get them from the URL
          const urlParams = new URLSearchParams(window.location.search);
          const code = urlParams.get('code');
          const state = urlParams.get('state');
          
          if (!code || !state) {
            throw new Error('Missing required OAuth parameters');
          }
          
          return this.http.get(`${this.apiUrl}/callback`, {
            params: {
              code,
              state
            },
            withCredentials: true,
            headers: {
              'X-Storage-Type': localStorage.getItem('storage_type') || sessionStorage.getItem('storage_type') || 'session'
            }
          });
        }
        
        return this.authService.handleOAuthCallback(params.code, params.state);
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