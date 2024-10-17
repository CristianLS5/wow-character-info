import { Component, inject } from '@angular/core';
import { CharacterService } from '../../services/character.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EquipmentCardComponent } from '../equipment-card/equipment-card.component';
import { HeaderComponent } from '../header/header.component';
import { getClassColor, getFactionColor } from '../../utils/class-colors';

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
  imports: [CommonModule, FormsModule, EquipmentCardComponent, HeaderComponent],
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
        .fetchAllCharacterData(this.realm, this.characterName)
        .subscribe({
          next: ([equipment, media, profile]) => {
            console.log('All character data fetched successfully');
            // We don't need to set characterProfile here anymore
          },
          error: (error) => {
            console.error('Error fetching character data', error);
          },
        });
    }
  }

  get characterEquipment(): CharacterEquipment | null {
    return this.characterService.characterEquipment();
  }

  get characterMedia() {
    return this.characterService.characterMedia();
  }

  get characterProfile() {
    return this.characterService.characterProfile();
  }

  get hasEquippedItems(): boolean {
    return (
      !!this.characterEquipment &&
      Array.isArray(this.characterEquipment.equipped_items) &&
      this.characterEquipment.equipped_items.length > 0
    );
  }

  getMainRawImage(): string | undefined {
    if (this.characterMedia && this.characterMedia.assets) {
      const mainRawAsset = this.characterMedia.assets.find(
        (asset) => asset.key === 'main-raw'
      );
      return mainRawAsset ? mainRawAsset.value : undefined;
    }
    return undefined;
  }

  getLeftColumnItems() {
    const leftSlots = [
      'HEAD',
      'NECK',
      'SHOULDER',
      'BACK',
      'CHEST',
      'SHIRT',
      'TABARD',
      'WRIST',
      'MAIN_HAND', // Add main hand weapon here
    ];
    return (
      this.characterEquipment?.equipped_items.filter((item) =>
        leftSlots.includes(item.slot.type.toUpperCase())
      ) || []
    );
  }

  getRightColumnItems() {
    const rightSlots = [
      'HANDS',
      'WAIST',
      'LEGS',
      'FEET',
      'FINGER_1',
      'FINGER_2',
      'TRINKET_1',
      'TRINKET_2',
      'OFF_HAND', // Add off-hand here if needed
    ];
    return (
      this.characterEquipment?.equipped_items.filter((item) =>
        rightSlots.includes(item.slot.type.toUpperCase())
      ) || []
    );
  }

  getClassColor(className: string): string {
    return getClassColor(className || '');
  }

  getFactionColor(factionName: string): string {
    return getFactionColor(factionName || '');
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
