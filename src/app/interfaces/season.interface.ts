export interface DungeonSeason {
  id: number;
  seasonName: string;
  startTimestamp: Date;
  periods: number[];
  isCurrent: boolean;
  lastUpdated: Date;
}

export interface SeasonsResponse {
  seasons: DungeonSeason[];
  currentSeason: DungeonSeason | null;
}

export interface SeasonIndexResponse {
  current_season: {
    id: number;
  };
  seasons: Array<{
    id: number;
  }>;
}

export interface SeasonDetailsResponse {
  id: number;
  start_timestamp: number;
  season_name: string;
  periods: Array<{
    key: { href: string };
    id: number;
  }>;
}
