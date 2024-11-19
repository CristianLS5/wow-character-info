import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { InstanceService } from '../../services/instance.service';
import { CharacterService } from '../../services/character.service';
import { DungeonRun, SeasonDetails } from '../../interfaces/dungeons.interface';
import { DungeonCardComponent } from '../../shared/components/dungeon-card/dungeon-card.component';
import { switchMap, catchError, EMPTY } from 'rxjs';
import { DungeonSeason } from '../../interfaces/season.interface';

@Component({
  selector: 'app-instances',
  standalone: true,
  imports: [CommonModule, DungeonCardComponent],
  templateUrl: './instances.component.html',
  styleUrl: './instances.component.sass',
})
export class InstancesComponent implements OnInit {
  private instanceService = inject(InstanceService);
  private characterService = inject(CharacterService);

  seasonData: SeasonDetails | null = null;
  currentSeason: DungeonSeason | null = null;
  bestRuns: DungeonRun[] = [];
  isLoading = true;
  error: string | null = null;

  private getBestRunsPerDungeon(runs: DungeonRun[]): DungeonRun[] {
    console.log('=== getBestRunsPerDungeon ===');
    console.log('Input runs:', JSON.stringify(runs, null, 2));
    
    if (!runs || !Array.isArray(runs)) {
      console.warn('Received invalid runs data:', runs);
      return [];
    }
    
    const dungeonMap = new Map<number, DungeonRun>();
    
    runs.forEach(run => {
      console.log('Processing run:', JSON.stringify(run, null, 2));
      const existingRun = dungeonMap.get(run.dungeon.id);
      if (!existingRun || run.keystone_level > existingRun.keystone_level) {
        console.log(`Setting best run for dungeon ${run.dungeon.name} (${run.dungeon.id})`);
        dungeonMap.set(run.dungeon.id, run);
      }
    });

    const result = Array.from(dungeonMap.values());
    console.log('Final processed runs:', JSON.stringify(result, null, 2));
    return result;
  }

  getRatingColor(color: { r: number; g: number; b: number; a: number }): string {
    return `rgb(${color.r}, ${color.g}, ${color.b})`;
  }

  ngOnInit() {
    const character = this.characterService.getCharacterInfo();
    
    if (!character) {
      this.error = 'No character selected';
      this.isLoading = false;
      return;
    }

    this.instanceService.getSeasons().pipe(
      switchMap(seasonsResponse => {
        if (!seasonsResponse.currentSeason) {
          throw new Error('No current season available');
        }
        
        this.currentSeason = seasonsResponse.currentSeason;
        
        console.log('=== Fetching Season Details ===');
        console.log('Parameters:', {
          realm: character.realm.slug,
          character: character.name.toLowerCase(),
          seasonId: this.currentSeason.id
        });
        
        return this.instanceService.getSeasonDetails(
          character.realm.slug,
          character.name.toLowerCase(),
          this.currentSeason.id
        );
      }),
      catchError(err => {
        console.error('Error:', err);
        this.error = err.details || 
                    (err.message === 'No current season available' 
                      ? 'Unable to determine current season' 
                      : 'Failed to load season information');
        this.isLoading = false;
        return EMPTY;
      })
    ).subscribe({
      next: (seasonData) => {
        console.log('=== Season Details Response ===');
        console.log('Raw season data:', JSON.stringify(seasonData, null, 2));
        
        this.seasonData = seasonData;
        
        if (seasonData.best_runs) {
          console.log('Number of best runs:', seasonData.best_runs.length);
          if (seasonData.best_runs.length > 0) {
            console.log(
              'Sample run structure:',
              JSON.stringify(seasonData.best_runs[0], null, 2)
            );
          }
        } else {
          console.log('No best runs data available');
        }
        
        this.bestRuns = this.getBestRunsPerDungeon(seasonData.best_runs);
        console.log('Processed best runs:', JSON.stringify(this.bestRuns, null, 2));
        
        this.isLoading = false;
      },
      error: (err) => {
        console.error('=== Season Details Error ===');
        console.error('Error:', err);
        this.error = err.details || 
                    `Unable to load Mythic+ data for ${character.name}. Please try again later.`;
        this.isLoading = false;
      },
    });
  }
}
