import type { JerseyColorPaletteItem } from '../types';

// Convert RGB to HEX string
export const rgbToHex = (r: number, g: number, b: number): string => {
  const toHex = (n: number) => {
    const clamped = Math.max(0, Math.min(255, Math.round(n)));
    return clamped.toString(16).padStart(2, '0');
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

// Convert HEX to [r, g, b]
export const hexToRgb = (hex: string): [number, number, number] => {
  let clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  const num = parseInt(clean, 16);
  if (isNaN(num)) return [128, 128, 128];
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
};

// Euclidean distance in RGB color space
export const colorDistance = (
  c1: [number, number, number],
  c2: [number, number, number]
): number => {
  const dr = c1[0] - c2[0];
  const dg = c1[1] - c2[1];
  const db = c1[2] - c2[2];
  return Math.sqrt(dr * dr + dg * dg + db * db);
};

const paletteCache = new Map<string, JerseyColorPaletteItem[]>();

/**
 * Extracts 3-4 distinct dominant colors from an HTMLImageElement using fast offscreen canvas quantization.
 * Runs in under 10ms.
 */
export const extractDominantPalette = (
  img: HTMLImageElement,
  cacheKey?: string,
  maxColors = 4,
  minDist = 42
): JerseyColorPaletteItem[] => {
  const key = cacheKey || img.src;
  if (key && paletteCache.has(key)) {
    return paletteCache.get(key)!;
  }

  const sampleSize = 64;
  const offCanvas = document.createElement('canvas');
  offCanvas.width = sampleSize;
  offCanvas.height = sampleSize;
  const offCtx = offCanvas.getContext('2d');
  if (!offCtx) return [];

  offCtx.drawImage(img, 0, 0, sampleSize, sampleSize);
  const imgData = offCtx.getImageData(0, 0, sampleSize, sampleSize);
  const data = imgData.data;

  // 1. Quantize pixels to groups of 8 to reduce noise without bitwise overflow
  const counts = new Map<number, number>();
  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3];
    if (a < 128) continue; // skip transparent pixels

    const r = Math.min(255, (data[i] >> 3) << 3);
    const g = Math.min(255, (data[i + 1] >> 3) << 3);
    const b = Math.min(255, (data[i + 2] >> 3) << 3);

    const packed = (r << 16) | (g << 8) | b;
    counts.set(packed, (counts.get(packed) || 0) + 1);
  }

  // 2. Sort by frequency
  const sorted = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);

  // 3. Greedy selection of distinct colors
  const selected: { rgb: [number, number, number]; count: number }[] = [];
  let totalCount = 0;

  for (const [packed, count] of sorted) {
    if (selected.length >= maxColors) break;

    const r = (packed >>> 16) & 255;
    const g = (packed >>> 8) & 255;
    const b = packed & 255;
    const rgb: [number, number, number] = [r, g, b];

    const isDistinct = selected.every((s) => colorDistance(s.rgb, rgb) >= minDist);

    if (isDistinct) {
      selected.push({ rgb, count });
      totalCount += count;
    }
  }

  const LABELS = [
    'Warna Utama (Dominan)',
    'Warna Sekunder',
    'Warna Aksen 1',
    'Warna Aksen 2',
  ];

  const palette: JerseyColorPaletteItem[] = selected.map((item, idx) => {
    const hex = rgbToHex(item.rgb[0], item.rgb[1], item.rgb[2]);
    const pct = totalCount > 0 ? Math.round((item.count / totalCount) * 100) : 25;
    return {
      id: `color-${idx + 1}`,
      originalHex: hex,
      currentHex: hex,
      percentage: pct,
      label: LABELS[idx] || `Warna ${idx + 1}`,
    };
  });

  if (key) {
    paletteCache.set(key, palette);
  }

  return palette;
};

