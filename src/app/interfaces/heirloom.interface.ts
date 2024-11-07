export interface HeirloomResponse {
  _id: string;
  heirloomId: number;
  data: Heirloom;
  lastUpdated: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface CollectedHeirloomsResponse {
  heirlooms: Array<{
    heirloom: {
      id: number;
      name: string;
    };
  }>;
}

export interface Heirloom {
  id: number;
  name: string;
  item: {
    id: number;
    name: string;
  };
  source: {
    type: string;
    name: string;
  };
  source_description: string;
  media: {
    assets: Array<{
      key: string;
      value: string;
    }>;
  };
  upgrades: Array<any>;
  displayMedia?: string;
  isCollected?: boolean;
} 