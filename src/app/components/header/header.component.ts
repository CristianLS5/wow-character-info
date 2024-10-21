import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Signal } from '@angular/core';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.sass'],
})
export class HeaderComponent {
  @Input() realm!: Signal<string>;
  @Input() characterName!: Signal<string>;
  @Output() realmChange = new EventEmitter<string>();
  @Output() characterNameChange = new EventEmitter<string>();
  @Output() authenticate = new EventEmitter<void>();
  @Output() fetchCharacter = new EventEmitter<void>();

  onRealmChange(value: string) {
    this.realmChange.emit(value);
  }

  onCharacterNameChange(value: string) {
    this.characterNameChange.emit(value);
  }

  onAuthenticate() {
    this.authenticate.emit();
  }

  onFetchCharacter() {
    this.fetchCharacter.emit();
  }
}
