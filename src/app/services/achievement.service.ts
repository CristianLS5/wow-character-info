import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, map } from 'rxjs';
import { Achievement } from '../interfaces/achievement.interface';
import { environment } from '../../environments/environment';

interface CharacterAchievementSummary {
  total_quantity: number;
  total_points: number;
  achievements: Array<{
    id: number;
    achievement: {
      key: {
        href: string;
      };
      name: string;
      id: number;
    };
    criteria: {
      id: number;
      is_completed: boolean;
    };
    completed_timestamp?: number;
  }>;
}

@Injectable({
  providedIn: 'root',
})
export class AchievementService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getAllAchievements(): Observable<Achievement[]> {
    console.log('Fetching all achievements...');
    return this.http.get<Achievement[]>(`${this.apiUrl}/achievements/all`).pipe(
      tap((achievements) => {
        console.log('Received achievements:', {
          total: achievements.length,
          sample: achievements.slice(0, 2),
        });
      })
    );
  }

  getCharacterAchievements(
    realmSlug: string,
    characterName: string
  ): Observable<CharacterAchievementSummary> {
    console.log(`Fetching achievements for ${characterName}-${realmSlug}...`);
    return this.http
      .get<CharacterAchievementSummary>(
        `${this.apiUrl}/character/${realmSlug}/${characterName}/achievements`
      )
      .pipe(
        tap((response) => {
          const achievements = response?.achievements || [];

          console.log('Raw Achievement Response:', {
            totalQuantity: response?.total_quantity,
            totalPoints: response?.total_points,
            achievementsCount: achievements.length,
            sampleAchievements: achievements.slice(0, 3),
          });

          const completedExample = achievements.find(
            (a) => a?.criteria?.is_completed === true
          );
          const notCompletedExample = achievements.find(
            (a) => a?.criteria?.is_completed === false
          );

          console.log('Character Achievements Examples:', {
            totalAchievements: response?.total_quantity || 0,
            totalPoints: response?.total_points || 0,
            completedExample: completedExample
              ? {
                  name: completedExample.achievement?.name,
                  id: completedExample.id,
                  criteria: completedExample.criteria,
                  timestamp: completedExample.completed_timestamp
                    ? new Date(
                        completedExample.completed_timestamp
                      ).toLocaleDateString()
                    : 'No timestamp',
                }
              : 'No completed achievements found',
            notCompletedExample: notCompletedExample
              ? {
                  name: notCompletedExample.achievement?.name,
                  id: notCompletedExample.id,
                  criteria: notCompletedExample.criteria,
                }
              : 'No incomplete achievements found',
          });
        }),
        catchError((error) => {
          console.error('Error in getCharacterAchievements:', error);
          throw error;
        })
      );
  }
}
