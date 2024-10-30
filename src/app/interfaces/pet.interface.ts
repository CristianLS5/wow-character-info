export interface PetType {
  id: number;
  type: string;
  name: string;
  iconPath: string;
}

export const PET_TYPES: { [key: number]: PetType } = {
  0: {
    id: 0,
    type: 'HUMANOID',
    name: 'Humanoid',
    iconPath: 'humanoid.png',
  },
  1: {
    id: 1,
    type: 'DRAGONKIN',
    name: 'Dragonkin',
    iconPath: 'dragonkin.png',
  },
  2: {
    id: 2,
    type: 'FLYING',
    name: 'Flying',
    iconPath: 'flying.png',
  },
  3: {
    id: 3,
    type: 'UNDEAD',
    name: 'Undead',
    iconPath: 'undead.png',
  },
  4: {
    id: 4,
    type: 'CRITTER',
    name: 'Critter',
    iconPath: 'critter.png',
  },
  5: {
    id: 5,
    type: 'MAGIC',
    name: 'Magic',
    iconPath: 'magic.png',
  },
  6: {
    id: 6,
    type: 'ELEMENTAL',
    name: 'Elemental',
    iconPath: 'elemental.png',
  },
  7: {
    id: 7,
    type: 'BEAST',
    name: 'Beast',
    iconPath: 'beast.png',
  },
  8: {
    id: 8,
    type: 'AQUATIC',
    name: 'Aquatic',
    iconPath: 'aquatic.png',
  },
  9: {
    id: 9,
    type: 'MECHANICAL',
    name: 'Mechanical',
    iconPath: 'mechanical.png',
  },
};
