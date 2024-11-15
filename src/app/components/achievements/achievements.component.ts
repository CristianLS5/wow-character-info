import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AchievementService } from '../../services/achievement.service';
import { CharacterService } from '../../services/character.service';
import * as d3 from 'd3';
import { Achievement } from '../../interfaces/achievement.interface';
import { forkJoin } from 'rxjs';
import { Router } from '@angular/router';

interface CategoryStats {
  completed: number;
  total: number;
  percentage: number;
}

interface CategoryProgress {
  name: string;
  completed: number;
  total: number;
  percentage: number;
  elementId: string;
}

interface ArcData {
  endAngle: number;
  startAngle: number;
  innerRadius: number;
  outerRadius: number;
}

@Component({
  selector: 'app-achievements',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './achievements.component.html',
  styleUrls: ['./achievements.component.sass'],
})
export class AchievementsComponent implements OnInit {
  private achievementService = inject(AchievementService);
  private characterService = inject(CharacterService);
  private router = inject(Router);
  achievementStats = signal<{
    overall: CategoryStats;
    legacy: CategoryStats;
    feats: CategoryStats;
  } | null>(null);
  categoryProgress = signal<CategoryProgress[]>([]);
  parentCategories = signal<CategoryProgress[]>([]);

  ngOnInit() {
    const characterInfo = this.characterService.getCharacterInfo();

    if (!characterInfo) {
      console.error('Character information not available');
      return;
    }

    const { realmSlug, characterName } = characterInfo;
    console.log(`Loading achievements for ${characterName}-${realmSlug}`);

    forkJoin({
      allAchievements: this.achievementService.getAllAchievements(),
      characterAchievements: this.achievementService.getCharacterAchievements(
        realmSlug,
        characterName.toLowerCase()
      ),
    }).subscribe({
      next: ({ allAchievements, characterAchievements }) => {
        // Debug logging
        console.log('Achievement Data:', {
          allAchievementsCount: allAchievements.length,
          characterAchievementsCount: characterAchievements.achievements.length,
          completedAchievements: characterAchievements.achievements.filter(
            (a) => a?.completed_timestamp != null
          ).length,
        });

        const completedAchievementsMap = new Map();
        characterAchievements.achievements.forEach((charAchievement) => {
          if (charAchievement) {
            completedAchievementsMap.set(
              charAchievement.achievement.id,
              charAchievement.completed_timestamp != null
            );
          }
        });

        // Calculate stats and categories
        const stats = this.calculateAchievementStats(
          allAchievements,
          completedAchievementsMap
        );
        const parentCats = this.calculateParentCategories(
          allAchievements,
          completedAchievementsMap
        );

        console.log('Calculated Data:', {
          stats,
          parentCategories: parentCats,
        });

        // Update signals
        this.achievementStats.set(stats);
        this.parentCategories.set(parentCats);

        // Create arc tweens after a short delay
        setTimeout(() => {
          if (stats) {
            this.createArcTween(
              'legacy-achievement-arc',
              stats.legacy.percentage,
              stats.legacy.completed,
              stats.legacy.total
            );
            this.createArcTween(
              'main-achievement-arc',
              stats.overall.percentage,
              stats.overall.completed,
              stats.overall.total
            );
            this.createArcTween(
              'feats-achievement-arc',
              stats.feats.percentage,
              stats.feats.completed,
              stats.feats.total
            );
          }

          parentCats.forEach((category) => {
            this.createSmallArcTween(
              `category-arc-${category.elementId}`,
              category.percentage,
              category.completed,
              category.total
            );
          });
        }, 100);
      },
      error: (error) => {
        console.error('Error loading achievements:', error);
      },
    });
  }

  private getCategoryName(achievement: Achievement): string {
    if (achievement.data.category.name === 'Feats of Strength' || 
        achievement.data.category.name === 'Legacy') {
      return achievement.data.category.name;
    }
    
    return achievement.data.category.parent_category?.name || 
           achievement.data.category.name;
  }

  private createArcTween(
    elementId: string,
    percentage: number,
    completed: number,
    total: number
  ) {
    const width = 200;
    const height = 200;
    const thickness = 20;

    d3.select(`#${elementId}`).selectAll('*').remove();

    const svg = d3
      .select(`#${elementId}`)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${width / 2},${height / 2})`);

    const arc = d3
      .arc<ArcData>()
      .innerRadius(width / 2 - thickness)
      .outerRadius(width / 2)
      .startAngle(0)
      .cornerRadius(thickness / 2);

    // Background arc
    svg
      .append('path')
      .datum({
        endAngle: 2 * Math.PI,
        startAngle: 0,
        innerRadius: width / 2 - thickness,
        outerRadius: width / 2,
      } as ArcData)
      .style('fill', 'rgba(59, 52, 35, 1)')
      .attr('d', arc);

    // Foreground arc
    const foreground = svg
      .append('path')
      .datum({
        endAngle: 0,
        startAngle: 0,
        innerRadius: width / 2 - thickness,
        outerRadius: width / 2,
      } as ArcData)
      .style('fill', '#3b82f6')
      .attr('d', arc);

    // Animation
    const targetAngle = (percentage / 100) * (2 * Math.PI);
    foreground
      .transition()
      .duration(750)
      .attrTween('d', function (d: ArcData) {
        const interpolate = d3.interpolate(d.endAngle, targetAngle);
        return function (t: number): string {
          d.endAngle = interpolate(t);
          return arc(d) || '';
        };
      });

    // Add percentage text
    svg
      .append('text')
      .attr('class', 'percentage')
      .attr('text-anchor', 'middle')
      .attr('dy', '-0.5em')
      .style('font-size', '2em')
      .style('fill', '#ffffff')
      .text(`${Math.round(percentage)}%`);

    // Add progress text
    svg
      .append('text')
      .attr('class', 'progress')
      .attr('text-anchor', 'middle')
      .attr('dy', '1.5em')
      .style('font-size', '1.2em')
      .style('fill', '#ffffff')
      .text(`${completed}/${total}`);
  }

  private createSmallArcTween(
    elementId: string,
    percentage: number,
    completed: number,
    total: number
  ) {
    const width = 128;
    const height = 128;
    const thickness = 12;

    d3.select(`#${elementId}`).selectAll('*').remove();

    const svg = d3
      .select(`#${elementId}`)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${width / 2},${height / 2})`);

    const arc = d3
      .arc<ArcData>()
      .innerRadius(width / 2 - thickness)
      .outerRadius(width / 2)
      .startAngle(0)
      .cornerRadius(thickness / 2);

    // Background arc
    svg
      .append('path')
      .datum({
        endAngle: 2 * Math.PI,
        startAngle: 0,
        innerRadius: width / 2 - thickness,
        outerRadius: width / 2,
      } as ArcData)
      .style('fill', '#4a4332')
      .attr('d', arc);

    // Foreground arc
    const foreground = svg
      .append('path')
      .datum({
        endAngle: 0,
        startAngle: 0,
        innerRadius: width / 2 - thickness,
        outerRadius: width / 2,
      } as ArcData)
      .style('fill', '#3b82f6')
      .attr('d', arc);

    // Animation
    const targetAngle = (percentage / 100) * (2 * Math.PI);
    foreground
      .transition()
      .duration(750)
      .attrTween('d', function (d: ArcData) {
        const interpolate = d3.interpolate(d.endAngle, targetAngle);
        return function (t: number): string {
          d.endAngle = interpolate(t);
          return arc(d) || '';
        };
      });

    // Add percentage text
    svg
      .append('text')
      .attr('class', 'percentage')
      .attr('text-anchor', 'middle')
      .attr('dy', '-0.3em')
      .style('font-size', '1.2em')
      .style('fill', '#ffffff')
      .text(`${Math.round(percentage)}%`);

    // Add progress text
    svg
      .append('text')
      .attr('class', 'progress')
      .attr('text-anchor', 'middle')
      .attr('dy', '1em')
      .style('font-size', '0.9em')
      .style('fill', '#ffffff')
      .text(`${completed}/${total}`);
  }

  private sanitizeId(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-') // Replace any non-alphanumeric character with dash
      .replace(/-+/g, '-') // Replace multiple dashes with single dash
      .replace(/^-|-$/g, ''); // Remove leading/trailing dashes
  }

  private calculateParentCategories(
    allAchievements: Achievement[],
    completedMap: Map<number, boolean>
  ): CategoryProgress[] {
    // Get character faction once
    const characterFaction = this.characterService.getCharacterInfo()?.faction?.name?.toLowerCase() || '';
    
    // Get resolved achievements (non-duplicates)
    const resolvedAchievements = this.resolveDuplicates(allAchievements, characterFaction);

    // Only process non-duplicate achievements
    const validAchievements = allAchievements.filter(ach => 
      resolvedAchievements.has(ach.achievementId)
    );

    const parentCategories = new Map<string, {
      completed: number;
      total: number;
      achievements: Achievement[];
    }>();

    // Calculate categories with filtered achievements
    validAchievements.forEach((achievement) => {
      const categoryName = this.getCategoryName(achievement);

      // Skip Feats of Strength and Legacy achievements
      if (categoryName === 'Feats of Strength' || categoryName === 'Legacy') {
        return;
      }

      if (!parentCategories.has(categoryName)) {
        parentCategories.set(categoryName, {
          completed: 0,
          total: 0,
          achievements: [],
        });
      }

      const category = parentCategories.get(categoryName)!;
      category.total++;
      if (completedMap.has(achievement.achievementId)) {
        category.completed++;
      }
      category.achievements.push(achievement);
    });

    return Array.from(parentCategories.entries()).map(([name, stats]) => ({
      name,
      completed: stats.completed,
      total: stats.total,
      percentage: (stats.completed / stats.total) * 100,
      elementId: this.sanitizeId(name),
    }));
  }

  private calculateAchievementStats(
    allAchievements: Achievement[],
    completedMap: Map<number, boolean>
  ): { overall: CategoryStats; legacy: CategoryStats; feats: CategoryStats } {
    // Get character faction once
    const characterFaction = this.characterService.getCharacterInfo()?.faction?.name?.toLowerCase() || '';
    console.log('Character Faction:', characterFaction); // Debug log

    // Get resolved achievements (non-duplicates)
    const resolvedAchievements = this.resolveDuplicates(allAchievements, characterFaction);

    // Only process non-duplicate achievements
    const validAchievements = allAchievements.filter(ach => 
      resolvedAchievements.has(ach.achievementId)
    );

    const stats = {
      overall: { completed: 0, total: 0, percentage: 0 },
      legacy: { completed: 0, total: 0, percentage: 0 },
      feats: { completed: 0, total: 0, percentage: 0 },
    };

    // Calculate stats with filtered achievements
    validAchievements.forEach((achievement) => {
      const categoryName = this.getCategoryName(achievement);

      if (categoryName === 'Legacy') {
        stats.legacy.total++;
        if (completedMap.has(achievement.achievementId)) {
          stats.legacy.completed++;
        }
      } else if (categoryName === 'Feats of Strength') {
        stats.feats.total++;
        if (completedMap.has(achievement.achievementId)) {
          stats.feats.completed++;
        }
      } else {
        stats.overall.total++;
        if (completedMap.has(achievement.achievementId)) {
          stats.overall.completed++;
        }
      }
    });

    // Calculate percentages
    stats.overall.percentage = stats.overall.total > 0 
      ? (stats.overall.completed / stats.overall.total) * 100 
      : 0;
    stats.legacy.percentage = stats.legacy.total > 0 
      ? (stats.legacy.completed / stats.legacy.total) * 100 
      : 0;
    stats.feats.percentage = stats.feats.total > 0 
      ? (stats.feats.completed / stats.feats.total) * 100 
      : 0;

    // Debug logging
    console.log('Achievement Stats:', {
      overall: {
        total: stats.overall.total,
        completed: stats.overall.completed,
        percentage: stats.overall.percentage
      },
      legacy: {
        total: stats.legacy.total,
        completed: stats.legacy.completed,
        percentage: stats.legacy.percentage
      },
      feats: {
        total: stats.feats.total,
        completed: stats.feats.completed,
        percentage: stats.feats.percentage
      }
    });

    return stats;
  }

  navigateTo(category: string) {
    this.router.navigate(['/achievements', category.toLowerCase()]);
  }

  private isDuplicateAchievement(a1: Achievement, a2: Achievement): boolean {
    const getMainCategory = (ach: Achievement) => 
      ach.data.category.parent_category?.name || ach.data.category.name;

    return (
      getMainCategory(a1) === getMainCategory(a2) &&
      a1.data.description === a2.data.description &&
      a1.data.name === a2.data.name &&
      a1.achievementId !== a2.achievementId
    );
  }

  private resolveDuplicates(
    allAchievements: Achievement[],
    characterFaction: string
  ): Set<number> {
    const achievementsByName = new Map<string, Achievement[]>();
    const resolvedAchievements = new Set<number>();
    const duplicatesFound = new Set<number>();

    // First pass: Group achievements by name
    allAchievements.forEach((achievement) => {
      const achievementName = achievement.data.name;
      if (!achievementsByName.has(achievementName)) {
        achievementsByName.set(achievementName, []);
      }
      achievementsByName.get(achievementName)!.push(achievement);
    });

    // Resolve duplicates
    achievementsByName.forEach((achievements, name) => {
      if (achievements.length > 1) {
        // Group by category + description to find true duplicates
        const groups = achievements.reduce((acc, achievement) => {
          const key = `${achievement.data.category.parent_category?.name || achievement.data.category.name}_${achievement.data.description}`;
          if (!acc.has(key)) {
            acc.set(key, []);
          }
          acc.get(key)!.push(achievement);
          return acc;
        }, new Map<string, Achievement[]>());

        groups.forEach((group) => {
          if (group.length > 1) {
            // Mark all achievements in this group as duplicates
            group.forEach(ach => duplicatesFound.add(ach.achievementId));

            // Try to resolve by faction first
            const factionMatch = group.find(ach => 
              ach.data.requirements?.faction?.name?.toLowerCase() === characterFaction
            );

            if (factionMatch) {
              resolvedAchievements.add(factionMatch.achievementId);
            } else {
              // If no faction match, resolve by criteria count
              const maxCriteria = Math.max(
                ...group.map(ach => ach.data.criteria?.child_criteria?.length || 0)
              );
              const bestMatch = group.find(ach => 
                (ach.data.criteria?.child_criteria?.length || 0) === maxCriteria
              );
              if (bestMatch) {
                resolvedAchievements.add(bestMatch.achievementId);
              }
            }
          } else {
            // Not a duplicate, keep it
            resolvedAchievements.add(group[0].achievementId);
          }
        });
      } else {
        // Single achievement with this name, keep it
        resolvedAchievements.add(achievements[0].achievementId);
      }
    });

    return resolvedAchievements;
  }
}
