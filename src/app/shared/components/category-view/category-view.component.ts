import { Component, Input, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoadingComponent } from '../loading/loading.component';
import { Achievement } from '../../../interfaces/achievement.interface';
import {
  CategoryViewData,
  CategoryStats,
  FilteredAchievements,
} from '../../../interfaces/category-view.interface';
import { CharacterService } from '../../../services/character.service';
import { AchievementProgressService } from '../../../services/achievement-progress.service';

@Component({
  selector: 'app-category-view',
  standalone: true,
  imports: [CommonModule, LoadingComponent],
  templateUrl: './category-view.component.html',
})
export class CategoryViewComponent {
  @Input() data!: CategoryViewData;

  // Inject CharacterService in constructor
  constructor(
    private achievementProgressService: AchievementProgressService,
    private characterService: CharacterService
  ) {}

  // Signal for filtered achievements by category
  private filteredAchievements = signal<Record<string, FilteredAchievements>>({});

  // Computed values
  protected categories = computed(() =>
    this.groupByCategory(this.data.achievements())
  );

  protected isCollected = computed(
    () => (achievement: Achievement) => {
      // Check if we have a completion timestamp
      const timestamp = this.data.completedAchievements()?.get(achievement.data.id);
      if (timestamp != null && timestamp > 0) {
        return true;
      }

      // Check criteria completion if available
      if (achievement.data.criteria) {
        return achievement.data.criteria.is_completed === true;
      }

      return false;
    }
  );

  protected getCompletionTimestamp = computed(
    () => (achievement: Achievement) =>
      this.data.completedAchievements()?.get(achievement.data.id) || null
  );

  protected totalProgress = computed(() => {
    const progress = this.achievementProgressService.calculateProgress(
      this.data.achievements(),
      this.data.completedAchievements(),
      this.data.filterPredicate
    );
    return `${progress.completed}/${progress.total}`;
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

  protected getAchievementChain(achievement: Achievement): Achievement[] {
    const chain: Achievement[] = [];
    let current: Achievement | undefined = achievement;

    // First, find the earliest achievement in the chain
    while (current) {
        const previous = this.data.achievements().find(a => 
            a.data.next_achievement?.id === current?.data.id
        );
        if (!previous) break;
        current = previous;
    }

    // Now build the chain from first to last
    while (current) {
        chain.push(current);
        current = this.data.achievements().find(a => 
            current?.data.next_achievement?.id === a.data.id
        );
    }

    return chain;
  }

  protected getChainAchievements(achievement: Achievement): Achievement[] {
    const chain = this.getAchievementChain(achievement);
    // Return the entire chain, including the last achievement
    return chain;
  }

  protected getPreviousAchievements(achievement: Achievement): Achievement[] {
    const chain = this.getChainAchievements(achievement);
    return chain.slice(0, -1); // Return all but the last achievement
  }

  protected getTotalCategoryProgress(categoryName: string) {
    const achievements = this.getFilteredAchievements(categoryName);
    const progress = this.achievementProgressService.calculateProgress(
      achievements,
      this.data.completedAchievements(),
      this.data.filterPredicate
    );
    return `${progress.completed}/${progress.total}`;
  }

  protected getCompletionDate(achievementId: number): string | null {
    const timestamp = this.data.completedAchievements().get(achievementId);
    
    if (!timestamp || typeof timestamp !== 'number') {
      return null;
    }

    try {
      const date = new Date(timestamp);
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return null;
    }
  }

  protected getFilteredMainAchievements(categoryName: string): Achievement[] {
    // First filter achievements by category
    let achievements = this.data
      .achievements()
      .filter(achievement => achievement.data.category.name === categoryName)
      .filter(achievement => !achievement.data.next_achievement);
    
    achievements = this.deduplicateAchievements(achievements);
    
    const filter = this.filteredAchievements()[categoryName]?.filter() || 'all';
    
    // For 'all' filter, return all parent achievements
    if (filter === 'all') {
      return achievements;
    }

    // For 'collected' or 'uncollected', only show parents that have matching children
    return achievements.filter(achievement => {
      const chain = this.getChainAchievements(achievement);
      
      if (filter === 'collected') {
        // Show parent if any child is collected
        return chain.some(a => this.isCollected()(a));
      }
      
      if (filter === 'uncollected') {
        // Show parent if any child is uncollected
        return chain.some(a => !this.isCollected()(a));
      }
      
      return true;
    });
  }

  protected openWowheadLink(achievementId: number): void {
    window.open(`https://www.wowhead.com/achievement=${achievementId}`, '_blank');
  }

  protected hasChain(achievement: Achievement): boolean {
    return this.getAchievementChain(achievement).length > 1;
  }

  // Helper method to deduplicate achievements
  private deduplicateAchievements(achievements: Achievement[]): Achievement[] {
    const characterFaction = this.characterService.getCharacterInfo()?.faction?.name?.toLowerCase() || '';

    // Create a map to group achievements by their unique characteristics
    const achievementGroups = achievements.reduce((acc, achievement) => {
      // Create a unique key combining description, category ID, and parent category ID
      const key = `${achievement.data.description}_${achievement.data.category.id}_${achievement.data.category.parent_category?.id || 'none'}`;
      if (!acc.has(key)) {
        acc.set(key, []);
      }
      acc.get(key)?.push(achievement);
      return acc;
    }, new Map<string, Achievement[]>());

    // For each group, select the appropriate achievement
    return Array.from(achievementGroups.values()).map(group => {
      if (group.length === 1) {
        return group[0];
      }

      // Check if these are faction-specific achievements
      const factionAchievements = group.filter(a => a.data.requirements?.faction?.name);
      
      if (factionAchievements.length > 0) {
        // Try to find achievement matching character's faction
        const factionMatch = factionAchievements.find(a => 
          a.data.requirements?.faction?.name?.toLowerCase() === characterFaction
        );
        
        if (factionMatch) {
          return factionMatch;
        }
      }

      // If no faction match or not faction-specific, prefer completed ones
      const completed = group.find(a => this.isCollected()(a));
      if (completed) {
        return completed;
      }

      // If none are completed, take the first one
      return group[0];
    });
  }

  protected getFactionRequirement(achievement: Achievement): string | null {
    const characterFaction = this.characterService.getCharacterInfo()?.faction?.name;
    const achievementFaction = achievement.data.requirements?.faction?.name;
    
    // Only show requirement if it's for the opposite faction
    if (!achievementFaction || achievementFaction === characterFaction) {
      return null;
    }
    
    // If character is Horde, show Alliance Only, and vice versa
    return achievementFaction === 'Alliance' ? 'Alliance Only' : 'Horde Only';
  }

  // Add new method to filter chain achievements
  protected getFilteredChainAchievements(achievement: Achievement): Achievement[] {
    const chain = this.getChainAchievements(achievement);
    const categoryName = achievement.data.category.name;
    const filter = this.filteredAchievements()[categoryName]?.filter() || 'all';
    
    switch (filter) {
      case 'collected':
        // Only show collected achievements in the chain
        return chain.filter(a => this.isCollected()(a));
      case 'uncollected':
        // Only show uncollected achievements in the chain
        return chain.filter(a => !this.isCollected()(a));
      default:
        // For 'all', show the complete chain
        return chain;
    }
  }

  protected hasCollectedChildren(achievement: Achievement): boolean {
    const filter = this.filteredAchievements()[achievement.data.category.name]?.filter() || 'all';
    const chain = this.getFilteredChainAchievements(achievement);
    
    switch (filter) {
      case 'collected':
        return chain.some(a => this.isCollected()(a));
      case 'uncollected':
        return chain.some(a => !this.isCollected()(a));
      default:
        return this.isCollected()(achievement);
    }
  }
}
