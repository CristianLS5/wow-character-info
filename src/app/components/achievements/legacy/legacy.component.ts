import { Component, OnInit, inject } from '@angular/core';
import { AchievementService } from '../../../services/achievement.service';
import { CharacterService } from '../../../services/character.service';
import { CommonModule } from '@angular/common';
import { Achievement } from '../../../interfaces/achievement.interface';
import { Observable, forkJoin, map } from 'rxjs';

interface AchievementChain {
  mainAchievement: Achievement;
  relatedAchievements: Achievement[];
}

@Component({
  selector: 'app-legacy',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './legacy.component.html',
  styleUrls: ['./legacy.component.sass'],
})
export class LegacyComponent implements OnInit {
  achievements$!: Observable<Achievement[]>;
  private completedAchievementsMap = new Map<number, boolean>();
  private achievementsCache: Achievement[] = [];
  private filteredAchievements: Record<string, {
    achievements: Achievement[],
    filter: 'all' | 'collected' | 'uncollected'
  }> = {};

  private achievementService = inject(AchievementService);
  private characterService = inject(CharacterService);

  private allCategoryAchievements: Record<string, Achievement[]> = {};

  ngOnInit() {
    const characterInfo = this.characterService.getCharacterInfo();
    
    if (!characterInfo) {
      console.error('Character information not available');
      return;
    }

    const { realmSlug, characterName } = characterInfo;

    this.achievements$ = forkJoin({
      allAchievements: this.achievementService.getLegacyAchievements(),
      characterAchievements: this.achievementService.getCharacterAchievements(
        realmSlug,
        characterName.toLowerCase()
      )
    }).pipe(
      map(({ allAchievements, characterAchievements }) => {
        console.log('All Legacy Achievements:', {
          total: allAchievements.length,
          categories: [...new Set(allAchievements.map(a => a.data.category.name))],
          categoryBreakdown: allAchievements.reduce((acc, achievement) => {
            const categoryName = achievement.data.category.name;
            acc[categoryName] = (acc[categoryName] || 0) + 1;
            return acc;
          }, {} as Record<string, number>),
          sampleAchievement: allAchievements[0],
          achievementIds: allAchievements.map(a => a.data.id)
        });

        console.log('Character Achievements:', {
          total: characterAchievements.achievements.length,
          totalQuantity: characterAchievements.total_quantity,
          totalPoints: characterAchievements.total_points,
          completedCount: characterAchievements.achievements.filter(a => a.criteria?.is_completed).length,
          sampleCompletedAchievement: characterAchievements.achievements.find(a => a.criteria?.is_completed),
          sampleIncompleteAchievement: characterAchievements.achievements.find(a => !a.criteria?.is_completed),
          achievementIds: characterAchievements.achievements.map(a => a.achievement.id)
        });
        
        console.log('Legacy Achievements:', characterAchievements.achievements
          .filter(charAchievement => {
            const category = allAchievements.find(a => a.data.id === charAchievement.achievement.id)?.data.category;
            return category?.name === 'Legacy' || category?.parent_category?.name === 'Legacy';
          })
          .map(charAchievement => ({
            id: charAchievement.achievement.id,
            name: charAchievement.achievement.name,
            isCompleted: charAchievement.criteria?.is_completed,
            achievement: allAchievements.find(a => a.data.id === charAchievement.achievement.id)?.data
          }))
        );

        characterAchievements.achievements.forEach(charAchievement => {
          if (charAchievement && charAchievement.criteria) {
            this.completedAchievementsMap.set(
              charAchievement.achievement.id,
              charAchievement.criteria.is_completed
            );
          }
        });

        console.log('Completed Achievements Map:', {
          size: this.completedAchievementsMap.size,
          completedCount: Array.from(this.completedAchievementsMap.values()).filter(v => v).length,
          incompleteCount: Array.from(this.completedAchievementsMap.values()).filter(v => !v).length,
          sampleEntries: Array.from(this.completedAchievementsMap.entries()).slice(0, 5)
        });

        const legacyIds = new Set(allAchievements.map(a => a.data.id));
        const characterIds = new Set(characterAchievements.achievements.map(a => a.achievement.id));
        
        console.log('Achievement ID Analysis:', {
          legacyAchievementsCount: legacyIds.size,
          characterAchievementsCount: characterIds.size,
          matchingIds: Array.from(legacyIds).filter(id => characterIds.has(id)).length,
          onlyInLegacy: Array.from(legacyIds).filter(id => !characterIds.has(id)).length,
          onlyInCharacter: Array.from(characterIds).filter(id => !legacyIds.has(id)).length,
          sampleMismatches: {
            inLegacyNotCharacter: Array.from(legacyIds).filter(id => !characterIds.has(id)).slice(0, 5),
            inCharacterNotLegacy: Array.from(characterIds).filter(id => !legacyIds.has(id)).slice(0, 5)
          }
        });

        const categoryAnalysis = allAchievements.reduce((acc, achievement) => {
          const categoryName = achievement.data.category.name;
          if (!acc[categoryName]) {
            acc[categoryName] = {
              total: 0,
              completed: 0,
              incomplete: 0,
              achievements: []
            };
          }
          
          acc[categoryName].total++;
          if (this.completedAchievementsMap.get(achievement.data.id)) {
            acc[categoryName].completed++;
          } else {
            acc[categoryName].incomplete++;
          }
          acc[categoryName].achievements.push({
            id: achievement.data.id,
            name: achievement.data.name,
            isCompleted: this.completedAchievementsMap.get(achievement.data.id) || false
          });
          
          return acc;
        }, {} as Record<string, {
          total: number;
          completed: number;
          incomplete: number;
          achievements: Array<{
            id: number;
            name: string;
            isCompleted: boolean;
          }>;
        }>);

        console.log('Category Analysis:', categoryAnalysis);

        this.achievementsCache = allAchievements;
        return allAchievements;
      })
    );
  }

  isCollected(achievement: Achievement): boolean {
    return this.completedAchievementsMap.get(achievement.data.id) || false;
  }

  getCollectedCount(achievements: Achievement[]): number {
    const categoryName = achievements[0]?.data.category.name;
    const allAchievements = this.allCategoryAchievements[categoryName] || achievements;
    return allAchievements.filter(achievement => this.isCollected(achievement)).length;
  }

  filterAchievements(event: Event, categoryName: string) {
    const filterValue = (event.target as HTMLSelectElement).value as 'all' | 'collected' | 'uncollected';
    this.initializeCategoryAchievements(categoryName);
    this.filteredAchievements[categoryName].filter = filterValue;
  }

  getFilteredAchievements(categoryName: string): Achievement[] {
    if (!this.filteredAchievements[categoryName]) {
      this.initializeCategoryAchievements(categoryName);
    }

    if (!this.filteredAchievements[categoryName]) {
      return [];
    }

    const { achievements, filter } = this.filteredAchievements[categoryName];
    const allAchievements = this.allCategoryAchievements[categoryName] || [];

    let filteredAll: Achievement[];
    switch (filter) {
      case 'collected':
        filteredAll = allAchievements.filter(a => this.isCollected(a));
        break;
      case 'uncollected':
        filteredAll = allAchievements.filter(a => !this.isCollected(a));
        break;
      default:
        filteredAll = allAchievements;
    }

    return achievements.filter(latestAchievement => {
      const chain = this.getAchievementChain(latestAchievement);
      return chain.some(chainAchievement => 
        filteredAll.some(fa => fa.data.id === chainAchievement.data.id)
      );
    });
  }

  private initializeCategoryAchievements(categoryName: string) {
    if (!this.filteredAchievements[categoryName]) {
      const categoryAchievements = this.achievementsCache.filter(a => 
        (a.data.category?.name || 'General') === categoryName
      );
      this.allCategoryAchievements[categoryName] = categoryAchievements;
      
      const latestAchievements = this.buildAchievementChains(categoryAchievements);
      
      this.filteredAchievements[categoryName] = {
        achievements: latestAchievements,
        filter: 'all'
      };
    }
  }

  private buildAchievementChains(achievements: Achievement[]): Achievement[] {
    const achievementMap = new Map<number, Achievement>();
    const hasParentMap = new Set<number>();
    const chainEndpoints = new Map<number, Achievement>();
    
    achievements.forEach(achievement => {
      achievementMap.set(achievement.data.id, achievement);
    });

    achievements.forEach(achievement => {
      let current = achievement;
      let chainHead = current;
      
      while (current.data.next_achievement) {
        const nextAchievement = achievementMap.get(current.data.next_achievement.id);
        if (nextAchievement) {
          hasParentMap.add(current.data.id);
          chainHead = nextAchievement;
          current = nextAchievement;
        } else {
          break;
        }
      }
      
      if (!hasParentMap.has(chainHead.data.id)) {
        chainEndpoints.set(chainHead.data.id, chainHead);
      }
    });

    return Array.from(chainEndpoints.values());
  }

  getAchievementChain(achievement: Achievement): Achievement[] {
    const chain: Achievement[] = [];
    let current: Achievement | undefined = achievement;
    
    while (current) {
      chain.push(current);
      current = this.achievementsCache.find(a => 
        a.data.next_achievement?.id === current?.data.id
      );
    }
    
    return chain.reverse();
  }

  groupByCategory(achievements: Achievement[] | null) {
    if (!achievements) return [];
    
    const grouped = achievements.reduce((acc, achievement) => {
      const categoryName = achievement.data.category?.name || 'General';
      
      if (!acc[categoryName]) {
        acc[categoryName] = { 
          name: categoryName, 
          achievements: [],
          displayOrder: achievement.data.display_order || 0
        };
      }
      acc[categoryName].achievements.push(achievement);
      return acc;
    }, {} as Record<string, { 
      name: string; 
      achievements: Achievement[]; 
      displayOrder: number 
    }>);

    Object.entries(grouped).forEach(([categoryName, category]) => {
      this.initializeCategoryAchievements(categoryName);
      category.achievements = this.filteredAchievements[categoryName].achievements;
    });

    return Object.values(grouped).sort((a, b) => a.displayOrder - b.displayOrder);
  }

  getTotalCollectedCount(categoryName: string): number {
    return this.allCategoryAchievements[categoryName]?.filter(
      achievement => this.isCollected(achievement)
    ).length || 0;
  }

  getTotalAchievementsCount(categoryName: string): number {
    return this.allCategoryAchievements[categoryName]?.length || 0;
  }

  getPreviousAchievements(achievement: Achievement): Achievement[] {
    // Get the chain in reverse order (from earliest to latest)
    const chain = this.getAchievementChain(achievement);
    // Remove the latest achievement (last in the array)
    return chain.slice(0, -1);
  }
}
