import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { Observable } from 'rxjs';
import { tap, take } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): Observable<boolean> {
    return this.authService.checkAuthStatus().pipe(
      take(1),
      tap((isAuthenticated) => {
        console.log('Auth guard check:', {
          isAuthenticated,
          hasSessionStorage: !!sessionStorage.getItem('auth_time'),
          hasLocalStorage: !!localStorage.getItem('auth_state')
        });

        if (!isAuthenticated) {
          console.log('Access denied - not authenticated');
          this.router.navigate(['/']);
        }
      })
    );
  }
}
