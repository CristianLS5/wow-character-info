import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../utils/auth/auth.service';
import { CharacterService } from '../../services/character.service';

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
  ) {}

  ngOnInit() {
    console.group('� Auth Callback Initialization');
    console.time('authCallback');

    this.route.queryParams.subscribe((params) => {
      console.log('Received OAuth Callback:', {
        code: params['code'] ? 'present' : 'missing',
        state: params['state'] ? 'present' : 'missing',
        error: params['error'],
        timestamp: new Date().toISOString(),
      });

      const code = params['code'];
      const state = params['state'];
      const error = params['error'];

      if (error) {
        console.error('OAuth Error:', error);
        this.router.navigate(['/'], {
          queryParams: { error: 'oauth_error', message: error },
        });
        return;
      }

      if (!code || !state) {
        console.warn('Missing required OAuth parameters');
        this.router.navigate(['/'], {
          queryParams: {
            error: 'missing_params',
            message: 'Missing required OAuth parameters',
          },
        });
        return;
      }

      this.authService.handleOAuthCallback(code, state).subscribe({
        next: (response) => {
          console.log('OAuth Exchange Success:', response);

          if (response.isAuthenticated) {
            const lastCharacter =
              this.characterService.getLastViewedCharacter();
            const targetRoute = lastCharacter
              ? `/${lastCharacter.realm}/${lastCharacter.name}/character`
              : '/dashboard';

            this.router.navigate([targetRoute]);
          } else {
            this.router.navigate(['/'], {
              queryParams: {
                error: 'auth_failed',
                message: 'Authentication failed',
              },
            });
          }
        },
        error: (error) => {
          console.error('OAuth Exchange Error:', error);
          this.router.navigate(['/'], {
            queryParams: {
              error: error.error || 'exchange_failed',
              message: error.message || 'OAuth exchange failed',
            },
          });
        },
        complete: () => {
          console.timeEnd('authCallback');
          console.groupEnd();
        },
      });
    });
  }
}