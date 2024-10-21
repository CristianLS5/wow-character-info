import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './components/header/header.component';
import { AuthService } from './utils/auth/auth.service';
import { CharacterService } from './services/character.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.sass',
})
export class AppComponent {
  realm = signal('');
  characterName = signal('');

  constructor(
    private authService: AuthService,
    private characterService: CharacterService
  ) {}

  onRealmChange(value: string) {
    this.realm.set(value);
  }

  onCharacterNameChange(value: string) {
    this.characterName.set(value);
  }

  onAuthenticate() {
    this.authService.login();
  }

  onFetchCharacter() {
    if (this.realm() && this.characterName()) {
      this.characterService
        .fetchAllCharacterData(this.realm(), this.characterName())
        .subscribe({
          next: () => console.log('Character data fetched successfully'),
          error: (error) =>
            console.error('Error fetching character data', error),
        });
    }
  }
}
