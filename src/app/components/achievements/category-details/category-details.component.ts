import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AchievementService } from '../../../services/achievement.service';
import { Achievement } from '../../../interfaces/achievement.interface';
import { forkJoin, map, finalize } from 'rxjs';
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
  protected categoryData: CategoryViewData = {
    title: '',
    achievements: this.achievements,
    completedAchievements: this.completedAchievements,
    filterPredicate: () => true,
    isLoading: true,
    error: null
  };

  ngOnInit() {
    const categoryName = this.route.snapshot.paramMap.get('category');
    if (!categoryName) {
      this.categoryData = {
        ...this.categoryData,
        isLoading: false,
        error: 'No category specified'
      };
      return;
    }

    const config = this.getCategoryConfig(categoryName);
    this.categoryData = {
      ...this.categoryData,
      title: config.title,
      filterPredicate: config.filterPredicate
    };

    const characterInfo = this.characterService.getCharacterInfo();
    if (!characterInfo) {
      this.categoryData = {
        ...this.categoryData,
        isLoading: false,
        error: 'Character information not available'
      };
      return;
    }

    forkJoin({
      allAchievements: this.achievementService.getAllAchievements(),
      characterAchievements: this.achievementService.getCharacterAchievements(
        characterInfo.realm.slug,
        characterInfo.name.toLowerCase()
      ),
    }).pipe(
      map(({ allAchievements, characterAchievements }) => {
        const filteredAchievements = allAchievements.filter(config.filterPredicate);
        this.achievements.set(filteredAchievements);

        const completedMap = new Map<number, number>();
        characterAchievements.achievements.forEach((charAchievement) => {
          if (charAchievement?.completed_timestamp) {
            completedMap.set(
              charAchievement.achievement.id,
              charAchievement.completed_timestamp
            );
          }
        });
        this.completedAchievements.set(completedMap);

        return filteredAchievements;
      })
    ).subscribe({
      next: () => {
        this.categoryData = {
          ...this.categoryData,
          isLoading: false
        };
      },
      error: (err) => {
        console.error('Error loading achievements:', err);
        this.categoryData = {
          ...this.categoryData,
          isLoading: false,
          error: 'Failed to load achievements'
        };
      }
    });
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

  private getCategoryName(achievement: Achievement): string {
    return (
      achievement.data.category.parent_category?.name ||
      achievement.data.category.name
    );
  }
}
