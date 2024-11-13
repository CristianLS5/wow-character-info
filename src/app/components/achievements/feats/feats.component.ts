import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CategoryViewComponent } from '../../../shared/components/category-view/category-view.component';
import { AchievementService } from '../../../services/achievement.service';
import { CharacterService } from '../../../services/character.service';
import { Achievement } from '../../../interfaces/achievement.interface';
import { CategoryViewData } from '../../../interfaces/category-view.interface';
import { forkJoin, map } from 'rxjs';

@Component({
  selector: 'app-feats',
  standalone: true,
  imports: [CommonModule, CategoryViewComponent],
  templateUrl: './feats.component.html',
})
export class FeatsComponent implements OnInit {
  private achievementService = inject(AchievementService);
  private characterService = inject(CharacterService);

  // Signals
  protected achievements = signal<Achievement[]>([]);
  protected completedAchievements = signal<Map<number, boolean>>(new Map());

  private getCategoryName(achievement: Achievement): string {
    return (
      achievement.data.category.parent_category?.name ||
      achievement.data.category.name
    );
  }

  // Category view data
  protected categoryData: CategoryViewData = {
    title: 'Feats of Strength',
    achievements: this.achievements,
    completedAchievements: this.completedAchievements,
    filterPredicate: (achievement: Achievement) =>
      this.getCategoryName(achievement) === 'Feats of Strength'
  };

  ngOnInit() {
    const characterInfo = this.characterService.getCharacterInfo();
    if (!characterInfo) {
      console.error('Character information not available');
      return;
    }

    const { realmSlug, characterName } = characterInfo;

    forkJoin({
      allAchievements: this.achievementService.getAllAchievements(),
      characterAchievements: this.achievementService.getCharacterAchievements(
        realmSlug,
        characterName.toLowerCase()
      ),
    })
      .pipe(
        map(({ allAchievements, characterAchievements }) => {
          // Filter achievements here instead of in service
          const featsAchievements = allAchievements.filter(
            achievement => this.getCategoryName(achievement) === 'Feats of Strength'
          );
          
          // Update achievements signal
          this.achievements.set(featsAchievements);

          // Create and update completedAchievements map
          const completedMap = new Map<number, boolean>();
          characterAchievements.achievements.forEach((charAchievement) => {
            if (charAchievement) {
              completedMap.set(
                charAchievement.achievement.id,
                charAchievement.completed_timestamp != null
              );
            }
          });
          this.completedAchievements.set(completedMap);

          return featsAchievements;
        })
      )
      .subscribe();
  }
}
