import { Injectable } from '@angular/core';
import { Achievement } from '../interfaces/achievement.interface';
import { CharacterService } from './character.service';

@Injectable({
  providedIn: 'root'
})
export class AchievementProgressService {
  constructor(private characterService: CharacterService) {}

  calculateProgress(
    achievements: Achievement[],
    completedMap: Map<number, number>,
    filterPredicate?: (achievement: Achievement) => boolean,
    includeChainAchievements: boolean = true
  ) {
    let deduplicatedAchievements = this.deduplicateAchievements(
      achievements,
      completedMap
    );

    if (filterPredicate) {
      deduplicatedAchievements = deduplicatedAchievements.filter(filterPredicate);
    }

    if (!includeChainAchievements) {
      deduplicatedAchievements = deduplicatedAchievements.filter(
        achievement => !achievement.data.next_achievement
      );
    }

    const completed = deduplicatedAchievements.filter(achievement => 
      this.isCollected(achievement, completedMap)
    ).length;

    return {
      completed,
      total: deduplicatedAchievements.length,
      percentage: (completed / deduplicatedAchievements.length) * 100
    };
  }

  isCollected(achievement: Achievement, completedMap: Map<number, number>): boolean {
    // Check if we have a completion timestamp
    const timestamp = completedMap.get(achievement.data.id);
    if (timestamp != null && timestamp > 0) {
      return true;
    }

    // Check criteria completion if available
    if (achievement.data.criteria?.is_completed) {
      return true;
    }

    return false;
  }

  private deduplicateAchievements(
    achievements: Achievement[],
    completedMap: Map<number, number>
  ): Achievement[] {
    const characterFaction = this.characterService.getCharacterInfo()?.faction?.name?.toLowerCase() || '';

    const achievementGroups = achievements.reduce((acc, achievement) => {
      const key = `${achievement.data.description}_${achievement.data.category.id}_${achievement.data.category.parent_category?.id || 'none'}`;
      if (!acc.has(key)) {
        acc.set(key, []);
      }
      acc.get(key)?.push(achievement);
      return acc;
    }, new Map<string, Achievement[]>());

    return Array.from(achievementGroups.values()).map(group => {
      if (group.length === 1) {
        return group[0];
      }

      const factionAchievements = group.filter(a => a.data.requirements?.faction?.name);
      
      if (factionAchievements.length > 0) {
        const factionMatch = factionAchievements.find(a => 
          a.data.requirements?.faction?.name?.toLowerCase() === characterFaction
        );
        
        if (factionMatch) {
          return factionMatch;
        }
      }

      const completed = group.find(a => this.isCollected(a, completedMap));
      if (completed) {
        return completed;
      }

      return group[0];
    });
  }
} 