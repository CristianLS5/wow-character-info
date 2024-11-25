import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../utils/auth/auth.service';

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
    private authService: AuthService
  ) {}

  ngOnInit() {
    console.log('Auth callback initialized');

    this.route.queryParams.subscribe((params) => {
      console.log('Full query params:', params);

      const success = params['success'];
      const sid = params['sid'];
      const persistentSession = params['persistentSession'] === 'true';

      if (success === 'true' && sid) {
        this.authService.handleAuthCallback(sid, persistentSession).subscribe({
          next: (result) => {
            console.log('Auth callback result:', result);
            if (result.isAuthenticated) {
              this.router.navigate(['/character']);
            } else {
              console.error('Authentication failed');
              this.router.navigate(['/']);
            }
          },
          error: (error) => {
            console.error('Auth callback error:', error);
            this.router.navigate(['/']);
          },
        });
      } else {
        console.error('Missing success or sid parameter');
        this.router.navigate(['/']);
      }
    });
  }
}
