import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CharacterService } from '../../services/character.service';
import { computed } from '@angular/core';

@Component({
  selector: 'app-subheader',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './subheader.component.html',
  styleUrls: ['./subheader.component.sass'],
})
export class SubheaderComponent {
  private characterService = inject(CharacterService);

  characterName = computed(
    () => this.characterService.characterProfile()?.name ?? ''
  );

  tabs = [
    { label: 'Character', route: '/character' },
    { label: 'Collections', route: '/collections' },
    { label: 'Achievements', route: '/achievements' },
    { label: 'Reputations', route: '/reputations' },
    { label: 'Instances', route: '/instances' },
  ];
}
