import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { CharacterService } from '../../services/character.service';
import { computed } from '@angular/core';

@Component({
  selector: 'app-subheader',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './subheader.component.html',
  styleUrls: ['./subheader.component.sass'],
})
export class SubheaderComponent implements OnInit {
  private characterService = inject(CharacterService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  characterName = computed(
    () => this.characterService.characterProfile()?.name ?? ''
  );

  realm = '';
  character = '';

  tabs = [
    { label: 'Character', route: 'character' },
    { label: 'Collections', route: 'collections' },
    { label: 'Achievements', route: 'achievements' },
    { label: 'Reputations', route: 'reputations' },
    { label: 'Instances', route: 'instances' },
  ];

  ngOnInit() {
    // Get the root route parameters
    this.route.root.firstChild?.paramMap.subscribe((params) => {
      this.realm = params.get('realm') || '';
      this.character = params.get('character') || '';
      console.log('Route params:', {
        realm: this.realm,
        character: this.character,
      });
    });
  }

  navigateTo(route: string) {
    if (this.realm && this.character) {
      this.router.navigate([this.realm, this.character, route]);
    }
  }

  isActive(route: string): boolean {
    return this.router.url.includes(`/${route}`);
  }
}
