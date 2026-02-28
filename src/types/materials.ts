export interface ToolProperties {
  harvestLevel: number;
  miningSpeed: number;
  attackDamage: number;
  attackSpeed: number;
  durability: number;
}

export interface PipeProperties {
  throughput: number;
  maxTemperature: number;
  gasProof: boolean;
  acidProof: boolean;
  cryoProof: boolean;
  plasmaProof: boolean;
  channels: number;
  priority: number;
}

export interface WireProperties {
  voltage: number;
  amperage: number;
  lossPerBlock: number;
  isSuperconductor: boolean;
  curieTemperature: number;
}

export interface Material {
  resource: string;
  unlocalizedName: string;
  localizedName: string;
  color: number;
  chemicalFormula: string;
  id: number;
  modId: string;
  mass: number;
  neutrons: number;
  protons: number;
  isRadioactive: boolean;
  items?: string[];       // item keys ("resource:metadata")
  fluids?: string[];      // fluid unlocalizedNames
  tool?: ToolProperties;
  pipe?: PipeProperties;
  wire?: WireProperties;
}

export interface MaterialFilter {
  searchQuery?: string;
  modFilter?: string;
}
