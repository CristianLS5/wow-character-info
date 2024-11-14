import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AchievementService } from '../../../services/achievement.service';
import { Achievement } from '../../../interfaces/achievement.interface';
import { forkJoin, map } from 'rxjs';
import { CategoryViewComponent } from '../../../shared/components/category-view/category-view.component';
import { CategoryViewData } from '../../../interfaces/category-view.interface';
import { CharacterService } from '../../../services/character.service';

interface CategoryConfig {
  title: string;
  filterPredicate: (achievement: Achievement) => boolean;
}

@Component({
  selector: 'app-category-details',
  standalone: true,
  imports: [CategoryViewComponent],
  template: `<app-category-view [data]="categoryData"></app-category-view>`,
})
export class CategoryDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private achievementService = inject(AchievementService);
  private characterService = inject(CharacterService);

  protected achievements = signal<Achievement[]>([]);
  protected completedAchievements = signal<Map<number, number>>(new Map());
  protected categoryData!: CategoryViewData;

  private getCategoryName(achievement: Achievement): string {
    return (
      achievement.data.category.parent_category?.name ||
      achievement.data.category.name
    );
  }

  ngOnInit() {
    const categoryName = this.route.snapshot.paramMap.get('category');
    if (!categoryName) {
      console.error('No category specified');
      return;
    }

    const config = this.getCategoryConfig(categoryName);
    this.categoryData = {
      title: config.title,
      achievements: this.achievements,
      completedAchievements: this.completedAchievements,
      filterPredicate: config.filterPredicate,
    };

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
          // Only get the achievements for this category
          const filteredAchievements = allAchievements.filter(
            config.filterPredicate
          );
          this.achievements.set(filteredAchievements);

          // Create and update completedAchievements map with timestamps
          const completedMap = new Map<number, number>();
          characterAchievements.achievements.forEach((charAchievement) => {
            if (charAchievement && charAchievement.completed_timestamp) {
              completedMap.set(
                charAchievement.achievement.id,
                charAchievement.completed_timestamp
              );
            }
          });
          this.completedAchievements.set(completedMap);

          return filteredAchievements;
        })
      )
      .subscribe();
  }

  private getCategoryConfig(category: string): CategoryConfig {
    const title = this.formatCategoryTitle(category);

    return {
      title,
      filterPredicate: (achievement) =>
        this.getCategoryName(achievement) === title,
    };
  }

  private formatCategoryTitle(category: string): string {
    // Special cases mapping
    const specialCases: Record<string, string> = {
      feats: 'Feats of Strength',
      'pet-battles': 'Pet Battles',
      'player-vs-player': 'Player vs. Player',
      'dungeons-raids': 'Dungeons & Raids',
      'world-events': 'World Events',
      'expansion-features': 'Expansion Features',
    };

    // Check if it's a special case first
    if (specialCases[category]) {
      return specialCases[category];
    }

    // Default formatting for other categories
    return category
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}
