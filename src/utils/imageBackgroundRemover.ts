/**
 * imageBackgroundRemover.ts
 * Utility to automatically remove solid backgrounds (e.g. white, light gray, black) from uploaded logos.
 * Samples edges & corners to determine background color and applies smooth alpha feathering.
 */

export interface RemoveBgOptions {
  tolerance?: number; // 20 - 80 (default: 42)
  feather?: number; // soft edge transition pixels (default: 16)
  targetColor?: { r: number; g: number; b: number }; // if null, auto-detects from corners
}

export function removeImageBackground(
  imageUrl: string,
  options: RemoveBgOptions = {}
): Promise<string> {
  const { tolerance = 42, feather = 16, targetColor } = options;

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const width = img.naturalWidth || img.width;
        const height = img.naturalHeight || img.height;

        if (width === 0 || height === 0) {
          return resolve(imageUrl);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return resolve(imageUrl);

        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, width, height);
        const data = imgData.data;

        let bgR = 255;
        let bgG = 255;
        let bgB = 255;

        if (targetColor) {
          bgR = targetColor.r;
          bgG = targetColor.g;
          bgB = targetColor.b;
        } else {
          // Auto-detect background color by sampling perimeter pixels & 4 corners
          const sampleCoords: [number, number][] = [
            // 4 corners
            [0, 0],
            [1, 0],
            [0, 1],
            [width - 1, 0],
            [width - 2, 0],
            [width - 1, 1],
            [0, height - 1],
            [1, height - 1],
            [0, height - 2],
            [width - 1, height - 1],
            [width - 2, height - 1],
            [width - 1, height - 2],
            // Mid edges
            [Math.floor(width / 2), 0],
            [Math.floor(width / 2), height - 1],
            [0, Math.floor(height / 2)],
            [width - 1, Math.floor(height / 2)],
          ];

          let rSum = 0;
          let gSum = 0;
          let bSum = 0;
          let validCount = 0;

          sampleCoords.forEach(([x, y]) => {
            if (x >= 0 && x < width && y >= 0 && y < height) {
              const idx = (y * width + x) * 4;
              // Only sample if pixel is not already transparent
              if (data[idx + 3] > 20) {
                rSum += data[idx];
                gSum += data[idx + 1];
                bSum += data[idx + 2];
                validCount++;
              }
            }
          });

          if (validCount > 0) {
            bgR = Math.round(rSum / validCount);
            bgG = Math.round(gSum / validCount);
            bgB = Math.round(bSum / validCount);
          }
        }

        // Process all pixels
        for (let i = 0; i < data.length; i += 4) {
          const a = data[i + 3];
          if (a === 0) continue; // Already transparent

          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];

          // Euclidean color distance to background
          const dist = Math.sqrt(
            (r - bgR) ** 2 + (g - bgG) ** 2 + (b - bgB) ** 2
          );

          if (dist < tolerance) {
            data[i + 3] = 0; // Completely transparent
          } else if (dist < tolerance + feather) {
            // Smooth antialiased feather edge
            const ratio = (dist - tolerance) / feather;
            const newAlpha = Math.round(ratio * a);
            data[i + 3] = Math.min(a, newAlpha);
          }
        }

        ctx.putImageData(imgData, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } catch (err) {
        console.warn('Failed to remove background:', err);
        resolve(imageUrl); // Fallback to original
      }
    };

    img.onerror = () => {
      resolve(imageUrl);
    };

    img.src = imageUrl;
  });
}
