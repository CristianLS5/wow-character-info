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
    console.group('🔄 Auth Callback Initialization');
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
        this.router.navigate(['/']);
        return;
      }

      if (!code || !state) {
        console.warn('Missing required OAuth parameters');
        this.router.navigate(['/']);
        return;
      }

      // Exchange code for session
      this.authService.handleOAuthCallback(code, state).subscribe({
        next: (result) => {
          console.log('OAuth Exchange Success:', {
            isAuthenticated: result.isAuthenticated,
            isPersistent: result.isPersistent,
          });

          if (result.isAuthenticated) {
            const lastCharacter =
              this.characterService.getLastViewedCharacter();
            const targetRoute = lastCharacter
              ? `/${lastCharacter.realm}/${lastCharacter.name}/character`
              : '/dashboard';

            this.router.navigate([targetRoute]);
          } else {
            this.router.navigate(['/']);
          }
        },
        error: (error) => {
          console.error('OAuth Exchange Error:', error);
          this.router.navigate(['/']);
        },
      });
    });
  }
}
