import { Component, OnInit } from '@angular/core';
import { CollectionsService } from '../../services/collections.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, map, Observable } from 'rxjs';
import { CharacterService } from '../../services/character.service';
import { PET_TYPES } from '../../interfaces/pet.interface';

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
  isCollected?: boolean;
}

interface Pet {
  id: number;
  name: string;
  battle_pet_type: {
    id: number;
    type: string;
    name: string;
  };
  description: string;
  is_capturable: boolean;
  is_tradable: boolean;
  is_battlepet: boolean;
  is_alliance_only?: boolean;
  is_horde_only?: boolean;
  source?: {
    name: string;
    type: string;
  };
  abilities?: Array<{
    ability: {
      name: string;
      id: number;
    };
    slot: number;
    required_level: number;
  }>;
  media: {
    id: number;
    assets: Asset[];
  };
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
  isLoading: boolean = true;
  filterOptions = ['ALL', 'COLLECTED', 'NOT COLLECTED'];
  selectedFilter = 'ALL';

  activeTab: 'mounts' | 'pets' = 'mounts';
  pets: Pet[] = [];
  filteredPets: Pet[] = [];

  constructor(
    private collectionsService: CollectionsService,
    private characterService: CharacterService
  ) {}

  ngOnInit(): void {
    this.loadMounts();
  }

  switchTab(tab: 'mounts' | 'pets'): void {
    this.activeTab = tab;
    this.searchQuery = '';
    if (tab === 'pets' && this.pets.length === 0) {
      this.loadPets();
    } else if (tab === 'mounts') {
      this.filterMounts();
    } else {
      this.filterPets();
    }
  }

  loadMounts(): void {
    this.isLoading = true;
    const characterInfo = this.characterService.getCharacterInfo();

    if (!characterInfo) {
      console.error('Character information not available');
      this.isLoading = false;
      return;
    }

    const { realmSlug, characterName } = characterInfo;

    forkJoin({
      allMounts: this.collectionsService.getAllMountsWithDetails(),
      collectedMounts: this.collectionsService.getCollectedMounts(
        realmSlug,
        characterName
      ),
    }).subscribe({
      next: ({ allMounts, collectedMounts }) => {
        const collectedMountIds = collectedMounts.mounts.map(
          (mount: any) => mount.mount.id
        );
        this.mounts = allMounts.map((mount) => ({
          ...mount,
          isCollected: collectedMountIds.includes(mount.id),
        }));
        this.loadCreatureMedia();
      },
      error: (error) => {
        console.error('Error loading mounts:', error);
        this.isLoading = false;
      },
    });
  }

  onFilterChange(filter: string): void {
    this.selectedFilter = filter;
    this.filterMounts();
  }

  filterMounts(): void {
    this.filteredMounts = this.mounts.filter((mount) => {
      const nameMatch = mount.name
        .toLowerCase()
        .includes(this.searchQuery.toLowerCase());
      switch (this.selectedFilter) {
        case 'COLLECTED':
          return nameMatch && mount.isCollected;
        case 'NOT COLLECTED':
          return nameMatch && !mount.isCollected;
        default:
          return nameMatch;
      }
    });
    this.currentPage = 1;
  }

  onSearchChange(): void {
    if (this.activeTab === 'mounts') {
      this.filterMounts();
    } else {
      this.filterPets();
    }
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
    const creatureMediaRequests: Observable<{
      mountId: number;
      creatureDisplayId: number;
      media: CreatureMedia;
    }>[] = this.mounts.map((mount) =>
      this.collectionsService
        .getCreatureMedia(mount.creature_displays[0].id)
        .pipe(
          map((media) => ({
            mountId: mount.id,
            creatureDisplayId: mount.creature_displays[0].id,
            media,
          }))
        )
    );

    forkJoin(creatureMediaRequests).subscribe({
      next: (results) => {
        results.forEach((result) => {
          const mount = this.mounts.find((m) => m.id === result.mountId);
          if (mount && result.media.assets && result.media.assets.length > 0) {
            const zoomAsset = result.media.assets.find(
              (asset: Asset) => asset.key === 'zoom'
            );
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

  loadPets(): void {
    this.isLoading = true;
    this.collectionsService.getAllPetsWithDetails().subscribe({
      next: (pets: Pet[]) => {
        this.pets = pets;
        this.filterPets();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading pets:', error);
        this.isLoading = false;
      },
    });
  }

  filterPets(): void {
    this.filteredPets = this.pets.filter((pet) => {
      const nameMatch = pet.name
        .toLowerCase()
        .includes(this.searchQuery.toLowerCase());
      return nameMatch;
    });
    this.currentPage = 1;
  }

  get paginatedPets(): Pet[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredPets.slice(startIndex, startIndex + this.itemsPerPage);
  }

  getPetTypeIcon(typeId: number): string {
    const basePath = '../../assets/pet-families/';
    return `${basePath}${PET_TYPES[typeId]?.iconPath || 'default.png'}`;
  }

  get totalItems(): number {
    return this.activeTab === 'mounts' 
      ? this.filteredMounts.length 
      : this.filteredPets.length;
  }
}
