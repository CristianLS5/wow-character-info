import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from './auth.service';
import { Observable, of } from 'rxjs';
import { take, switchMap, map } from 'rxjs/operators';
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
    return this.authService.waitForAuthReady().pipe(
      take(1),
      map(isAuthenticated => {
        console.log('Auth guard check:', {
          isAuthenticated,
          path: route.routeConfig?.path,
          requiresAuth: route.data['requiresAuth'],
          params: route.params
        });

        // Handle direct navigation to character routes
        if (route.params['realm'] && route.params['character']) {
          return isAuthenticated;
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
          return false;
        }

        // Auth required routes
        if (route.data['requiresAuth'] !== false && !isAuthenticated) {
          console.log('Access denied - not authenticated');
          this.router.navigate(['/']);
          return false;
        }

        return true;
      })
    );
  }
}
