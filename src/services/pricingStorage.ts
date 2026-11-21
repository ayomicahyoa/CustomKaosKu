import type {
  MaterialOption,
  PrintTechnique,
  PrintZonePreset,
  ShirtColor,
} from '../types';
import {
  MATERIALS,
  PRINT_TECHNIQUES,
  PRINT_ZONE_PRESETS,
  SHIRT_COLORS,
} from '../data/mockData';

import {
  saveCatalogToSupabase,
  fetchCatalogFromSupabase,
  isSupabaseConfigured,
} from './supabaseClient';

export interface ProductDatabaseState {
  materials: MaterialOption[];
  techniques: PrintTechnique[];
  printZones: PrintZonePreset[];
  colors: ShirtColor[];
  lastUpdated: string;
}

const STORAGE_KEY = 'customkaos_product_database_v1';
const PIN_STORAGE_KEY = 'customkaos_admin_pin_v1';
const DEFAULT_PIN = '1234';

export const getDefaultDatabase = (): ProductDatabaseState => ({
  materials: [...MATERIALS],
  techniques: [...PRINT_TECHNIQUES],
  printZones: [...PRINT_ZONE_PRESETS],
  colors: [...SHIRT_COLORS],
  lastUpdated: new Date().toISOString(),
});

export const loadProductDatabase = (): ProductDatabaseState => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultDatabase();
    const parsed = JSON.parse(raw) as Partial<ProductDatabaseState>;
    return {
      materials: Array.isArray(parsed.materials) && parsed.materials.length > 0 ? parsed.materials : MATERIALS,
      techniques: Array.isArray(parsed.techniques) && parsed.techniques.length > 0 ? parsed.techniques : PRINT_TECHNIQUES,
      printZones:
        Array.isArray(parsed.printZones) && parsed.printZones.length > 0
          ? [
              ...parsed.printZones,
              ...PRINT_ZONE_PRESETS.filter((p) => !parsed.printZones!.some((x) => x.id === p.id)),
            ]
          : PRINT_ZONE_PRESETS,
      colors: Array.isArray(parsed.colors) && parsed.colors.length > 0 ? parsed.colors : SHIRT_COLORS,
      lastUpdated: parsed.lastUpdated || new Date().toISOString(),
    };
  } catch (err) {
    console.error('Failed to load product database from localStorage:', err);
    return getDefaultDatabase();
  }
};

export const syncCatalogFromCloud = async (): Promise<ProductDatabaseState | null> => {
  if (!isSupabaseConfigured()) return null;
  const cloudDb = await fetchCatalogFromSupabase();
  if (cloudDb) {
    saveProductDatabase(cloudDb, false); // Save locally without re-pushing
    return cloudDb;
  }
  return null;
};

export const saveProductDatabase = (db: ProductDatabaseState, syncCloud = true): void => {
  try {
    const dataToSave = {
      ...db,
      lastUpdated: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));

    if (syncCloud && isSupabaseConfigured()) {
      saveCatalogToSupabase(dataToSave).catch((err) => {
        console.warn('Async cloud catalog save failed:', err);
      });
    }
  } catch (err) {
    console.error('Failed to save product database to localStorage:', err);
  }
};

export const resetProductDatabase = (): ProductDatabaseState => {
  const defaultDb = getDefaultDatabase();
  saveProductDatabase(defaultDb);
  return defaultDb;
};

// Admin PIN Security
export const getAdminPin = (): string => {
  return localStorage.getItem(PIN_STORAGE_KEY) || DEFAULT_PIN;
};

export const setAdminPin = (newPin: string): void => {
  localStorage.setItem(PIN_STORAGE_KEY, newPin);
};

export const verifyAdminPin = (inputPin: string): boolean => {
  const currentPin = getAdminPin();
  return inputPin.trim() === currentPin.trim();
};

// JSON Export & Import
export const exportDatabaseToJson = (db: ProductDatabaseState): string => {
  return JSON.stringify(db, null, 2);
};

export const importDatabaseFromJson = (jsonStr: string): ProductDatabaseState => {
  const parsed = JSON.parse(jsonStr) as Partial<ProductDatabaseState>;
  if (!parsed.materials || !parsed.techniques || !parsed.printZones || !parsed.colors) {
    throw new Error('Format file JSON tidak sesuai dengan skema Database CustomKaos.');
  }
  const validated: ProductDatabaseState = {
    materials: parsed.materials,
    techniques: parsed.techniques,
    printZones: parsed.printZones,
    colors: parsed.colors,
    lastUpdated: new Date().toISOString(),
  };
  saveProductDatabase(validated);
  return validated;
};

