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
    // Close modal first
    this.showConsentModal = false;
    
    // Start login process with consent value
    this.authService.login(consent);
  }

  private isNewTab(): boolean {
    // Check if this tab was created after the authentication
    const authTime = sessionStorage.getItem('auth_time');
    return !authTime;
  }
}
