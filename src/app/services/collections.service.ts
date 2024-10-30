import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class CollectionsService {
  private apiUrl = 'http://localhost:3000/api'; // Update this to match your backend URL

  constructor(private http: HttpClient) {}

  getMountsIndex(): Observable<any[]> {
    console.log('Fetching mounts index');
    return this.http.get<any[]>(`${this.apiUrl}/mounts`);
  }

  getAllMountsWithDetails(): Observable<any[]> {
    console.log('Fetching all mounts with details');
    return this.http
      .get<any[]>(`${this.apiUrl}/mounts/all`)
      .pipe(map((mounts) => mounts.map((mount) => mount.data)));
  }

  searchMounts(name: string): Observable<any[]> {
    console.log(`Searching mounts with name: ${name}`);
    return this.http.get<any[]>(`${this.apiUrl}/mounts/search`, {
      params: { name },
    });
  }

  getMountById(mountId: number): Observable<any> {
    console.log(`Fetching mount with ID: ${mountId}`);
    return this.http.get(`${this.apiUrl}/mounts/${mountId}`);
  }

  getCreatureMedia(creatureDisplayId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/creatures/${creatureDisplayId}/media`);
  }

  getCollectedMounts(
    realmSlug: string,
    characterName: string
  ): Observable<any> {
    console.log(
      `Fetching collected mounts for ${characterName} on ${realmSlug}`
    );
    return this.http.get<any>(
      `${this.apiUrl}/collections/${realmSlug}/${characterName}/mounts`
    );
  }

  getPetsIndex(): Observable<any[]> {
    console.log('Fetching pets index');
    return this.http.get<any[]>(`${this.apiUrl}/pets`);
  }

  getAllPetsWithDetails(): Observable<any[]> {
    console.log('Fetching all pets with details');
    return this.http
      .get<any[]>(`${this.apiUrl}/pets/all`)
      .pipe(map((pets) => pets.map((pet) => pet.data)));
  }

  getPetById(petId: number): Observable<any> {
    console.log(`Fetching pet with ID: ${petId}`);
    return this.http.get(`${this.apiUrl}/pets/${petId}`);
  }
}
