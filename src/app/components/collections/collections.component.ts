import { Component, OnInit, OnDestroy } from '@angular/core';
import { CollectionsService } from '../../services/collections.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  forkJoin,
  map,
  Observable,
  Subject,
  Subscription,
  takeUntil,
  finalize,
} from 'rxjs';
import { CharacterService } from '../../services/character.service';
import { PET_TYPES } from '../../interfaces/pet.interface';
import { TransmogSet } from '../../interfaces/transmog.interface';
import { Heirloom } from '../../interfaces/heirloom.interface';

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
  itemId?: number;
  spellId?: number;
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
  creature?: {
    key: {
      href: string;
    };
    name: string;
    id: number;
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

  activeTab: 'mounts' | 'pets' | 'toys' | 'transmogs' | 'heirlooms' = 'mounts';
  pets: Pet[] = [];
  filteredPets: Pet[] = [];
  toys: Toy[] = [];
  filteredToys: Toy[] = [];
  transmogSets: TransmogSet[] = [];
  filteredTransmogSets: TransmogSet[] = [];
  heirlooms: Heirloom[] = [];
  filteredHeirlooms: Heirloom[] = [];

  private destroy$ = new Subject<void>();
  private subscriptions: Subscription[] = [];

  filterStatus: 'ALL' | 'COLLECTED' | 'NOT_COLLECTED' = 'ALL';

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

  switchTab(tab: 'mounts' | 'pets' | 'toys' | 'transmogs' | 'heirlooms'): void {
    this.activeTab = tab;
    this.searchQuery = '';
    switch (tab) {
      case 'transmogs':
        if (this.transmogSets.length === 0) this.loadTransmogs();
        else this.filterTransmogs();
        break;
      case 'pets':
        if (this.pets.length === 0) this.loadPets();
        else this.filterPets();
        break;
      case 'toys':
        if (this.toys.length === 0) this.loadToys();
        else this.filterToys();
        break;
      case 'heirlooms':
        if (this.heirlooms.length === 0) this.loadHeirlooms();
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
      case 'transmogs':
        this.filterTransmogs();
        break;
      case 'heirlooms':
        this.filterHeirlooms();
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
      case 'transmogs':
        this.filterTransmogs();
        break;
      case 'heirlooms':
        this.filterHeirlooms();
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
      case 'transmogs':
        return this.filteredTransmogSets.length;
      case 'heirlooms':
        return this.filteredHeirlooms.length;
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
      collectedToys: this.collectionsService.getCollectedToys(
        realmSlug,
        characterName
      ),
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
          const collectedToyIds =
            collectedToys?.toys?.map((toy: any) => toy?.toy?.id) || [];

          console.log('Collected toys count:', collectedToyIds.length);

          // Map the toys with the correct data structure
          this.toys = allToys
            .filter((toy) => toy?.data && toy.data.id && toy.data.item?.name)
            .map((toy) => ({
              id: toy.data.id,
              name: toy.data.item.name,
              item: {
                id: toy.data.item.id,
                key: toy.data.item.key,
              },
              description: toy.data.source_description || '',
              source: toy.data.source || { type: 'Unknown', name: 'Unknown' },
              is_alliance_only: false,
              is_horde_only: false,
              media: {
                assets: toy.data.media?.assets || [],
              },
              isCollected: collectedToyIds.includes(toy.data.id),
              displayMedia: toy.data.media?.assets?.[0]?.value || '',
            }));

          console.log('Processed toys summary:', {
            total: this.toys.length,
            collected: this.toys.filter((t) => t.isCollected).length,
            notCollected: this.toys.filter((t) => !t.isCollected).length,
            firstToy: this.toys[0],
          });

          this.filterToys();
        },
        error: (error) => {
          console.error('Error loading toys:', error);
          this.isLoading = false;
        },
      });
  }

  filterToys(): void {
    console.log('Filtering toys:', {
      totalToys: this.toys.length,
      searchQuery: this.searchQuery,
      selectedFilter: this.selectedFilter,
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
      collected: this.filteredToys.filter((t) => t.isCollected).length,
      notCollected: this.filteredToys.filter((t) => !t.isCollected).length,
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

  loadTransmogs(): void {
    this.isLoading = true;
    const characterInfo = this.characterService.getCharacterInfo();

    if (!characterInfo) {
      console.error('Character information not available');
      this.isLoading = false;
      return;
    }

    const { realmSlug, characterName } = characterInfo;

    forkJoin({
      allTransmogs: this.collectionsService.getAllTransmogSets(),
      collectedTransmogs: this.collectionsService.getCollectedTransmogs(realmSlug, characterName)
    }).pipe(
      takeUntil(this.destroy$),
      finalize(() => {
        this.isLoading = false;
      })
    ).subscribe({
      next: ({ allTransmogs, collectedTransmogs }) => {
        console.log('Raw data:', {
          allTransmogsCount: allTransmogs.length,
          collectedSetsCount: collectedTransmogs.appearance_sets?.length || 0,
          sampleAllTransmogs: allTransmogs.slice(0, 2),
          sampleCollected: collectedTransmogs.appearance_sets?.slice(0, 2)
        });

        // Create Set of collected transmog IDs
        const collectedSetIds = new Set(
          collectedTransmogs.appearance_sets?.map(set => set.id) || []
        );

        // Mark sets as collected based on the IDs
        this.transmogSets = allTransmogs.map(set => ({
          ...set,
          isCollected: collectedSetIds.has(set.setId)
        }));

        console.log('Processed transmog sets:', {
          total: this.transmogSets.length,
          collected: this.transmogSets.filter(s => s.isCollected).length,
          notCollected: this.transmogSets.filter(s => !s.isCollected).length,
          sampleCollected: this.transmogSets.filter(s => s.isCollected).slice(0, 2)
        });

        this.filterTransmogs();
      },
      error: (error) => {
        console.error('Error loading transmogs:', error);
        this.isLoading = false;
      }
    });
  }

  filterTransmogs(): void {
    console.log('Filtering transmogs:', {
      totalSets: this.transmogSets.length,
      searchQuery: this.searchQuery,
      selectedFilter: this.selectedFilter
    });

    this.filteredTransmogSets = this.transmogSets.filter((set) => {
      // Handle null/undefined name
      const setName = set.name || '';
      const searchTerm = this.searchQuery || '';
      
      const nameMatch = setName
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

      switch (this.selectedFilter) {
        case 'COLLECTED':
          return nameMatch && set.isCollected;
        case 'NOT COLLECTED':
          return nameMatch && !set.isCollected;
        default:
          return nameMatch;
      }
    });

    console.log('Filter results:', {
      totalFiltered: this.filteredTransmogSets.length,
      collected: this.filteredTransmogSets.filter(s => s.isCollected).length,
      notCollected: this.filteredTransmogSets.filter(s => !s.isCollected).length
    });

    this.currentPage = 1;
  }

  get paginatedTransmogs(): TransmogSet[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredTransmogSets.slice(
      startIndex,
      startIndex + this.itemsPerPage
    );
  }

  loadHeirlooms(): void {
    this.isLoading = true;
    
    const characterInfo = this.characterService.getCharacterInfo();
    
    if (characterInfo) {
      const { realmSlug, characterName } = characterInfo;
      
      forkJoin({
        allHeirlooms: this.collectionsService.getAllHeirlooms(),
        collectedHeirlooms: this.collectionsService.getCollectedHeirlooms(
          realmSlug,
          characterName.toLowerCase()
        )
      }).pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoading = false;
        })
      ).subscribe({
        next: ({ allHeirlooms, collectedHeirlooms }) => {
          console.log('Raw heirloom data:', {
            allHeirloomsCount: allHeirlooms.length,
            collectedCount: collectedHeirlooms.heirlooms?.length || 0,
            sampleCollected: collectedHeirlooms.heirlooms?.slice(0, 2)
          });

          const collectedIds = new Set(
            collectedHeirlooms.heirlooms.map(h => h.heirloom.id)
          );

          this.heirlooms = allHeirlooms.map(heirloomResponse => ({
            ...heirloomResponse.data,
            displayMedia: heirloomResponse.data.media?.assets?.find(asset => asset.key === 'icon')?.value || '',
            isCollected: collectedIds.has(heirloomResponse.data.id)
          }));
          
          console.log('Processed heirlooms:', {
            total: this.heirlooms.length,
            collected: this.heirlooms.filter(h => h.isCollected).length,
            notCollected: this.heirlooms.filter(h => !h.isCollected).length,
            sampleProcessed: this.heirlooms.slice(0, 2),
            collectedIdsArray: Array.from(collectedIds).slice(0, 5)
          });
          
          this.filterHeirlooms();
        },
        error: (error) => {
          console.error('Error loading heirlooms:', error);
          this.isLoading = false;
        }
      });
    } else {
      // Load all heirlooms without collection status
      this.collectionsService.getAllHeirlooms()
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => {
            this.isLoading = false;
          })
        )
        .subscribe({
          next: (heirlooms) => {
            this.heirlooms = heirlooms.map(heirloomResponse => ({
              ...heirloomResponse.data,
              displayMedia: heirloomResponse.data.media?.assets?.find(asset => asset.key === 'icon')?.value || '',
              isCollected: false
            }));
            this.filterHeirlooms();
          },
          error: (error) => {
            console.error('Error loading heirlooms:', error);
            this.isLoading = false;
          }
        });
    }
  }

  filterHeirlooms(): void {
    console.log('Filtering heirlooms:', {
      totalHeirlooms: this.heirlooms.length,
      searchQuery: this.searchQuery,
      selectedFilter: this.selectedFilter
    });

    this.filteredHeirlooms = this.heirlooms.filter((heirloom) => {
      const nameMatch = heirloom.item.name
        .toLowerCase()
        .includes((this.searchQuery || '').toLowerCase());

      switch (this.selectedFilter) {
        case 'COLLECTED':
          return nameMatch && heirloom.isCollected;
        case 'NOT COLLECTED':
          return nameMatch && !heirloom.isCollected;
        default:
          return nameMatch;
      }
    });

    console.log('Filter results:', {
      totalFiltered: this.filteredHeirlooms.length,
      collected: this.filteredHeirlooms.filter(h => h.isCollected).length,
      notCollected: this.filteredHeirlooms.filter(h => !h.isCollected).length
    });

    this.currentPage = 1;
  }

  openMountWowheadLink(mount: Mount): void {
    if (!mount.itemId && !mount.spellId) {
      return; // Not clickable if neither exists
    }

    const url = mount.itemId
      ? `https://www.wowhead.com/item=${mount.itemId}`
      : `https://www.wowhead.com/spell=${mount.spellId}`;

    window.open(url, '_blank');
  }

  openPetWowheadLink(petId: number | undefined): void {
    if (petId) {
      const url = `https://www.wowhead.com/npc=${petId}`;
      window.open(url, '_blank');
    }
  }

  openToyWowheadLink(itemId: number): void {
    const url = `https://www.wowhead.com/item=${itemId}`;
    window.open(url, '_blank');
  }

  openTransmogWowheadLink(itemId: number | undefined): void {
    if (!itemId) {
      return;
    }
    const url = `https://www.wowhead.com/item=${itemId}`;
    window.open(url, '_blank');
  }

  getWowheadUrl(itemId: number): string {
    return `https://www.wowhead.com/item=${itemId}`;
  }

  openHeirloomWowheadLink(itemId: number): void {
    const url = `https://www.wowhead.com/item=${itemId}`;
    window.open(url, '_blank');
  }

  get paginatedHeirlooms(): Heirloom[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredHeirlooms.slice(
      startIndex,
      startIndex + this.itemsPerPage
    );
  }
}
