import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AchievementService } from '../../services/achievement.service';
import { CharacterService } from '../../services/character.service';
import * as d3 from 'd3';
import { Achievement } from '../../interfaces/achievement.interface';
import { forkJoin } from 'rxjs';
import { Router } from '@angular/router';
import { AchievementProgressService } from '../../services/achievement-progress.service';
import { LoadingComponent } from '../../shared/components/loading/loading.component';

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
  imports: [CommonModule, LoadingComponent],
  templateUrl: './achievements.component.html',
  styleUrls: ['./achievements.component.sass'],
})
export class AchievementsComponent implements OnInit {
  private achievementService = inject(AchievementService);
  private characterService = inject(CharacterService);
  private router = inject(Router);
  private achievementProgressService = inject(AchievementProgressService);
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

    forkJoin({
      allAchievements: this.achievementService.getAllAchievements(),
      characterAchievements: this.achievementService.getCharacterAchievements(
        realmSlug,
        characterName.toLowerCase()
      ),
    }).subscribe({
      next: ({ allAchievements, characterAchievements }) => {
        const completedAchievementsMap = new Map<number, number>();
        characterAchievements.achievements.forEach((charAchievement) => {
          if (charAchievement && charAchievement.completed_timestamp) {
            completedAchievementsMap.set(
              charAchievement.achievement.id,
              charAchievement.completed_timestamp
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

  private sanitizeId(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  private getCategoryName(achievement: Achievement): string {
    if (
      achievement.data.category.parent_category?.name === 'Legacy' ||
      achievement.data.category.name === 'Legacy'
    ) {
      return 'Legacy';
    }

    if (achievement.data.category.name === 'Feats of Strength') {
      return achievement.data.category.name;
    }

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

  private calculateParentCategories(
    allAchievements: Achievement[],
    completedMap: Map<number, number>
  ): CategoryProgress[] {
    // Group achievements by category
    const categoryGroups = new Map<string, Achievement[]>();

    allAchievements.forEach((achievement) => {
      const categoryName = this.getCategoryName(achievement);
      // Skip Legacy and Feats of Strength for parent categories display
      if (categoryName === 'Legacy' || categoryName === 'Feats of Strength') {
        return;
      }
      if (!categoryGroups.has(categoryName)) {
        categoryGroups.set(categoryName, []);
      }
      categoryGroups.get(categoryName)!.push(achievement);
    });

    return Array.from(categoryGroups.entries()).map(([name, achievements]) => {
      const progress = this.achievementProgressService.calculateProgress(
        achievements,
        completedMap,
        undefined,
        true
      );

      return {
        name,
        completed: progress.completed,
        total: progress.total,
        percentage: progress.percentage,
        elementId: this.sanitizeId(name),
      };
    });
  }

  private calculateAchievementStats(
    allAchievements: Achievement[],
    completedMap: Map<number, number>
  ) {
    // Calculate overall directly from all achievements (excluding Legacy and Feats)
    const overall = this.achievementProgressService.calculateProgress(
      allAchievements.filter((a) => {
        const categoryName = this.getCategoryName(a);
        return (
          categoryName !== 'Legacy' && categoryName !== 'Feats of Strength'
        );
      }),
      completedMap,
      undefined,
      true
    );

    // Calculate Legacy and Feats separately
    const legacy = this.achievementProgressService.calculateProgress(
      allAchievements.filter((a) => this.getCategoryName(a) === 'Legacy'),
      completedMap,
      undefined,
      true
    );

    const feats = this.achievementProgressService.calculateProgress(
      allAchievements.filter(
        (a) => this.getCategoryName(a) === 'Feats of Strength'
      ),
      completedMap,
      undefined,
      true
    );

    return {
      overall,
      legacy,
      feats,
    };
  }

  navigateTo(category: string) {
    this.router.navigate(['/achievements', category.toLowerCase()]);
  }
}
