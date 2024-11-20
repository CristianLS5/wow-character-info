import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { InstanceService } from '../../services/instance.service';
import { CharacterService } from '../../services/character.service';
import { DungeonRun, SeasonDetails } from '../../interfaces/dungeons.interface';
import { RaidExpansion, RaidProfile } from '../../interfaces/raids.interface';
import { DungeonCardComponent } from '../../shared/components/dungeon-card/dungeon-card.component';
import { RaidCardComponent } from '../../shared/components/raid-card/raid-card.component';
import { switchMap, catchError, EMPTY, forkJoin } from 'rxjs';
import { DungeonSeason } from '../../interfaces/season.interface';

@Component({
  selector: 'app-instances',
  standalone: true,
  imports: [CommonModule, DungeonCardComponent, RaidCardComponent],
  templateUrl: './instances.component.html',
  styleUrl: './instances.component.sass',
})
export class InstancesComponent implements OnInit {
  private instanceService = inject(InstanceService);
  private characterService = inject(CharacterService);

  seasonData: SeasonDetails | null = null;
  currentSeason: DungeonSeason | null = null;
  bestRuns: DungeonRun[] = [];
  raidData: RaidProfile | null = null;
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

    runs.forEach((run) => {
      console.log('Processing run:', JSON.stringify(run, null, 2));
      const existingRun = dungeonMap.get(run.dungeon.id);
      if (!existingRun || run.keystone_level > existingRun.keystone_level) {
        console.log(
          `Setting best run for dungeon ${run.dungeon.name} (${run.dungeon.id})`
        );
        dungeonMap.set(run.dungeon.id, run);
      }
    });

    const result = Array.from(dungeonMap.values());
    console.log('Final processed runs:', JSON.stringify(result, null, 2));
    return result;
  }

  getRatingColor(color: {
    r: number;
    g: number;
    b: number;
    a: number;
  }): string {
    return `rgb(${color.r}, ${color.g}, ${color.b})`;
  }

  getCurrentRaidExpansion(raidData: RaidProfile): RaidExpansion | null {
    if (!raidData?.expansions?.length) {
      return null;
    }

    // Get the second-to-last expansion (length - 2)
    const currentExpansionIndex = raidData.expansions.length - 2;
    return currentExpansionIndex >= 0
      ? raidData.expansions[currentExpansionIndex]
      : null;
  }

  ngOnInit() {
    const character = this.characterService.getCharacterInfo();

    if (!character) {
      this.error = 'No character selected';
      this.isLoading = false;
      return;
    }

    // Get both dungeons and raids data
    forkJoin({
      seasons: this.instanceService.getSeasons(),
      raids: this.instanceService.getCharacterRaids(
        character.realm.slug,
        character.name.toLowerCase()
      ),
    })
      .pipe(
        switchMap(({ seasons, raids }) => {
          this.raidData = raids;

          if (!seasons.currentSeason) {
            throw new Error('No current season available');
          }

          this.currentSeason = seasons.currentSeason;

          return this.instanceService.getSeasonDetails(
            character.realm.slug,
            character.name.toLowerCase(),
            this.currentSeason.id
          );
        }),
        catchError((err) => {
          console.error('Error:', err);
          this.error =
            err.details ||
            (err.message === 'No current season available'
              ? 'Unable to determine current season'
              : 'Failed to load instance information');
          this.isLoading = false;
          return EMPTY;
        })
      )
      .subscribe({
        next: (seasonData) => {
          this.seasonData = seasonData;
          this.bestRuns = this.getBestRunsPerDungeon(seasonData.best_runs);
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error:', err);
          this.error =
            err.details ||
            `Unable to load data for ${character.name}. Please try again later.`;
          this.isLoading = false;
        },
      });
  }
}
