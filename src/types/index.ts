export type NeckType = 'round' | 'v-neck';
export type SleeveType = 'short' | 'long';
export type ViewAngle = 'front' | 'back' | 'sleeve-left' | 'sleeve-right';

export type PrintTechniqueId = 'dtf' | 'polyflex' | 'plastisol' | 'rubber' | 'discharge';

export interface PrintTechnique {
  id: PrintTechniqueId;
  name: string;
  badge: string;
  description: string;
  bestFor: string;
  minQty: number;
  baseCost: number; // in IDR
}

export interface MaterialOption {
  id: string;
  name: string;
  gsm: string;
  description: string;
  basePrice: number; // in IDR
  badge?: string;
}

export interface ShirtColor {
  id: string;
  name: string;
  hex: string;
  isDark: boolean;
}

export type PresetPlacement = 
  | 'chest-left' 
  | 'chest-right' 
  | 'chest-top' 
  | 'front-a4' 
  | 'front-a3'
  | 'back-neck'
  | 'back-a4'
  | 'back-a3'
  | 'sleeve-patch'
  | 'sleeve-vertical';

export interface PrintZonePreset {
  id: PresetPlacement;
  name: string;
  dimensions: string; // e.g. "10 x 10 cm", "21 x 30 cm"
  view: ViewAngle;
  defaultX: number; // percentage 0-100
  defaultY: number; // percentage 0-100
  defaultWidth: number; // percentage of shirt container
  defaultHeight: number;
  description: string;
  cost: number; // additional cost in IDR
}

export interface PlacedDesign {
  imageUrl: string;
  originalImageUrl?: string;
  fileName: string;
  zonePreset: PresetPlacement;
  x: number; // percentage
  y: number; // percentage
  scale: number; // 0.2 to 2.5 (zoom level)
  offsetY?: number; // -50 to +50 percentage within zone
  offsetX?: number; // -50 to +50 percentage within zone
  rotation: number; // -180 to 180 deg
  aspectRatio: number;
  wrinkleIntensity?: number; // 0 to 1 (default 0.92)
  blendMode?: 'normal' | 'multiply';
  cornerRadius?: number; // 0 to 24px
}

export interface CustomTShirtState {
  neckType: NeckType;
  sleeveType: SleeveType;
  color: ShirtColor;
  material: MaterialOption;
  technique: PrintTechnique;
  activeView: ViewAngle;
  designs: Partial<Record<ViewAngle, PlacedDesign>>;
  size: 'S' | 'M' | 'L' | 'XL' | 'XXL' | '3XL';
  quantity: number;
}

