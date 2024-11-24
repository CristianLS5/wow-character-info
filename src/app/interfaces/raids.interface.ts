export interface RaidMode {
  difficulty: {
    type: string;
    name: string;
  };
  status: {
    type: string;
    name: string;
  };
  progress: {
    completedCount: number;
    totalCount: number;
  };
}

export interface RaidInstance {
  instance: {
    name: string;
    id: number;
    media?: string;
  };
  modes: RaidMode[];
}

export interface RaidExpansion {
  name: string;
  instances: RaidInstance[];
}

export interface RaidProfile {
  realmSlug: string;
  characterName: string;
  expansions: RaidExpansion[];
  lastUpdated: string;
}
