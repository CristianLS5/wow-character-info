import { Component, inject } from '@angular/core';
import { CharacterService } from '../../services/character.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-character',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './character.component.html',
  styleUrl: './character.component.sass',
})
export class CharacterComponent {
  characterService = inject(CharacterService);

  ngOnInit() {
    this.characterService.getCharacter('realm-name', 'character-name');
  }
}
