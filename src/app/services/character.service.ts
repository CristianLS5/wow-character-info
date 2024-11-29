import { Injectable, signal, computed } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, finalize, tap } from 'rxjs/operators';
import { forkJoin, Observable, throwError, of } from 'rxjs';
import { CharacterEquipment } from '../interfaces/character-equipment.interface';
import { CharacterMedia } from '../interfaces/character-media.interface';
import { CharacterInfo } from '../interfaces/character.interface';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class CharacterService {
  private apiUrl = environment.apiUrl;

  private loadingSignal = signal<boolean>(false);
  private characterEquipmentSignal = signal<CharacterEquipment | null>(null);
  private characterMediaSignal = signal<CharacterMedia | null>(null);
  private characterProfileSignal = signal<CharacterInfo | null>(null);
  private errorSignal = signal<string | null>(null);
  private lastViewedCharacter = signal<{ realm: string; name: string } | null>(null);

  loading = computed(() => this.loadingSignal());
  error = computed(() => this.errorSignal());

  constructor(private http: HttpClient) {}

  fetchAllCharacterData(
    realm: string,
    characterName: string
  ): Observable<[CharacterEquipment, CharacterMedia, CharacterInfo]> {
    const currentProfile = this.characterProfileSignal();
    if (currentProfile && 
        currentProfile.name.toLowerCase() === characterName.toLowerCase() && 
        currentProfile.realm.slug.toLowerCase() === realm.toLowerCase()) {
      console.log('Using cached character data');
      return of([
        this.characterEquipmentSignal()!,
        this.characterMediaSignal()!,
        currentProfile
      ]);
    }

    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.setLastViewedCharacter(realm, characterName);

    return forkJoin([
      this.getCharacterEquipment(realm, characterName),
      this.getCharacterMedia(realm, characterName),
      this.getCharacterProfile(realm, characterName),
    ]).pipe(
      tap(() => {
        console.log('All character data fetched successfully');
      }),
      finalize(() => {
        this.loadingSignal.set(false);
      })
    );
  }

  getCharacterEquipment(
    realm: string,
    characterName: string
  ): Observable<CharacterEquipment> {
    const url = `${this.apiUrl}/character/${realm}/${characterName}/equipment`;
    return this.http.get<CharacterEquipment>(url).pipe(
      tap((data) => {
        console.log('Received character equipment data:', data);

        this.characterEquipmentSignal.set(data);
      }),
      catchError(this.handleError('character equipment'))
    );
  }

  getCharacterMedia(
    realm: string,
    characterName: string
  ): Observable<CharacterMedia> {
    const url = `${this.apiUrl}/character/${realm}/${characterName}/media`;
    return this.http.get<CharacterMedia>(url).pipe(
      tap((data) => {
        console.log('Received character media data:', data);
        this.characterMediaSignal.set(data);
      }),
      catchError(this.handleError('character media'))
    );
  }

  getCharacterProfile(
    realm: string,
    characterName: string
  ): Observable<CharacterInfo> {
    const url = `${this.apiUrl}/character/${realm}/${characterName}/profile`;
    return this.http.get<CharacterInfo>(url).pipe(
      tap((data) => {
        console.log('Character profile data:', data);
        this.characterProfileSignal.set(data);
      }),
      catchError(this.handleError('character profile'))
    );
  }

  private handleError(operation: string) {
    return (error: HttpErrorResponse): Observable<never> => {
      const errorMessage = `Error fetching ${operation}: ${error.message}`;
      console.error(errorMessage, error);
      this.errorSignal.set(errorMessage);
      return throwError(() => new Error(errorMessage));
    };
  }

  get characterEquipment() {
    return this.characterEquipmentSignal.asReadonly();
  }

  get characterMedia() {
    return this.characterMediaSignal.asReadonly();
  }

  get characterProfile() {
    return this.characterProfileSignal.asReadonly();
  }

  get isDataAvailable() {
    return computed(
      () =>
        !!this.characterEquipmentSignal() &&
        !!this.characterMediaSignal() &&
        !!this.characterProfileSignal()
    );
  }

  clearCharacterData() {
    this.characterProfileSignal.set(null);
    this.characterEquipmentSignal.set(null);
    this.characterMediaSignal.set(null);
    // Clear any other relevant data
  }

  getCharacterInfo(): CharacterInfo | null {
    const profile = this.characterProfileSignal();
    if (profile) {
      return {
        name: profile.name,
        realmSlug: profile.realm.slug,
        characterName: profile.name,
        gender: profile.gender,
        faction: profile.faction,
        race: profile.race,
        character_class: profile.character_class,
        active_spec: profile.active_spec,
        realm: profile.realm,
        guild: profile.guild,
        level: profile.level,
        experience: profile.experience,
        achievement_points: profile.achievement_points,
        last_login_timestamp: profile.last_login_timestamp,
        average_item_level: profile.average_item_level,
        equipped_item_level: profile.equipped_item_level,
      };
    }
    return null;
  }

  setLastViewedCharacter(realm: string, name: string) {
    const characterData = { realm, name };
    localStorage.setItem('last_character', JSON.stringify(characterData));
  }

  getLastViewedCharacter(): { realm: string; name: string } | null {
    const stored = localStorage.getItem('last_character');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error('Error parsing last character:', e);
        return null;
      }
    }
    return null;
  }

  hasValidCharacterData(): boolean {
    return !!(
      this.characterProfileSignal() &&
      this.characterEquipmentSignal() &&
      this.characterMediaSignal()
    );
  }
}
