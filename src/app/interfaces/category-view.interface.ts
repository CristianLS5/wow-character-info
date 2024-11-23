import { Achievement } from './achievement.interface';
import { Signal } from '@angular/core';

export interface CategoryViewData {
  title: string;
  achievements: Signal<Achievement[]>;
  completedAchievements: Signal<Map<number, number>>;
  filterPredicate: (achievement: Achievement) => boolean;
  isLoading?: boolean;
  error?: string | null;
}

export interface CategoryStats {
  name: string;
  achievements: Achievement[];
  displayOrder: number;
}

export interface FilteredAchievements {
  achievements: Achievement[];
  filter: Signal<'all' | 'collected' | 'uncollected'>;
} 