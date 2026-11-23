export type NeckType = 'round' | 'v-neck';
export type SleeveType = 'short' | 'long';
export type ViewAngle = 'front' | 'back' | 'sleeve-left' | 'sleeve-right';

export type PrintTechniqueId = 'dtf' | 'polyflex' | 'plastisol' | 'rubber' | 'discharge' | string;

export interface PrintTechnique {
  id: string;
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
  | 'sleeve-vertical'
  | string;

export interface PrintZonePreset {
  id: string;
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
  zonePreset: string;
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
  isAutoAdjusted?: boolean;
}

export type ShirtSize = 'S' | 'M' | 'L' | 'XL' | 'XXL' | '3XL';

export type JerseyPattern =
  | 'solid'
  | 'stripes'
  | 'geometric'
  | 'diagonal'
  | 'camo'
  | 'custom';

export interface JerseyRosterItem {
  id: string;
  name: string;
  number: string;
  size: ShirtSize;
}

export interface JerseyElementPosition {
  x: number; // percentage 0 - 100
  y: number; // percentage 0 - 100
  scale: number; // 0.2 - 3.0
}

export interface JerseyPartColors {
  frontBody: string;
  backBody: string;
  leftSleeve: string;
  rightSleeve: string;
  collar: string;
}

export interface JerseyGraphicElement {
  id: string;
  type: 'image' | 'text';
  name: string;
  imageUrl?: string;
  text?: string;
  x: number; // percentage 0 - 100
  y: number; // percentage 0 - 100
  scale: number;
  rotation?: number;
  color?: string;
  strokeColor?: string;
  fontFamily?: string;
}

export interface JerseyCustomization {
  pattern: JerseyPattern;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  collarColor: string;
  partColors?: JerseyPartColors;
  activePart?: 'all' | 'front' | 'back' | 'sleeve-left' | 'sleeve-right' | 'collar';
  // Player Name & Number (Optional, can be toggled on/off)
  showPlayerName: boolean;
  playerName: string;
  playerNamePos: JerseyElementPosition;
  showPlayerNumber: boolean;
  playerNumber: string;
  playerNumberPos: JerseyElementPosition;
  fontFamily: string;
  numberColor: string;
  numberStrokeColor: string;
  // Freeform custom elements (logos, sponsors, text) that can be added, dragged, and deleted
  customElements: JerseyGraphicElement[];
  roster?: JerseyRosterItem[];
}

export interface ProductTypeOption {
  id: string; // 'tshirt-round' | 'tshirt-vneck' | 'tshirt-boxy' | 'hoodie-basic' | 'jersey-fullprint'
  name: string;
  shortName: string;
  badge?: string;
  description?: string;
  neckType: NeckType;
  supportsLongSleeve?: boolean;
  baseExtraPrice?: number;
}

export interface CustomTShirtState {
  productType?: string; // e.g. 'tshirt-round' | 'tshirt-vneck' | 'tshirt-boxy' | 'hoodie-basic' | 'jersey-fullprint'
  neckType: NeckType;
  sleeveType: SleeveType;
  color: ShirtColor;
  material: MaterialOption;
  technique: PrintTechnique;
  activeView: ViewAngle;
  designs: Partial<Record<ViewAngle, PlacedDesign>>;
  size: ShirtSize;
  sizeBreakdown: Record<ShirtSize, number>;
  quantity: number;
  jerseyConfig?: JerseyCustomization;
}

export type OrderStatus =
  | 'Waiting for Payment'
  | 'Order masuk DP'
  | 'On Processed'
  | 'Ready to send'
  | 'On Sending'
  | 'Done'
  | 'Cancel';

export interface CustomerOrder {
  id: string; // e.g. "CK-728192"
  createdAt: string; // ISO date string
  updatedAt: string;
  status: OrderStatus;
  customerName?: string;
  customerPhone?: string;
  shippingCity?: string;
  shippingAddress?: string;
  customerNotes?: string;
  trackingNumber?: string; // Nomor resi ekspedisi
  courier?: string; // JNE, J&T, SiCepat, dll
  adminNotes?: string;

  // Garment Specs
  productType?: string;
  productTypeName?: string;
  jerseyConfig?: JerseyCustomization;
  neckType: NeckType;
  sleeveType: SleeveType;
  colorName: string;
  colorHex: string;
  materialName: string;
  materialGsm?: string;
  techniqueName: string;
  size: string;
  sizeBreakdown?: Partial<Record<ShirtSize, number>>;
  quantity: number;
  printBreakdown: {
    placement: string;
    name: string;
    cost: number;
  }[];

  // Financials
  unitPrice: number;
  discountPercent: number;
  grandTotal: number;

  // Payment Scheme (DP 50% vs Lunas)
  paymentType?: 'dp_50' | 'full';
  dpAmount?: number;
  remainingAmount?: number;
  dpPaidAt?: string;
  settlementPaidAt?: string;
  paymentProofUrl?: string;

  // Mockup preview thumbnail (base64 JPEG data URL, compressed ~600px wide)
  mockupPreview?: string;

  // Complete mockup previews for each view angle (front, back, sleeve-left, sleeve-right)
  mockupPreviews?: Partial<Record<ViewAngle, string>>;

  // Original design files uploaded by customer (base64 data URLs)
  designFiles?: {
    fileName: string;
    dataUrl: string;
    view: ViewAngle;
  }[];

  // Google Drive folder URL (created by Apps Script)
  driveFolderUrl?: string;

  // User & Authentication (Optional for Guest)
  userId?: string;
  userEmail?: string;

  // Multi-item cart support
  items?: CartItem[];

  // Legacy field (kept for backward compat)
  previewImage?: string;
}

export interface CartItem {
  id: string; // e.g. "ITEM-171829..."
  createdAt: string;
  productType?: string;
  productTypeName?: string;
  jerseyConfig?: JerseyCustomization;
  neckType: NeckType;
  sleeveType: SleeveType;
  colorName: string;
  colorHex: string;
  materialName: string;
  materialGsm?: string;
  techniqueName: string;
  size: string;
  sizeBreakdown?: Partial<Record<ShirtSize, number>>;
  quantity: number;
  printBreakdown: {
    placement: string;
    name: string;
    cost: number;
  }[];
  unitPrice: number;
  discountPercent: number;
  subtotal: number;
  mockupPreview?: string;
  mockupPreviews?: Partial<Record<ViewAngle, string>>;
  designs?: CustomTShirtState['designs'];
}

export interface AppUser {
  id: string;
  email: string;
  fullName?: string;
  phone?: string;
  avatarUrl?: string;
  createdAt?: string;
}



