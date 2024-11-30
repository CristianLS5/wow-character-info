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
      switchMap(() => {
        if (this.authService.isAuthenticated()) {
          return of(true);
        }
        
        this.router.navigate(['/']);
        return of(false);
      })
    );
  }
}
