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
    return (
      achievement.data.category.parent_category?.name ||
      achievement.data.category.name
    );
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
    const parentCategories = new Map<
      string,
      {
        completed: number;
        total: number;
      }
    >();

    allAchievements.forEach((achievement) => {
      const categoryName = this.getCategoryName(achievement);

      // Skip Legacy and Feats of Strength
      if (['Legacy', 'Feats of Strength'].includes(categoryName)) {
        return;
      }

      if (!parentCategories.has(categoryName)) {
        parentCategories.set(categoryName, { completed: 0, total: 0 });
      }

      const category = parentCategories.get(categoryName)!;
      category.total++;
      if (completedMap.has(achievement.achievementId)) {
        category.completed++;
      }
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
    const stats = {
      overall: { completed: 0, total: 0, percentage: 0 },
      legacy: { completed: 0, total: 0, percentage: 0 },
      feats: { completed: 0, total: 0, percentage: 0 },
    };

    allAchievements.forEach((achievement) => {
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
    stats.overall.percentage =
      (stats.overall.completed / stats.overall.total) * 100;
    stats.legacy.percentage =
      (stats.legacy.completed / stats.legacy.total) * 100;
    stats.feats.percentage = (stats.feats.completed / stats.feats.total) * 100;

    return stats;
  }

  navigateTo(category: string) {
    this.router.navigate(['/achievements', category.toLowerCase()]);
  }
}
