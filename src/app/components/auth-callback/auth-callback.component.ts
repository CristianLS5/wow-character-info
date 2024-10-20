import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../utils/auth/auth.service';

@Component({
  selector: 'app-auth-callback',
  standalone: true,
  imports: [],
  templateUrl: './auth-callback.component.html',
  styleUrl: './auth-callback.component.sass',
})
export class AuthCallbackComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      const success = params['success'];
      const error = params['error'];

      if (error) {
        console.error('Authentication error:', error);
        this.router.navigate(['/']);
        return;
      }

      if (success === 'true') {
        this.authService.handleCallback().subscribe({
          next: (isAuthenticated) => {
            if (isAuthenticated) {
              console.log('Authentication successful');
              this.router.navigate(['/character']);
            } else {
              console.error('Authentication failed');
              this.router.navigate(['/']);
            }
          },
          error: (error) => {
            console.error('Authentication error:', error);
            this.router.navigate(['/']);
          },
        });
      } else {
        console.error('Invalid callback parameters');
        this.router.navigate(['/']);
      }
    });
  }
}
