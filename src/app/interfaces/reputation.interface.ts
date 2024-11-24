export interface Reputation {
  faction: {
    name: string;
    id: number;
  };
  standing: {
    raw: number;
    value: number;
    max: number;
    tier: number;
    name: string;
  };
  paragon?: {
    raw: number;
    value: number;
    max: number;
  };
  expansion: string;
}

export interface ReputationResponse {
  [expansion: string]: Reputation[];
}
