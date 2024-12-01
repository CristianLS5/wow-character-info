import { Component, OnInit, effect, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../utils/auth/auth.service';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.sass',
})
export class LandingComponent implements OnInit, OnDestroy {
  private slideInterval: any;
  private currentSlide = 1;
  private totalSlides = 4;
  private slideContainer: HTMLElement | null = null;
  showConsentModal = false;

  constructor(private authService: AuthService, private router: Router) {
    effect(() => {
      if (this.authService.isAuthCheckComplete()) {
        const isAuthenticated = this.authService.isAuthenticated();
        console.log('Landing auth check:', {
          isAuthenticated,
          hasSessionStorage: !!sessionStorage.getItem('auth_time'),
          hasLocalStorage: !!localStorage.getItem('auth_state')
        });

        if (isAuthenticated) {
          this.router.navigate(['/character']);
        }
      }
    });
  }

  ngOnInit() {
    this.slideContainer = document.querySelector('.carousel');
    this.startSlideShow();

    // Check current storage type
    const storageType = this.checkStorageType();
    console.log('Current storage type:', storageType);
  }

  ngOnDestroy() {
    if (this.slideInterval) {
      clearInterval(this.slideInterval);
    }
  }

  private startSlideShow() {
    this.slideInterval = setInterval(() => {
      this.moveRight();
    }, 3000);
  }

  nextSlide(event?: Event) {
    if (event) {
      event.preventDefault();
    }
    this.moveRight();
  }

  prevSlide(event?: Event) {
    if (event) {
      event.preventDefault();
    }
    this.moveLeft();
  }

  private moveRight() {
    if (!this.slideContainer) return;
    
    this.currentSlide = (this.currentSlide % this.totalSlides) + 1;
    const scrollAmount = (this.currentSlide - 1) * this.slideContainer.offsetWidth;
    this.slideContainer.scrollTo({
      left: scrollAmount,
      behavior: 'smooth'
    });
  }

  private moveLeft() {
    if (!this.slideContainer) return;
    
    this.currentSlide = this.currentSlide === 1 ? this.totalSlides : this.currentSlide - 1;
    const scrollAmount = (this.currentSlide - 1) * this.slideContainer.offsetWidth;
    this.slideContainer.scrollTo({
      left: scrollAmount,
      behavior: 'smooth'
    });
  }

  login() {
    this.showConsentModal = true;
  }

  updateConsent(consent: boolean) {
    console.log('Updating consent:', {
      consent,
      currentStorage: localStorage.getItem('storage_type') || sessionStorage.getItem('storage_type')
    });
    
    this.showConsentModal = false;
    
    this.authService.resetAuth();
    
    this.authService.login(consent);
  }

  private checkStorageType(): 'local' | 'session' | null {
    if (localStorage.getItem('storage_type') === 'local') {
      return 'local';
    }
    if (sessionStorage.getItem('storage_type') === 'session') {
      return 'session';
    }
    return null;
  }


}
