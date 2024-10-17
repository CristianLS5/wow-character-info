type WoWClass =
  | 'Death Knight'
  | 'Demon Hunter'
  | 'Druid'
  | 'Evoker'
  | 'Hunter'
  | 'Mage'
  | 'Monk'
  | 'Paladin'
  | 'Priest'
  | 'Rogue'
  | 'Shaman'
  | 'Warlock'
  | 'Warrior';

type Faction = 'Horde' | 'Alliance';

export const classColors: Record<WoWClass, string> = {
  'Death Knight': '#C41F3B',
  'Demon Hunter': '#A330C9',
  Druid: '#FF7D0A',
  Evoker: '#33937F',
  Hunter: '#A9D271',
  Mage: '#40C7EB',
  Monk: '#00FF96',
  Paladin: '#F58CBA',
  Priest: '#FFFFFF',
  Rogue: '#FFF569',
  Shaman: '#0070DE',
  Warlock: '#8787ED',
  Warrior: '#C79C6E',
};

export const factionColors: Record<Faction, string> = {
  Horde: '#B30000',
  Alliance: '#0078FF',
};

export function getClassColor(className: string): string {
  return classColors[className as WoWClass] || '#FFFFFF';
}

export function getFactionColor(factionName: string): string {
  return factionColors[factionName as Faction] || '#FFFFFF';
}
