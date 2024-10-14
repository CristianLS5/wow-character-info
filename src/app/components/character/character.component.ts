import { Component, inject } from '@angular/core';
import { CharacterService } from '../../services/character.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface CharacterEquipment {
  equipped_items: Array<{
    name: string;
    quality: { type: string; name: string };
    level: { value: number; display_string: string };
    item: { id: number };
    slot: { type: string; name: string };
    iconUrl?: string;
  }>;
}

@Component({
  selector: 'app-character',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './character.component.html',
  styleUrl: './character.component.sass',
})
export class CharacterComponent {
  characterService = inject(CharacterService);
  realm: string = '';
  characterName: string = '';

  authenticate() {
    window.location.href = 'http://localhost:3000/auth/bnet';
  }

  fetchCharacter() {
    if (this.realm && this.characterName) {
      this.characterService
        .getCharacterEquipment(this.realm, this.characterName)
        .subscribe({
          next: (data) => {
            console.log('Character equipment fetched successfully', data);
            this.logIconUrls(data);
          },
          error: (error) => {
            console.error('Error fetching character equipment', error);
          },
        });
    }
  }

  get characterEquipment(): CharacterEquipment | null {
    return this.characterService.characterEquipment();
  }

  get hasEquippedItems(): boolean {
    return (
      !!this.characterEquipment &&
      Array.isArray(this.characterEquipment.equipped_items) &&
      this.characterEquipment.equipped_items.length > 0
    );
  }

  getAverageItemLevel(): number {
    const equippedItems = this.characterEquipment?.equipped_items;
    if (!equippedItems || equippedItems.length === 0) return 0;

    const totalItemLevel = equippedItems.reduce(
      (sum, item) => sum + (item.level?.value || 0),
      0
    );
    return Math.round(totalItemLevel / equippedItems.length);
  }

  logIconUrls(data: CharacterEquipment) {
    if (data && data.equipped_items) {
      console.log('Icon URLs for equipped items:');
      data.equipped_items.forEach((item, index) => {
        console.log(`Item ${index + 1}: ${item.name}`);
        console.log(`Icon URL: ${item.iconUrl || 'Not available'}`);
      });
    }
  }

  onImageError(event: Event, item: any) {
    console.error(`Error loading image for item: ${item.name}`);
    console.error(`Failed URL: ${item.iconUrl}`);
    (event.target as HTMLImageElement).style.display = 'none';
  }
}
