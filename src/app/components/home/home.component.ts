import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="h-[calc(100vh-64px)] bg-custom-bg flex items-center justify-center"
    >
      <div
        class="text-center p-8 bg-custom-card-bg rounded-lg shadow-lg max-w-2xl mx-4 animate-fade-in"
      >
        <svg
          class="w-16 h-16 mx-auto mb-4 text-blue-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          ></path>
        </svg>
        <h2 class="text-2xl font-bold mb-4 text-custom-text">
          Welcome to WoW Character Viewer
        </h2>
        <p class="text-gray-400 mb-4">
          Use the search bar above to look up your character's information.
        </p>
        <div class="bg-blue-900/30 p-4 rounded-lg text-sm text-gray-300">
          <p>Enter your character's realm and name to view:</p>
          <ul class="mt-2 space-y-1">
            <li>• Equipment and Stats</li>
            <li>• Collections</li>
            <li>• Achievements</li>
            <li>• Reputations</li>
            <li>• Instance Progress</li>
          </ul>
        </div>
      </div>
    </div>
  `,
})
export class DashboardComponent {}
