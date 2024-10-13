import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CharacterModelComponent } from './components/character-model/character-model.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CharacterModelComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.sass',
})
export class AppComponent {
  title = 'wow-character-info';
  modelUrl = 'path/to/your/3d/model.gltf';
}
