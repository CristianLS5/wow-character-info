import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../utils/auth/auth.service';
import { CharacterService } from '../../services/character.service';
import { take, map, tap, switchMap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

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
        errorDescription: params['error_description']
      })),
      tap(params => {
        console.log('OAuth Callback Params:', {
          hasCode: !!params.code,
          hasState: !!params.state,
          error: params.error,
          errorDescription: params.errorDescription
        });

        if (params.error) {
          throw new Error(params.errorDescription || params.error);
        }

        if (!params.code || !params.state) {
          throw new Error('Missing required OAuth parameters');
        }
      }),
      switchMap(params => 
        this.authService.handleOAuthCallback(params.code, params.state).pipe(
          catchError(error => {
            console.error('OAuth callback error:', error);
            throw error;
          })
        )
      ),
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
          const lastCharacter = this.characterService.getLastViewedCharacter();
          const targetRoute = lastCharacter
            ? `/${lastCharacter.realm}/${lastCharacter.name}/character`
            : '/dashboard';

          console.log('Navigation after auth:', {
            targetRoute,
            isAuthenticated: this.authService.isAuthenticated(),
            authInitialized: this.authService.isAuthCheckComplete()
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