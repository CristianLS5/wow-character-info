export interface CharacterInfo {
  name: string;
  realmSlug: string;
  characterName: string;
  gender: string;
  faction: {
    name: string;
    type: string;
  };
  race: string;
  character_class: {
    key: { href: string };
    name: string;
    id: number;
  };
  active_spec: {
    key: { href: string };
    name: string;
    id: number;
  };
  realm: {
    key: { href: string };
    name: string;
    id: number;
    slug: string;
  };
  guild?: {
    name: string;
    realm: {
      key: { href: string };
      name: string;
      id: number;
      slug: string;
    };
  };
  level: number;
  experience: number;
  achievement_points: number;
  last_login_timestamp: number;
  average_item_level: number;
  equipped_item_level: number;
} 