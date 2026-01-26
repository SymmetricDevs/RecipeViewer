export interface FluidStack {
  type: 'FluidStack';
  localizedName: string;
  unlocalizedName: string;
  amount: number;
}

export interface Fluid {
  fluidName: string;
  fluidUnlocalizedName: string;
  fluidLocalizedName: string;
  fluidColor: number;
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
