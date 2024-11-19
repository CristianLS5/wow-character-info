import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError, tap, shareReplay } from 'rxjs';
import {
  DungeonsResponse,
  SeasonDetails,
  Affix,
} from '../interfaces/dungeons.interface';
import { SeasonsResponse } from '../interfaces/season.interface';

@Injectable({
  providedIn: 'root',
})
export class InstanceService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api';
  private affixCache$: Observable<Affix[]> | null = null;

  getCharacterDungeons(
    realmSlug: string,
    characterName: string
  ): Observable<DungeonsResponse> {
    const url = `${this.apiUrl}/dungeons/${realmSlug}/${characterName}`;

    return this.http.get<DungeonsResponse>(url).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('Error fetching dungeons:', error);
        if (error.status === 404) {
          return throwError(() => ({
            error: 'No mythic keystone data available',
            details: `No Mythic+ data found for this character.`,
          }));
        }
        return throwError(() => ({
          error: 'Failed to fetch character mythic keystone profile',
          details: error.message || 'Unknown error occurred',
        }));
      })
    );
  }

  getSeasonDetails(
    realmSlug: string,
    characterName: string,
    seasonId: number
  ): Observable<SeasonDetails> {
    const url = `${this.apiUrl}/dungeons/${realmSlug}/${characterName}/season/${seasonId}`;
    
    console.log('=== Season Details Request ===');
    console.log('URL:', url);
    console.log('Parameters:', { realmSlug, characterName, seasonId });

    return this.http.get<SeasonDetails>(url).pipe(
      tap(response => {
        console.log('=== Season Details API Response ===');
        console.log(JSON.stringify(response, null, 2));
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('=== Season Details Error ===');
        console.error('Status:', error.status);
        console.error('Message:', error.message);
        console.error('Error details:', error.error);
        
        if (error.status === 404) {
          return throwError(() => ({
            error: 'Season details not available',
            details: `No data available for season ${seasonId}.`,
          }));
        }
        return throwError(() => ({
          error: 'Failed to fetch season details',
          details: error.message || 'Unknown error occurred',
        }));
      })
    );
  }

  getSeasons(): Observable<SeasonsResponse> {
    const url = `${this.apiUrl}/dungeons/seasons`;

    return this.http.get<SeasonsResponse>(url).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('Error fetching seasons:', error);
        if (error.status === 404) {
          return throwError(() => ({
            error: 'Seasons not available',
            details: 'Unable to fetch current season information.',
          }));
        }
        return throwError(() => ({
          error: 'Failed to fetch seasons',
          details: error.message || 'Unknown error occurred',
        }));
      })
    );
  }

  getAffixes(): Observable<Affix[]> {
    if (!this.affixCache$) {
      this.affixCache$ = this.http.get<Affix[]>(`${this.apiUrl}/affixes`).pipe(
        tap(affixes => {
          console.log('=== Affixes Response ===');
          console.log(JSON.stringify(affixes, null, 2));
        }),
        catchError((error: HttpErrorResponse) => {
          console.error('Error fetching affixes:', error);
          return throwError(() => ({
            error: 'Failed to fetch affixes',
            details: error.message || 'Unknown error occurred',
          }));
        }),
        shareReplay(1)
      );
    }
    return this.affixCache$;
  }

  getAffixById(id: number): Observable<Affix> {
    const url = `${this.apiUrl}/affixes/${id}`;
    
    return this.http.get<Affix>(url).pipe(
      tap(affix => {
        console.log(`=== Affix ${id} Response ===`);
        console.log(JSON.stringify(affix, null, 2));
      }),
      catchError((error: HttpErrorResponse) => {
        console.error(`Error fetching affix ${id}:`, error);
        return throwError(() => ({
          error: 'Failed to fetch affix details',
          details: error.message || 'Unknown error occurred',
        }));
      })
    );
  }
}
