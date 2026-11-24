import type { JerseyColorPaletteItem } from '../types';
import { hexToRgb } from './jerseyColorExtractor';

interface RecolorCacheEntry {
  key: string;
  canvas: HTMLCanvasElement;
}

const recolorCache = new Map<string, RecolorCacheEntry>();
const MAX_CACHE = 10;

/**
 * Checks if any color in the palette has been modified from its original.
 */
export const isPaletteModified = (palette?: JerseyColorPaletteItem[]): boolean => {
  if (!palette || palette.length === 0) return false;
  return palette.some(
    (p) => p.currentHex.trim().toLowerCase() !== p.originalHex.trim().toLowerCase()
  );
};

/**
 * Builds a fast 32x32x32 LUT (32,768 RGB entries) using Gaussian RBF delta shift.
 * Computation time: ~5-10ms.
 */
const buildRecolorLUT = (
  palette: JerseyColorPaletteItem[],
  sigma = 48.0
): Uint8Array => {
  const LUT_SIZE = 32;
  const lut = new Uint8Array(LUT_SIZE * LUT_SIZE * LUT_SIZE * 3);

  const origColors = palette.map((p) => hexToRgb(p.originalHex));
  const newColors = palette.map((p) => hexToRgb(p.currentHex));
  const deltas = origColors.map((orig, i) => [
    newColors[i][0] - orig[0],
    newColors[i][1] - orig[1],
    newColors[i][2] - orig[2],
  ]);

  const twoSigmaSq = 2 * sigma * sigma;

  let ptr = 0;
  for (let rIdx = 0; rIdx < LUT_SIZE; rIdx++) {
    const r = (rIdx / (LUT_SIZE - 1)) * 255;
    for (let gIdx = 0; gIdx < LUT_SIZE; gIdx++) {
      const g = (gIdx / (LUT_SIZE - 1)) * 255;
      for (let bIdx = 0; bIdx < LUT_SIZE; bIdx++) {
        const b = (bIdx / (LUT_SIZE - 1)) * 255;

        let weightSum = 1e-6;
        let shiftR = 0;
        let shiftG = 0;
        let shiftB = 0;

        for (let k = 0; k < origColors.length; k++) {
          const orig = origColors[k];
          const dr = r - orig[0];
          const dg = g - orig[1];
          const db = b - orig[2];
          const distSq = dr * dr + dg * dg + db * db;
          const w = Math.exp(-distSq / twoSigmaSq);

          weightSum += w;
          shiftR += w * deltas[k][0];
          shiftG += w * deltas[k][1];
          shiftB += w * deltas[k][2];
        }

        const normR = shiftR / weightSum;
        const normG = shiftG / weightSum;
        const normB = shiftB / weightSum;

        lut[ptr++] = Math.max(0, Math.min(255, Math.round(r + normR)));
        lut[ptr++] = Math.max(0, Math.min(255, Math.round(g + normG)));
        lut[ptr++] = Math.max(0, Math.min(255, Math.round(b + normB)));
      }
    }
  }

  return lut;
};

/**
 * Returns a recolored canvas for the source image given a modified palette.
 * If palette is unmodified, returns null (caller can use the original image directly).
 */
export const getRecoloredCanvas = (
  sourceImg: HTMLImageElement,
  palette?: JerseyColorPaletteItem[],
  customKey?: string
): HTMLCanvasElement | null => {
  if (!isPaletteModified(palette) || !palette) {
    return null;
  }

  const paletteHash = palette.map((p) => `${p.originalHex}->${p.currentHex}`).join('|');
  const cacheKey = `${customKey || sourceImg.src}@${paletteHash}`;

  if (recolorCache.has(cacheKey)) {
    return recolorCache.get(cacheKey)!.canvas;
  }

  // Build Look-Up Table
  const lut = buildRecolorLUT(palette);

  // Create canvas with source image dimensions
  const canvas = document.createElement('canvas');
  const w = sourceImg.naturalWidth || sourceImg.width || 800;
  const h = sourceImg.naturalHeight || sourceImg.height || 1100;
  canvas.width = w;
  canvas.height = h;

  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.drawImage(sourceImg, 0, 0, w, h);
  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;

  // Apply LUT to all pixels using fast 5-bit shifting (division by 8.225)
  const len = data.length;
  for (let i = 0; i < len; i += 4) {
    const a = data[i + 3];
    if (a === 0) continue;

    const rIdx = data[i] >> 3;
    const gIdx = data[i + 1] >> 3;
    const bIdx = data[i + 2] >> 3;

    const lutPtr = (rIdx * 1024 + gIdx * 32 + bIdx) * 3;
    data[i] = lut[lutPtr];
    data[i + 1] = lut[lutPtr + 1];
    data[i + 2] = lut[lutPtr + 2];
  }

  ctx.putImageData(imgData, 0, 0);

  // Manage cache size
  if (recolorCache.size >= MAX_CACHE) {
    const firstKey = recolorCache.keys().next().value;
    if (firstKey) recolorCache.delete(firstKey);
  }
  recolorCache.set(cacheKey, { key: cacheKey, canvas });

  return canvas;
};

