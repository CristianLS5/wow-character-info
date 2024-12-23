import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, forkJoin, from } from 'rxjs';
import { map, switchMap, concatMap, scan, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import {
  CollectedPet,
  CreatureMediaResponse,
} from '../interfaces/pet.interface';
import {
  TransmogSet,
  CollectedTransmogsData,
} from '../interfaces/transmog.interface';
import { HeirloomResponse, CollectedHeirloomsResponse } from '../interfaces/heirloom.interface';

@Injectable({
  providedIn: 'root',
})
export class CollectionsService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getMountsIndex(): Observable<any[]> {
    console.log('Fetching mounts index');
    return this.http.get<any[]>(`${this.apiUrl}/mounts`);
  }

  getAllMountsWithDetails(): Observable<any[]> {
    console.log('Fetching all mounts with details');
    return this.http.get<any[]>(`${this.apiUrl}/mounts/all`).pipe(
      map((mounts) =>
        mounts.map((mount) => ({
          ...mount.data,
          itemId: mount.itemId,
          spellId: mount.spellId,
        }))
      )
    );
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

  getCreatureMedia(
    creatureDisplayId: number
  ): Observable<CreatureMediaResponse> {
    return this.http.get<CreatureMediaResponse>(
      `${this.apiUrl}/creatures/${creatureDisplayId}/media`
    );
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

  getCollectedPets(
    realmSlug: string,
    characterName: string
  ): Observable<CollectedPet[]> {
    console.log(`Fetching collected pets for ${characterName} on ${realmSlug}`);

    return this.http
      .get<{ pets: CollectedPet[] }>(
        `${this.apiUrl}/collections/${realmSlug}/${characterName}/pets`
      )
      .pipe(
        map((response) => {
          const pets = response.pets || [];
          return pets;
        }),
        switchMap((pets: CollectedPet[]) => {
          if (!pets.length) return of([]);

          const batchSize = 5;
          const batches: CollectedPet[][] = [];

          // Process all pets since backend handles invalid IDs
          for (let i = 0; i < pets.length; i += batchSize) {
            const batch = pets.slice(i, i + batchSize);
            batches.push(batch);
          }

          return from(batches).pipe(
            concatMap((batch: CollectedPet[]) => {
              const batchObservables: Observable<CollectedPet>[] = batch.map((pet) => {
                if (pet.creature_display?.id) {
                  return this.getCreatureMedia(pet.creature_display.id).pipe(
                    map((mediaResponse) => ({
                      ...pet,
                      creatureMedia:
                        mediaResponse?.assets?.length > 0
                          ? mediaResponse.assets[0].value
                          : undefined,
                    })),
                    catchError(() => {
                      return of(pet);
                    })
                  );
                }
                return of(pet);
              });

              return forkJoin(batchObservables);
            }),
            scan((acc, batch) => [...acc, ...batch], [] as CollectedPet[])
          );
        })
      );
  }

  getAllToysWithDetails(): Observable<any[]> {
    console.log('Fetching all toys with details');
    return this.http.get<any[]>(`${this.apiUrl}/toys/all`);
  }

  getCollectedToys(realmSlug: string, characterName: string): Observable<any> {
    console.log(`Fetching collected toys for ${characterName} on ${realmSlug}`);
    return this.http.get<any>(
      `${this.apiUrl}/collections/${realmSlug}/${characterName}/toys`
    );
  }

  getAllTransmogSets(): Observable<TransmogSet[]> {
    return this.http.get<TransmogSet[]>(`${this.apiUrl}/transmogs`);
  }

  getCollectedTransmogs(
    realmSlug: string,
    characterName: string
  ): Observable<CollectedTransmogsData> {
    return this.http.get<CollectedTransmogsData>(
      `${this.apiUrl}/collections/${realmSlug}/${characterName}/transmogs`
    );
  }

  getCollectedHeirlooms(
    realmSlug: string,
    characterName: string
  ): Observable<CollectedHeirloomsResponse> {
    return this.http.get<CollectedHeirloomsResponse>(
      `${this.apiUrl}/collections/${realmSlug}/${characterName}/heirlooms`
    );
  }

  getAllHeirlooms(): Observable<HeirloomResponse[]> {
    return this.http.get<HeirloomResponse[]>(`${this.apiUrl}/heirlooms/all`);
  }
}
