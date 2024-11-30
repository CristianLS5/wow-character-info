import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from './auth.service';
import { Observable, of } from 'rxjs';
import { take, switchMap } from 'rxjs/operators';
import { CharacterService } from '../../services/character.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService, 
    private router: Router,
    private characterService: CharacterService
  ) {}

  canActivate(route: ActivatedRouteSnapshot): Observable<boolean> {
    // Wait for auth initialization before proceeding
    return this.authService.isAuthInitialized().pipe(
      take(1),
      switchMap(() => this.authService.checkAuthStatus()),
      take(1),
      switchMap(isAuthenticated => {
        console.log('Auth guard check:', {
          isAuthenticated,
          path: route.routeConfig?.path,
          requiresAuth: route.data['requiresAuth'],
          params: route.params
        });

        // Handle direct navigation to character routes
        if (route.params['realm'] && route.params['character']) {
          return of(isAuthenticated);
        }

        // Landing page logic
        if (route.routeConfig?.path === '' && isAuthenticated) {
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
          return of(false);
        }

        // Auth required routes
        if (route.data['requiresAuth'] !== false && !isAuthenticated) {
          console.log('Access denied -  not authenticated');
          this.router.navigate(['/']);
          return of(false);
        }

        return of(true);
      })
    );
  }
}
