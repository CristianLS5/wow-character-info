import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../utils/auth/auth.service';
import { CharacterService } from '../../services/character.service';
import { take, map, tap, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-auth-callback',
  standalone: true,
  imports: [],
  templateUrl: './auth-callback.component.html',
})
export class AuthCallbackComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private characterService: CharacterService
  ) { }

  ngOnInit() {
    console.log('Auth Callback Initialization');
  
    this.route.queryParams.pipe(
      take(1),
      map(params => ({
        code: params['code'],
        state: params['state'],
        error: params['error'],
        errorDescription: params['error_description'],
        timestamp: new Date().toISOString()
      })),
      tap(params => {
        console.log('Received OAuth Callback:', {
          code: params.code ? 'present' : 'missing',
          state: params.state ? 'present' : 'missing',
          error: params.error,
          errorDescription: params.errorDescription,
          timestamp: params.timestamp,
          authTime: sessionStorage.getItem('auth_time')
        });

        if (params.error) {
          throw new Error(params.errorDescription || params.error);
        }

        if (!params.code || !params.state) {
          throw new Error('Missing required OAuth parameters');
        }

        return params;
      }),
      switchMap(params => this.authService.handleOAuthCallback(params.code, params.state))
    ).subscribe({
      next: (response) => {
        if (response.isAuthenticated) {
          const lastCharacter = this.characterService.getLastViewedCharacter();
          const targetRoute = lastCharacter
            ? `/${lastCharacter.realm}/${lastCharacter.name}/character`
            : '/dashboard';
          this.router.navigate([targetRoute]);
        } else {
          this.handleAuthError('Authentication failed');
        }
      },
      error: (error) => {
        console.error('OAuth Exchange Error:', error);
        this.handleAuthError(error.message || 'OAuth exchange failed');
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