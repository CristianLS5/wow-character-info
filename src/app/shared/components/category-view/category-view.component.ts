import { Component, Input, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Achievement } from '../../../interfaces/achievement.interface';
import {
  CategoryViewData,
  CategoryStats,
  FilteredAchievements,
} from '../../../interfaces/category-view.interface';

@Component({
  selector: 'app-category-view',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './category-view.component.html',
})
export class CategoryViewComponent {
  @Input() data!: CategoryViewData;

  // Signal for filtered achievements by category
  private filteredAchievements = signal<Record<string, FilteredAchievements>>(
    {}
  );

  // Computed values
  protected categories = computed(() =>
    this.groupByCategory(this.data.achievements())
  );

  protected isCollected = computed(
    () => (achievement: Achievement) =>
      this.data.completedAchievements()?.get(achievement.data.id) || false
  );

  protected totalProgress = computed(() => {
    const achievements = this.data.achievements();
    const completedMap = this.data.completedAchievements();
    
    // Only count achievements that match our filter predicate
    const filteredAchievements = achievements.filter(this.data.filterPredicate);
    const completed = filteredAchievements
      .filter(achievement => completedMap.get(achievement.data.id))
      .length;

    return `${completed}/${filteredAchievements.length}`;
  });

  getFilteredAchievements(categoryName: string): Achievement[] {
    const filter = this.filteredAchievements()[categoryName]?.filter() || 'all';
    const achievements = this.data
      .achievements()
      .filter((a) => a.data.category.name === categoryName);

    switch (filter) {
      case 'collected':
        return achievements.filter((a) => this.isCollected()(a));
      case 'uncollected':
        return achievements.filter((a) => !this.isCollected()(a));
      default:
        return achievements;
    }
  }

  filterAchievements(event: Event, categoryName: string) {
    const filter = (event.target as HTMLSelectElement).value as
      | 'all'
      | 'collected'
      | 'uncollected';
    this.filteredAchievements.update((current) => ({
      ...current,
      [categoryName]: {
        achievements: this.data.achievements(),
        filter: signal(filter),
      },
    }));
  }

  private groupByCategory(achievements: Achievement[]): CategoryStats[] {
    const grouped = achievements.reduce((acc, achievement) => {
      const categoryName = achievement.data.category?.name || 'General';

      if (!acc[categoryName]) {
        acc[categoryName] = {
          name: categoryName,
          achievements: [],
          displayOrder: achievement.data.display_order || 0,
        };
      }
      acc[categoryName].achievements.push(achievement);
      return acc;
    }, {} as Record<string, CategoryStats>);

    return Object.values(grouped).sort(
      (a, b) => a.displayOrder - b.displayOrder
    );
  }

  getAchievementChain(achievement: Achievement): Achievement[] {
    const chain: Achievement[] = [];
    let current: Achievement | undefined = achievement;

    while (current) {
      chain.push(current);
      current = this.data
        .achievements()
        .find((a) => a.data.next_achievement?.id === current?.data.id);
    }

    return chain.reverse();
  }

  getPreviousAchievements(achievement: Achievement): Achievement[] {
    const chain = this.getAchievementChain(achievement);
    return chain.slice(0, -1);
  }

  protected getTotalCategoryProgress(categoryName: string) {
    const achievements = this.data.achievements()
      .filter(a => a.data.category.name === categoryName)
      .filter(this.data.filterPredicate);

    const completed = achievements
      .filter(a => this.isCollected()(a))
      .length;

    return `${completed}/${achievements.length}`;
  }
}
