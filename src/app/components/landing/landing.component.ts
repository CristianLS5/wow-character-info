import { Component, OnInit, effect } from '@angular/core';
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
export class LandingComponent implements OnInit {
  constructor(private authService: AuthService, private router: Router) {
    effect(() => {
      if (this.authService.isAuthenticated()) {
        this.router.navigate(['/character']);
      }
    });
  }

  ngOnInit() {
    // The effect in the constructor will handle the authentication check
  }

  login() {
    this.authService.login();
  }
}
