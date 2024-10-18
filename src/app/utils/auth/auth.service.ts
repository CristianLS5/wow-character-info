import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';

interface AuthResponse {
  success: boolean;
  message: string;
  expiresIn: number;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/auth';
  private frontendCallbackUrl = 'http://localhost:4200/auth/callback';
  private isAuthenticatedSignal = signal(false);

  constructor(private http: HttpClient, private router: Router) {
    this.checkAuthStatus().subscribe();
  }

  login(): void {
    window.location.href = `${this.apiUrl}/bnet?callback=${encodeURIComponent(
      this.frontendCallbackUrl
    )}`;
  }

  handleCallback(code: string, state: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/exchange-token`, { code, state }, { withCredentials: true })
      .pipe(
        tap((response) => {
          console.log('Server response:', response);
          if (response.success) {
            this.isAuthenticatedSignal.set(true);
            console.log('Authentication state set to true');
          }
        }),
        catchError((error) => {
          console.error('Authentication error:', error);
          this.isAuthenticatedSignal.set(false);
          return throwError(() => error);
        })
      );
  }

  checkAuthStatus(): Observable<boolean> {
    return this.http
      .get<{ isAuthenticated: boolean }>(`${this.apiUrl}/validate`, {
        withCredentials: true,
      })
      .pipe(
        map((response) => response.isAuthenticated),
        tap((isAuthenticated) => {
          this.isAuthenticatedSignal.set(isAuthenticated);
        }),
        catchError(() => {
          this.isAuthenticatedSignal.set(false);
          return of(false);
        })
      );
  }

  logout(): Observable<any> {
    return this.http
      .post(`${this.apiUrl}/logout`, {}, { withCredentials: true })
      .pipe(
        tap(() => {
          this.isAuthenticatedSignal.set(false);
        })
      );
  }

  isAuthenticated() {
    return this.isAuthenticatedSignal();
  }
}
