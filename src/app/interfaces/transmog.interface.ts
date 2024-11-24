export interface TransmogAppearance {
  id: number;
  slot: {
    type: string;
    name: string;
  };
  item: {
    id: number;
    name: string;
  };
  icon: string;
  _id: string;
}

export interface TransmogSet {
  _id: string;
  setId: number;
  name: string;
  appearances: TransmogAppearance[];
  lastUpdated: string;
  isCollected?: boolean;
  itemsNotAvailable?: boolean;
}

export interface CollectedTransmogsData {
  appearance_sets: Array<{
    id: number;
    name: string;
    _id: string;
  }>;
} 