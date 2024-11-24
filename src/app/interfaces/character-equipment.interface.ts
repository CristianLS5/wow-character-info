export interface CharacterEquipment {
  equipped_items: Array<{
    name: string;
    quality: { type: string; name: string };
    level: { value: number; display_string: string };
    item: { id: number };
    slot: { type: string; name: string };
    iconUrl?: string;
  }>;
} 