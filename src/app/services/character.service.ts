import { Injectable, signal, computed } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, tap } from 'rxjs/operators';
import { throwError } from 'rxjs';

interface Character {
  name: string;
  level: number;
  character_class: {
    name: string;
  };
  race: {
    name: string;
  };
  // Add more properties as needed
}

@Injectable({
  providedIn: 'root',
})
export class CharacterService {
  private apiUrl = 'http://localhost:3000/api';
  private characterSignal = signal<Character | null>(null);
  private loadingSignal = signal<boolean>(false);
  private errorSignal = signal<string | null>(null);

  character = computed(() => this.characterSignal());
  loading = computed(() => this.loadingSignal());
  error = computed(() => this.errorSignal());

  constructor(private http: HttpClient) {}

  getCharacter(realm: string, characterName: string) {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    this.http
      .get<Character>(`${this.apiUrl}/character/${realm}/${characterName}`)
      .pipe(
        tap(() => this.loadingSignal.set(false)),
        catchError(this.handleError)
      )
      .subscribe({
        next: (data) => this.characterSignal.set(data),
        error: (error) => {
          this.loadingSignal.set(false);
          this.errorSignal.set(error);
        },
      });
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An unknown error occurred';
    if (error.error instanceof ErrorEvent) {
      // Client-side or network error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Backend returned an unsuccessful response code
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    console.error(errorMessage);
    return throwError(() => errorMessage);
  }
}
