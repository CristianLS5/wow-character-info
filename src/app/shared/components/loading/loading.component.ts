import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-loading',
  standalone: true,
  imports: [],
  templateUrl: './loading.component.html',
  styleUrl: './loading.component.sass',
})
export class LoadingComponent {
  @Input() overlay = true;
  @Input() showSpinner = true;
  @Input() size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' = 'xl';

  get overlayClass(): string {
    return this.overlay
      ? 'absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-40'
      : 'flex items-center justify-center';
  }

  get spinnerClass(): string {
    switch(this.size) {
      case 'xl':
        return 'loading loading-spinner w-19 h-19';
      case '2xl':
        return 'loading loading-spinner w-24 h-24';
      default:
        return `loading loading-spinner loading-${this.size}`;
    }
  }
}