import { Component, signal } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { HeaderComponent } from './components/header/header.component';
import { AuthService } from './utils/auth/auth.service';
import { CharacterService } from './services/character.service';
import { filter } from 'rxjs/operators';

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
  showHeader = signal(false);

  constructor(
    private authService: AuthService,
    private characterService: CharacterService,
    private router: Router
  ) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.showHeader.set(event.url !== '/' && event.url !== '/auth/callback');
    });
  }

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
