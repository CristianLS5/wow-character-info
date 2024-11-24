import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RaidInstance } from '../../../interfaces/raids.interface';

@Component({
  selector: 'app-raid-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './raid-card.component.html',
  styleUrls: ['./raid-card.component.sass'],
})
export class RaidCardComponent {
  @Input({ required: true }) raid!: RaidInstance;

  getProgressPercentage(completed: number, total: number): number {
    return (completed / total) * 100;
  }

  getDifficultyColor(difficultyType: string): string {
    const colors: { [key: string]: string } = {
      'NORMAL': 'bg-blue-500',
      'HEROIC': 'bg-purple-500',
      'MYTHIC': 'bg-orange-500',
      'LFR': 'bg-green-500'
    };
    return colors[difficultyType] || 'bg-gray-500';
  }

  getDifficultyTextColor(difficultyType: string): string {
    const colors: { [key: string]: string } = {
      'NORMAL': 'text-blue-400',
      'HEROIC': 'text-purple-400',
      'MYTHIC': 'text-orange-400',
      'LFR': 'text-green-400'
    };
    return colors[difficultyType] || 'text-gray-400';
  }
}
