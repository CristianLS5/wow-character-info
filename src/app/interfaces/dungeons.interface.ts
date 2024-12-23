export interface Affix {
  id: number;
  name: string;
  description: string;
  icon: string;
}

export interface DungeonRun {
  completedTimestamp: string;
  duration: number;
  keystoneLevel: number;
  dungeon: {
    id: number;
    name: string;
    media?: string;
  };
  isCompleted: boolean;
  mythic_rating: {
    color: {
      r: number;
      g: number;
      b: number;
      a: number;
    };
    rating: number;
  };
  keystone_affixes: Affix[];
  media: string;
}

export interface DungeonsResponse {
  _links: {
    self: {
      href: string;
    };
  };
  season: {
    id: number;
  };
  bestRuns: DungeonRun[];
  mythic_rating: {
    color: {
      r: number;
      g: number;
      b: number;
      a: number;
    };
    rating: number;
  };
  character: {
    name: string;
    id: number;
    realm: {
      name: string;
      id: number;
      slug: string;
    };
  };
}

export interface DungeonSeasonResponse extends DungeonsResponse {
  // Add any season-specific fields here if needed
}

export interface SeasonDetails extends DungeonSeasonResponse {
  // Add any additional fields specific to season details if needed
}
