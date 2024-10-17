import { Injectable, signal, computed } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, finalize, tap } from 'rxjs/operators';
import { forkJoin, Observable, throwError } from 'rxjs';

interface CharacterEquipment {
  equipped_items: Array<{
    name: string;
    quality: { type: string; name: string };
    level: { value: number; display_string: string };
    item: { id: number };
    slot: { type: string; name: string };
    iconUrl?: string;
  }>;
}

interface CharacterMedia {
  assets: Array<{
    key: string;
    value: string;
  }>;
}

interface CharacterProfile {
  name: string;
  gender: string;
  faction: string;
  race: string;
  character_class: {
    key: { href: string };
    name: string;
    id: number;
  };
  active_spec: {
    key: { href: string };
    name: string;
    id: number;
  };
  realm: {
    key: { href: string };
    name: string;
    id: number;
    slug: string;
  };
  guild?: {
    name: string;
    realm: {
      key: { href: string };
      name: string;
      id: number;
      slug: string;
    };
  };
  level: number;
  experience: number;
  achievement_points: number;
  last_login_timestamp: number;
  average_item_level: number;
  equipped_item_level: number;
}

@Injectable({
  providedIn: 'root',
})
export class CharacterService {
  private apiUrl = 'http://localhost:3000/api';

  private loadingSignal = signal<boolean>(false);
  private characterEquipmentSignal = signal<CharacterEquipment | null>(null);
  private characterMediaSignal = signal<CharacterMedia | null>(null);
  private characterProfileSignal = signal<CharacterProfile | null>(null);
  private errorSignal = signal<string | null>(null);

  loading = computed(() => this.loadingSignal());
  error = computed(() => this.errorSignal());

  constructor(private http: HttpClient) {}

  fetchAllCharacterData(
    realm: string,
    characterName: string
  ): Observable<[CharacterEquipment, CharacterMedia, CharacterProfile]> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    return forkJoin([
      this.getCharacterEquipment(realm, characterName),
      this.getCharacterMedia(realm, characterName),
      this.getCharacterProfile(realm, characterName),
    ]).pipe(
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

  getCharacterProfile(realm: string, characterName: string): Observable<CharacterProfile> {
    const url = `${this.apiUrl}/character/${realm}/${characterName}/profile`;
    return this.http.get<CharacterProfile>(url).pipe(
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
}
