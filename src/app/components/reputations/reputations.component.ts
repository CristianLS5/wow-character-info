import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReputationService } from '../../services/reputation.service';
import { CharacterService } from '../../services/character.service';
import { ReputationResponse } from '../../interfaces/reputation.interface';

@Component({
  selector: 'app-reputations',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reputations.component.html',
  styleUrl: './reputations.component.sass',
})
export class ReputationsComponent implements OnInit {
  private reputationService = inject(ReputationService);
  private characterService = inject(CharacterService);

  reputationsMap: ReputationResponse = {};
  isLoading = true;
  error: string | null = null;

  // Reversed expansion order
  expansions = [
    "The War Within",
    "Dragonflight",
    "Shadowlands",
    "Battle for Azeroth",
    "Legion",
    "Warlords of Draenor",
    "Mists of Pandaria",
    "Cataclysm",
    "Wrath of the Lich King",
    "The Burning Crusade",
    "Classic"
  ];

  ngOnInit() {
    const character = this.characterService.getCharacterInfo();
    console.log('Character Info for Reputations:', character);
    
    if (!character) {
      console.warn('No character information available');
      this.error = 'Please select a character first';
      this.isLoading = false;
      return;
    }

    console.log(`Fetching reputations for ${character.name} on ${character.realm.slug}`);
    
    this.reputationService
      .getCharacterReputations(character.realm.slug, character.name.toLowerCase())
      .subscribe({
        next: (data) => {
          console.log('Reputations data received:', data);
          this.reputationsMap = data;
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Reputations error:', err);
          this.error = err.error?.details || 
                      err.error?.error || 
                      'Failed to load reputations. Please try again later.';
          this.isLoading = false;
        },
      });
  }

  openWowheadLink(factionId: number): void {
    window.open(`https://www.wowhead.com/faction=${factionId}`, '_blank');
  }
}
