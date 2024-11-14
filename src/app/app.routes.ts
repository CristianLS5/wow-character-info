import { Routes } from '@angular/router';
import { LandingComponent } from './components/landing/landing.component';
import { CharacterComponent } from './components/character/character.component';
import { AuthCallbackComponent } from './components/auth-callback/auth-callback.component';
import { CollectionsComponent } from './components/collections/collections.component';
import { AuthGuard } from './utils/auth/auth.guard';
import { AchievementsComponent } from './components/achievements/achievements.component';
import { CategoryDetailsComponent } from './components/achievements/category-details/category-details.component';

export const routes: Routes = [
  { path: '', component: LandingComponent },
  { path: 'auth/callback', component: AuthCallbackComponent },
  {
    path: 'character',
    component: CharacterComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'collections',
    component: CollectionsComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'achievements',
    component: AchievementsComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'achievements/:category',
    component: CategoryDetailsComponent,
    canActivate: [AuthGuard]
  }
];
