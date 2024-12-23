import { Component, inject, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { CharacterService } from '../../services/character.service';
import { AuthService } from '../../utils/auth/auth.service';
import { getClassColor } from '../../utils/class-colors';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.sass'],
  animations: [
    trigger('dropdownAnimation', [
      transition(':enter', [
        query('.dropdown-item', [
          style({ opacity: 0, transform: 'translateY(-20px)' }),
          stagger(100, [
            animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ])
      ]),
      transition(':leave', [
        query('.dropdown-item', [
          stagger(100, [
            animate('300ms ease-in', style({ opacity: 0, transform: 'translateY(-20px)' }))
          ])
        ])
      ])
    ])
  ]
})
export class HeaderComponent {
  private characterService = inject(CharacterService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private elementRef = inject(ElementRef);

  realm = computed(() => this.characterProfile()?.realm?.name || '');
  characterName = computed(() => this.characterProfile()?.name || '');
  errorMessage = signal('');
  characterProfile = computed(() => this.characterService.characterProfile());
  characterMedia = computed(() => this.characterService.characterMedia());

  onRealmChange(value: string) {
    this._tempRealm = value;
  }

  onCharacterNameChange(value: string) {
    this._tempCharacterName = value;
  }

  onFetchCharacter() {
    const realm = this._tempRealm || this.realm();
    const character = this._tempCharacterName || this.characterName();

    if (realm && character) {
      this.errorMessage.set('');
      this.router.navigate([realm.toLowerCase(), character.toLowerCase(), 'character']);
    } else {
      this.errorMessage.set('Please enter both realm and character name.');
    }
  }

  onLogout() {
    this.characterService.clearCharacterData();
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/'], { replaceUrl: true });
      },
      error: (error) => {
        console.error('Logout failed:', error);
      },
    });
  }

  getTitle(): string {
    return this.characterProfile() ? 'WCV' : 'WoW Character Viewer';
  }

  getClassColor(className: string): string {
    return getClassColor(className);
  }

  getAvatarUrl(): string | null {
    const media = this.characterMedia();
    if (media && media.assets) {
      const avatarAsset = media.assets.find(asset => asset.key === 'avatar');
      return avatarAsset ? avatarAsset.value : null;
    }
    return null;
  }

  isDropdownOpen = signal(false);

  toggleDropdown(event: Event) {
    event.stopPropagation();
    this.isDropdownOpen.update(value => !value);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isDropdownOpen.set(false);
    }
  }

  private _tempRealm = '';
  private _tempCharacterName = '';
}
