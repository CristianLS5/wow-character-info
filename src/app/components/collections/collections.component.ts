import { Component, OnInit, OnDestroy } from '@angular/core';
import { CollectionsService } from '../../services/collections.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, map, Observable, Subject, Subscription, takeUntil, finalize } from 'rxjs';
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
  isCollected?: boolean;
  creature_display?: {
    id: number;
    key: {
      href: string;
    };
  };
  icon: string;
  creatureMedia?: string;
  displayMedia?: string;
}

interface Toy {
  id: number;
  name: string;
  item: {
    id: number;
    key: {
      href: string;
    };
  };
  source: {
    type: string;
    name: string;
  };
  description?: string;
  is_alliance_only?: boolean;
  is_horde_only?: boolean;
  media: {
    assets: Asset[];
  };
  isCollected?: boolean;
  displayMedia?: string;
}

@Component({
  selector: 'app-collections',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './collections.component.html',
  styleUrls: ['./collections.component.sass'],
})
export class CollectionsComponent implements OnInit, OnDestroy {
  mounts: Mount[] = [];
  filteredMounts: Mount[] = [];
  searchQuery: string = '';
  currentPage: number = 1;
  itemsPerPage: number = 20;
  isLoading: boolean = true;
  filterOptions = ['ALL', 'COLLECTED', 'NOT COLLECTED'];
  selectedFilter = 'ALL';

  activeTab: 'mounts' | 'pets' | 'toys' = 'mounts';
  pets: Pet[] = [];
  filteredPets: Pet[] = [];
  toys: Toy[] = [];
  filteredToys: Toy[] = [];

  private destroy$ = new Subject<void>();
  private subscriptions: Subscription[] = [];

  constructor(
    private collectionsService: CollectionsService,
    private characterService: CharacterService
  ) {}

  ngOnInit(): void {
    this.loadMounts();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  switchTab(tab: 'mounts' | 'pets' | 'toys'): void {
    this.activeTab = tab;
    this.searchQuery = '';
    switch (tab) {
      case 'pets':
        if (this.pets.length === 0) this.loadPets();
        else this.filterPets();
        break;
      case 'toys':
        if (this.toys.length === 0) this.loadToys();
        else this.filterToys();
        break;
      default:
        this.filterMounts();
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
    switch (this.activeTab) {
      case 'mounts':
        this.filterMounts();
        break;
      case 'pets':
        this.filterPets();
        break;
      case 'toys':
        this.filterToys();
        break;
    }
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
    switch (this.activeTab) {
      case 'mounts':
        this.filterMounts();
        break;
      case 'pets':
        this.filterPets();
        break;
      case 'toys':
        this.filterToys();
        break;
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
    const characterInfo = this.characterService.getCharacterInfo();

    if (!characterInfo) {
      console.error('Character information not available');
      this.isLoading = false;
      return;
    }

    const { realmSlug, characterName } = characterInfo;

    const subscription = forkJoin({
      allPets: this.collectionsService.getAllPetsWithDetails(),
      collectedPets: this.collectionsService.getCollectedPets(
        realmSlug,
        characterName
      ),
    })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.isLoading = false))
      )
      .subscribe({
        next: ({ allPets, collectedPets }) => {
          const collectedPetIds = (collectedPets || []).map(
            (pet) => pet.species?.id
          );

          this.pets = allPets.map((pet) => {
            const collectedPet = collectedPets.find(
              (cp) => cp.species?.id === pet.id
            );
            return {
              ...pet,
              isCollected: collectedPetIds.includes(pet.id),
              creatureMedia: collectedPet?.creatureMedia,
              // Use creatureMedia only if it exists, otherwise fall back to icon
              displayMedia: collectedPet?.creatureMedia || pet.icon,
            };
          });

          this.filterPets();
        },
        error: (error) => {
          console.error('Error loading pets:', error);
          this.isLoading = false;
        },
      });

    this.subscriptions.push(subscription);
  }

  filterPets(): void {
    this.filteredPets = this.pets.filter((pet) => {
      const nameMatch = pet.name
        .toLowerCase()
        .includes(this.searchQuery.toLowerCase());
      switch (this.selectedFilter) {
        case 'COLLECTED':
          return nameMatch && pet.isCollected;
        case 'NOT COLLECTED':
          return nameMatch && !pet.isCollected;
        default:
          return nameMatch;
      }
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
    switch (this.activeTab) {
      case 'mounts':
        return this.filteredMounts.length;
      case 'pets':
        return this.filteredPets.length;
      case 'toys':
        return this.filteredToys.length;
      default:
        return 0;
    }
  }

  loadToys(): void {
    console.log('Starting to load toys data...');
    this.isLoading = true;
    const characterInfo = this.characterService.getCharacterInfo();

    if (!characterInfo) {
      console.error('Character information not available');
      this.isLoading = false;
      return;
    }

    const { realmSlug, characterName } = characterInfo;

    forkJoin({
      allToys: this.collectionsService.getAllToysWithDetails(),
      collectedToys: this.collectionsService.getCollectedToys(realmSlug, characterName)
    })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe({
        next: ({ allToys, collectedToys }) => {
          // Extract collected toy IDs
          const collectedToyIds = collectedToys?.toys?.map(
            (toy: any) => toy?.toy?.id
          ) || [];

          console.log('Collected toys count:', collectedToyIds.length);

          // Map the toys with the correct data structure
          this.toys = allToys
            .filter(toy => toy?.data && toy.data.id && toy.data.item?.name)
            .map((toy) => ({
              id: toy.data.id,
              name: toy.data.item.name,
              item: {
                id: toy.data.item.id,
                key: toy.data.item.key
              },
              description: toy.data.source_description || '',
              source: toy.data.source || { type: 'Unknown', name: 'Unknown' },
              is_alliance_only: false,
              is_horde_only: false,
              media: {
                assets: toy.data.media?.assets || []
              },
              isCollected: collectedToyIds.includes(toy.data.id),
              displayMedia: toy.data.media?.assets?.[0]?.value || ''
            }));

          console.log('Processed toys summary:', {
            total: this.toys.length,
            collected: this.toys.filter(t => t.isCollected).length,
            notCollected: this.toys.filter(t => !t.isCollected).length,
            firstToy: this.toys[0]
          });

          this.filterToys();
        },
        error: (error) => {
          console.error('Error loading toys:', error);
          this.isLoading = false;
        }
      });
  }

  filterToys(): void {
    console.log('Filtering toys:', {
      totalToys: this.toys.length,
      searchQuery: this.searchQuery,
      selectedFilter: this.selectedFilter
    });

    this.filteredToys = this.toys.filter((toy) => {
      const nameMatch = toy.name
        .toLowerCase()
        .includes((this.searchQuery || '').toLowerCase());

      switch (this.selectedFilter) {
        case 'COLLECTED':
          return nameMatch && toy.isCollected;
        case 'NOT COLLECTED':
          return nameMatch && !toy.isCollected;
        default:
          return nameMatch;
      }
    });

    console.log('Filtering results:', {
      totalFiltered: this.filteredToys.length,
      collected: this.filteredToys.filter(t => t.isCollected).length,
      notCollected: this.filteredToys.filter(t => !t.isCollected).length
    });

    this.currentPage = 1;
  }

  get paginatedToys(): Toy[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const paginatedItems = this.filteredToys.slice(
      startIndex,
      startIndex + this.itemsPerPage
    );
    console.log('Paginated toys:', {
      total: this.filteredToys.length,
      currentPage: this.currentPage,
      itemsPerPage: this.itemsPerPage,
      paginatedCount: paginatedItems.length,
      items: paginatedItems,
    });
    return paginatedItems;
  }

  openWowheadLink(itemId: number): void {
    const url = `https://www.wowhead.com/item=${itemId}`;
    window.open(url, '_blank');
  }
}
