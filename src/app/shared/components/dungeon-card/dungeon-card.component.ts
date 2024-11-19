import { Component, Input, OnInit, inject } from '@angular/core';
import { DungeonRun, Affix } from '../../../interfaces/dungeons.interface';
import { CommonModule } from '@angular/common';
import { InstanceService } from '../../../services/instance.service';

@Component({
  selector: 'app-dungeon-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dungeon-card.component.html',
  styleUrls: ['./dungeon-card.component.sass']
})
export class DungeonCardComponent implements OnInit {
  @Input({ required: true }) run!: DungeonRun;
  private instanceService = inject(InstanceService);
  affixDetails: Map<number, Affix> = new Map();

  ngOnInit() {
    this.loadAffixDetails();
  }

  private loadAffixDetails() {
    this.instanceService.getAffixes().subscribe(affixes => {
      affixes.forEach(affix => {
        this.affixDetails.set(affix.id, affix);
      });
    });
  }

  formatDuration(milliseconds: number): string {
    const minutes = Math.floor(milliseconds / 1000 / 60);
    const seconds = Math.floor((milliseconds / 1000) % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  getRatingColor(): string {
    const { r, g, b } = this.run.mythic_rating.color;
    return `rgb(${r}, ${g}, ${b})`;
  }
}
