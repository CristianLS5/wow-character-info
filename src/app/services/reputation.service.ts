import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError } from 'rxjs';
import { ReputationResponse } from '../interfaces/reputation.interface';

@Injectable({
  providedIn: 'root',
})
export class ReputationService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api';

  getCharacterReputations(
    realmSlug: string,
    characterName: string
  ): Observable<ReputationResponse> {
    const url = `${this.apiUrl}/reputations/${realmSlug}/${characterName}`;
    console.log('Making reputations API request:', {
      url,
      realmSlug,
      characterName
    });

    return this.http
      .get<ReputationResponse>(url)
      .pipe(
        tap((response) => {
          console.log('Reputations API Success:', {
            url,
            dataReceived: !!response,
            expansions: Object.keys(response),
            sampleData: {
              expansion: Object.keys(response)[0],
              reputationsCount: response[Object.keys(response)[0]]?.length,
              firstReputation: response[Object.keys(response)[0]]?.[0]
            }
          });
        }),
        catchError((error) => {
          console.error('Reputations API Error:', {
            url,
            status: error.status,
            statusText: error.statusText,
            error: error.error,
            message: error.message
          });
          throw error;
        })
      );
  }
}
