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
      console.log('Received Callback Parameters:', {
        success: params['success'],
        hasSid: !!params['sid'],
        persistentSession: params['persistentSession'],
        allParams: { ...params, sid: params['sid'] ? '***' : 'none' }
      });

      const success = params['success'];
      const sid = params['sid'];
      const persistentSession = params['persistentSession'] === 'true';

      if (success === 'true' && sid) {
        this.authService.handleAuthCallback(sid, persistentSession).subscribe({
          next: (result) => {
            console.log('Auth Callback Success:', {
              isAuthenticated: result.isAuthenticated,
              isPersistent: result.isPersistent,
              hasLastCharacter: !!this.characterService.getLastViewedCharacter()
            });

            if (result.isAuthenticated) {
              const lastCharacter = this.characterService.getLastViewedCharacter();
              const targetRoute = lastCharacter 
                ? `/${lastCharacter.realm}/${lastCharacter.name}/character`
                : '/dashboard';

              console.log('Navigation after auth:', {
                targetRoute,
                lastCharacter: lastCharacter || 'none'
              });

              this.router.navigate([targetRoute]);
            } else {
              console.warn('Authentication failed in callback');
              this.router.navigate(['/']);
            }
          },
          error: (error) => {
            console.error('Auth Callback Error:', {
              error: error.message,
              status: error.status,
              details: error
            });
            this.router.navigate(['/']);
          },
          complete: () => {
            console.timeEnd('authCallback');
            console.groupEnd();
          }
        });
      } else {
        console.warn('Invalid callback parameters', {
          success,
          hasSid: !!sid
        });
        this.router.navigate(['/']);
      }
    });
  }
}
