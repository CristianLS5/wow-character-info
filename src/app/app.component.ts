import { Component, signal, computed, inject } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { HeaderComponent } from './components/header/header.component';
import { SubheaderComponent } from './components/subheader/subheader.component';
import { LoadingComponent } from './shared/components/loading/loading.component';
import { CharacterService } from './services/character.service';
import { AuthService } from './utils/auth/auth.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, SubheaderComponent, LoadingComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.sass',
})
export class AppComponent {
  private characterService = inject(CharacterService);
  private authService = inject(AuthService);
  
  showHeader = signal(false);
  showSubheader = computed(() => !!this.characterService.characterProfile());
  isAuthInitialized = computed(() => this.authService.authInitializedSignal());

  constructor(private router: Router) {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.showHeader.set(
          event.url !== '/' && event.url !== '/auth/callback'
        );
      });
  }
}
