import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
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

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    return this.authService.isAuthInitialized().pipe(
      take(1),
      switchMap(() => this.authService.checkAuthStatus()),
      take(1),
      switchMap(authState => {
        console.log('Auth guard check:', {
          isAuthenticated: authState.isAuthenticated,
          path: route.routeConfig?.path,
          requiresAuth: route.data['requiresAuth'],
          params: route.params
        });

        // Handle direct navigation to character routes
        if (route.params['realm'] && route.params['character']) {
          return of(authState.isAuthenticated);
        }

        // Landing page logic
        if (route.routeConfig?.path === '' && authState.isAuthenticated) {
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

        // Check if route requires character selection
        if (route.data['requiresCharacter'] && authState.isAuthenticated) {
          const lastCharacter = this.characterService.getLastViewedCharacter();
          if (!lastCharacter) {
            this.router.navigate(['/dashboard']);
            return of(false);
          }
        }

        // Auth required routes
        if (route.data['requiresAuth'] !== false && !authState.isAuthenticated) {
          console.log('Access denied - not authenticated');
          this.router.navigate(['/']);
          return of(false);
        }

        return of(true);
      })
    );
  }
}
