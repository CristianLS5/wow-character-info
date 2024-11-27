import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { CharacterService } from '../services/character.service';
import { catchError, tap, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class CharacterResolver implements Resolve<any> {
  constructor(
    private characterService: CharacterService,
    private router: Router
  ) {}

  resolve(route: ActivatedRouteSnapshot): Observable<any> {
    const realm = route.paramMap.get('realm');
    const character = route.paramMap.get('character');
    
    console.log('Resolver activated with:', { realm, character });

    // Check if we already have data for this character
    const currentProfile = this.characterService.characterProfile();
    if (currentProfile && 
        currentProfile.name.toLowerCase() === character?.toLowerCase() && 
        currentProfile.realm.slug.toLowerCase() === realm?.toLowerCase()) {
      console.log('Using existing character data');
      return of(currentProfile);
    }

    if (!realm || !character) {
      console.log('Missing realm or character, redirecting to dashboard');
      this.router.navigate(['/dashboard']);
      return of(null);
    }

    return this.characterService.fetchAllCharacterData(realm, character).pipe(
      map(([equipment, media, profile]) => {
        console.log('Character data fetched successfully');
        return { equipment, media, profile };
      }),
      catchError(error => {
        console.error('Error fetching character data:', error);
        if (error.status === 404) {
          this.router.navigate(['/dashboard']);
        }
        return of(null);
      })
    );
  }
}
