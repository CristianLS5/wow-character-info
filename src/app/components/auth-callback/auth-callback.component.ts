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
    this.route.queryParams.subscribe((params) => {
      const success = params['success'];
      const sid = params['sid'];
      const persistentSession = params['persistentSession'] === 'true';

      if (success === 'true' && sid) {
        this.authService.handleAuthCallback(sid, persistentSession).subscribe({
          next: (result) => {
            if (result.isAuthenticated) {
              const lastCharacter = this.characterService.getLastViewedCharacter();
              if (lastCharacter) {
                this.router.navigate([
                  lastCharacter.realm,
                  lastCharacter.name,
                  'character'
                ]);
              } else {
                this.router.navigate(['/dashboard']);
              }
            } else {
              this.router.navigate(['/']);
            }
          },
          error: () => this.router.navigate(['/'])
        });
      } else {
        this.router.navigate(['/']);
      }
    });
  }
}
