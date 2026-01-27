export interface FluidStack {
  type: 'FluidStack';
  specificLocalizedName: string;
  unlocalizedName: string;
  amount: number;
}

export interface Fluid {
  fluidName: string;
  unlocalizedName: string;
  localizedName: string;
  fluidColor: number;
  hasCustomTexture?: boolean;
  fluidDensity: number;
  fluidRarity: string;
  fluidViscosity: number;
  fluidLuminosity: number;
  fluidTemperature: number;
}

export interface ChancedFluidOutput extends FluidStack {
  chance: number;
}

export interface FluidFilter {
  mod?: string;
  searchQuery?: string;
  minTemperature?: number;
  maxTemperature?: number;
}
