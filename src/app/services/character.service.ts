import { Injectable, signal, computed } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, finalize, tap } from 'rxjs/operators';
import { Observable, throwError } from 'rxjs';

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

@Injectable({
  providedIn: 'root',
})
export class CharacterService {
  private apiUrl = 'http://localhost:3000/api';

  private loadingSignal = signal<boolean>(false);
  private characterEquipmentSignal = signal<CharacterEquipment | null>(null);
  private characterMediaSignal = signal<CharacterMedia | null>(null);
  private errorSignal = signal<string | null>(null);

  loading = computed(() => this.loadingSignal());
  error = computed(() => this.errorSignal());

  constructor(private http: HttpClient) {}

  getCharacterEquipment(
    realm: string,
    characterName: string
  ): Observable<CharacterEquipment> {
    const url = `${this.apiUrl}/character/${realm}/${characterName}/equipment`;
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    return this.http.get<CharacterEquipment>(url).pipe(
      tap((data) => {
        console.log('Received character equipment data:', data);
        this.characterEquipmentSignal.set(data);
      }),
      catchError((error: HttpErrorResponse) => {
        const errorMessage = `Error fetching character equipment: ${error.message}`;
        console.error(errorMessage, error);
        this.errorSignal.set(errorMessage);
        return throwError(() => new Error(errorMessage));
      }),
      finalize(() => {
        this.loadingSignal.set(false);
      })
    );
  }

  get characterEquipment() {
    return this.characterEquipmentSignal.asReadonly();
  }

  getCharacterMedia(
    realm: string,
    characterName: string
  ): Observable<CharacterMedia> {
    const url = `${this.apiUrl}/character/${realm}/${characterName}/media`;
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    return this.http.get<CharacterMedia>(url).pipe(
      tap((data) => {
        console.log('Received character media data:', data);
        this.characterMediaSignal.set(data);
      }),
      catchError((error: HttpErrorResponse) => {
        const errorMessage = `Error fetching character media: ${error.message}`;
        console.error(errorMessage, error);
        this.errorSignal.set(errorMessage);
        return throwError(() => new Error(errorMessage));
      }),
      finalize(() => {
        this.loadingSignal.set(false);
      })
    );
  }

  get characterMedia() {
    return this.characterMediaSignal.asReadonly();
  }
}
