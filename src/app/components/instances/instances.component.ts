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
import { LoadingComponent } from '../../shared/components/loading/loading.component';

@Component({
  selector: 'app-instances',
  standalone: true,
  imports: [CommonModule, DungeonCardComponent, RaidCardComponent, LoadingComponent],
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

  getRatingColor(
    color: { r: number; g: number; b: number; a: number } | undefined
  ): string {
    if (!color) {
      return '#808080';
    }
    return `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`;
  }

  getBestRunsPerDungeon(runs: DungeonRun[] | undefined) {
    if (!runs || !Array.isArray(runs)) {
      console.warn('Received invalid runs data:', runs);
      return [];
    }

    // Filter for completed runs only
    const completedRuns = runs.filter((run) => run.isCompleted);

    const dungeonMap = new Map<number, DungeonRun>();

    completedRuns.forEach((run) => {
      const dungeonId = run.dungeon.id;
      const existingRun = dungeonMap.get(dungeonId);

      if (
        !existingRun ||
        run.mythic_rating.rating > existingRun.mythic_rating.rating
      ) {
        dungeonMap.set(dungeonId, run);
      }
    });

    return Array.from(dungeonMap.values());
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
        character.name
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
          this.bestRuns = this.getBestRunsPerDungeon(seasonData.bestRuns);
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
