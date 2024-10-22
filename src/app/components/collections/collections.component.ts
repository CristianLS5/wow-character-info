import { Component, OnInit } from '@angular/core';
import { CollectionsService } from '../../services/collections.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, map, Observable } from 'rxjs';

interface Asset {
  key: string;
  value: string;
}

interface CreatureMedia {
  assets: Asset[];
}

interface Mount {
  _links: {
    self: {
      href: string;
    };
  };
  id: number;
  name: string;
  creature_displays: Array<{
    key: {
      href: string;
    };
    id: number;
  }>;
  description: string;
  source: {
    type: string;
    name: string;
  };
  faction?: {
    type: string;
    name: string;
  };
  requirements?: {
    faction?: {
      type: string;
      name: string;
    };
  };
  creatureMedia?: string;
}

@Component({
  selector: 'app-collections',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './collections.component.html',
  styleUrls: ['./collections.component.sass'],
})
export class CollectionsComponent implements OnInit {
  mounts: Mount[] = [];
  filteredMounts: Mount[] = [];
  searchQuery: string = '';
  currentPage: number = 1;
  itemsPerPage: number = 20;
  totalItems: number = 0;
  isLoading: boolean = true;

  constructor(private collectionsService: CollectionsService) {}

  ngOnInit(): void {
    this.loadMounts();
  }

  loadMounts(): void {
    this.isLoading = true;
    this.collectionsService.getAllMountsWithDetails().subscribe({
      next: (data: Mount[]) => {
        console.log('Received mount data:', data);
        this.mounts = data;
        this.loadCreatureMedia(); // Call this here
      },
      error: (error) => {
        console.error('Error loading mounts:', error);
        this.isLoading = false;
      },
    });
  }

  filterMounts(): void {
    this.filteredMounts = this.mounts.filter((mount) => {
      return mount.name.toLowerCase().includes(this.searchQuery.toLowerCase());
    });
    this.totalItems = this.filteredMounts.length;
    this.currentPage = 1;
    console.log('Filtered Mounts:', this.filteredMounts.length);
  }

  onSearchChange(): void {
    this.filterMounts();
  }

  changePage(page: number): void {
    this.currentPage = page;
  }

  get paginatedMounts(): Mount[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredMounts.slice(
      startIndex,
      startIndex + this.itemsPerPage
    );
  }

  get totalPages(): number {
    return Math.ceil(this.totalItems / this.itemsPerPage);
  }

  getVisiblePageNumbers(): number[] {
    const visiblePages = 5;
    let startPage = Math.max(
      this.currentPage - Math.floor(visiblePages / 2),
      1
    );
    let endPage = startPage + visiblePages - 1;

    if (endPage > this.totalPages) {
      endPage = this.totalPages;
      startPage = Math.max(endPage - visiblePages + 1, 1);
    }

    return Array.from(
      { length: endPage - startPage + 1 },
      (_, i) => startPage + i
    );
  }

  loadCreatureMedia(): void {
    const creatureMediaRequests: Observable<{ mountId: number; creatureDisplayId: number; media: CreatureMedia }>[] = this.mounts.map(mount => 
      this.collectionsService.getCreatureMedia(mount.creature_displays[0].id).pipe(
        map(media => ({ mountId: mount.id, creatureDisplayId: mount.creature_displays[0].id, media }))
      )
    );

    forkJoin(creatureMediaRequests).subscribe({
      next: (results) => {
        results.forEach(result => {
          const mount = this.mounts.find(m => m.id === result.mountId);
          if (mount && result.media.assets && result.media.assets.length > 0) {
            const zoomAsset = result.media.assets.find((asset: Asset) => asset.key === 'zoom');
            if (zoomAsset) {
              mount.creatureMedia = zoomAsset.value;
            }
          }
        });
        this.filterMounts();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading creature media:', error);
        this.isLoading = false;
      },
    });
  }
}
