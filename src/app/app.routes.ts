import { Routes } from '@angular/router';
import { LandingComponent } from './components/landing/landing.component';
import { AuthCallbackComponent } from './components/auth-callback/auth-callback.component';
import { CollectionsComponent } from './components/collections/collections.component';
import { AuthGuard } from './utils/auth/auth.guard';
import { AchievementsComponent } from './components/achievements/achievements.component';
import { CategoryDetailsComponent } from './components/achievements/category-details/category-details.component';
import { ReputationsComponent } from './components/reputations/reputations.component';
import { InstancesComponent } from './components/instances/instances.component';
import { CharacterResolver } from './resolvers/character.resolver';
import { DashboardComponent } from './components/home/home.component';
import { CharacterComponent } from './components/character/character.component';

export const routes: Routes = [
  { 
    path: '', 
    component: LandingComponent,
    canActivate: [AuthGuard],
    data: { requiresAuth: false }
  },
  { path: 'auth/callback', component: AuthCallbackComponent },
  { 
    path: 'dashboard', 
    component: DashboardComponent,
    canActivate: [AuthGuard],
    data: { requiresAuth: true }
  },
  { 
    path: 'character', 
    redirectTo: 'dashboard', 
    pathMatch: 'full' 
  },
  {
    path: ':realm/:character',
    canActivate: [AuthGuard],
    resolve: {
      character: CharacterResolver
    },
    children: [
      { path: '', redirectTo: 'character', pathMatch: 'full' },
      { path: 'character', component: CharacterComponent },
      { path: 'collections', component: CollectionsComponent },
      { path: 'achievements', component: AchievementsComponent },
      { path: 'achievements/:category', component: CategoryDetailsComponent },
      { path: 'reputations', component: ReputationsComponent },
      { path: 'instances', component: InstancesComponent },
    ]
  }
];
