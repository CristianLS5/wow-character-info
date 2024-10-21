import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Signal, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { CharacterService } from '../../services/character.service';
import { AuthService } from '../../utils/auth/auth.service';
import { getClassColor, getFactionColor } from '../../utils/class-colors';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.sass'],
})
export class HeaderComponent {
  private characterService = inject(CharacterService);
  private authService = inject(AuthService);
  private router = inject(Router);

  realm = signal('');
  characterName = signal('');
  errorMessage = signal('');
  isHovered = signal(false);

  characterProfile = computed(() => this.characterService.characterProfile());
  characterMedia = computed(() => this.characterService.characterMedia());

  onRealmChange(value: string) {
    this.realm.set(value);
  }

  onCharacterNameChange(value: string) {
    this.characterName.set(value);
  }

  onFetchCharacter() {
    if (this.realm() && this.characterName()) {
      this.errorMessage.set('');
      this.characterService
        .fetchAllCharacterData(this.realm(), this.characterName())
        .subscribe({
          next: () => console.log('Character data fetched successfully'),
          error: (error) => {
            console.error('Error fetching character data', error);
            this.errorMessage.set(
              'Failed to fetch character data. Please try again.'
            );
          },
        });
    } else {
      this.errorMessage.set('Please enter both realm and character name.');
    }
  }

  onLogout() {
    this.authService.logout().subscribe({
      next: () => {
        this.characterService.clearCharacterData(); // Make sure to implement this method in CharacterService
        this.router.navigate(['/']);
      },
      error: (error) => {
        console.error('Logout failed:', error);
        // Handle logout error (e.g., show an error message to the user)
      },
    });
  }

  getTitle(): string {
    return this.characterProfile() ? 'WCV' : 'WoW Character Viewer';
  }

  getClassColor(className: string): string {
    return getClassColor(className);
  }

  getFactionColor(faction: string): string {
    return getFactionColor(faction);
  }

  getCharacterMainInfo(): string | null {
    const profile = this.characterProfile();
    if (!profile) return null;
    return `${profile.name} - ${profile.active_spec?.name} ${profile.character_class?.name} (iLvl: ${profile.average_item_level})`;
  }

  getGuildInfo(): string | null {
    const profile = this.characterProfile();
    if (!profile || !profile.guild) return null;
    return `<${profile.guild.name}> - ${profile.realm?.name}`;
  }

  getAvatarUrl(): string | null {
    const media = this.characterMedia();
    if (media && media.assets) {
      const avatarAsset = media.assets.find(asset => asset.key === 'avatar');
      return avatarAsset ? avatarAsset.value : null;
    }
    return null;
  }

  onAvatarHover(isHovered: boolean) {
    this.isHovered.set(isHovered);
  }
}
