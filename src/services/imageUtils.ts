/**
 * Image capture & conversion utilities for order file storage.
 */

/**
 * Compress a canvas to a JPEG data URL with max width constraint.
 * Used to create lightweight mockup preview thumbnails (~50-150KB).
 */
export function canvasToCompressedDataUrl(
  canvas: HTMLCanvasElement,
  maxWidth = 600,
  quality = 0.8
): string {
  if (canvas.width <= maxWidth) {
    return canvas.toDataURL('image/jpeg', quality);
  }

  const scale = maxWidth / canvas.width;
  const offscreen = document.createElement('canvas');
  offscreen.width = maxWidth;
  offscreen.height = Math.round(canvas.height * scale);
  const ctx = offscreen.getContext('2d');
  if (!ctx) return canvas.toDataURL('image/jpeg', quality);

  ctx.drawImage(canvas, 0, 0, offscreen.width, offscreen.height);
  return offscreen.toDataURL('image/jpeg', quality);
}

/**
 * Convert any image URL (blob:, http:, data:) to a base64 data URL.
 * Handles CORS via weserv.nl proxy for external URLs.
 */
export function imageUrlToDataUrl(
  url: string,
  maxWidth = 2000
): Promise<string> {
  return new Promise((resolve, reject) => {
    // Already a data URL
    if (url.startsWith('data:')) {
      resolve(url);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const natW = img.naturalWidth || img.width;
      const natH = img.naturalHeight || img.height;

      let w = natW;
      let h = natH;
      if (w > maxWidth) {
        const ratio = maxWidth / w;
        w = maxWidth;
        h = Math.round(h * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas 2d context'));
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      try {
        resolve(canvas.toDataURL('image/png'));
      } catch (e) {
        reject(e);
      }
    };
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));

    // External HTTP URLs need CORS proxy
    if (url.startsWith('http') && !url.includes('images.weserv.nl')) {
      img.src = `https://images.weserv.nl/?url=${encodeURIComponent(url)}`;
    } else {
      img.src = url;
    }
  });
}

/**
 * Extract raw base64 string from a data URL.
 * Strips the "data:image/...;base64," prefix.
 */
export function dataUrlToBase64(dataUrl: string): string {
  const idx = dataUrl.indexOf(',');
  return idx >= 0 ? dataUrl.substring(idx + 1) : dataUrl;
}

/**
 * Convert data URL to Blob for file download.
 */
export function dataUrlToBlob(dataUrl: string): Blob {
  const parts = dataUrl.split(',');
  const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/png';
  const bstr = atob(parts[1]);
  const n = bstr.length;
  const u8arr = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    u8arr[i] = bstr.charCodeAt(i);
  }
  return new Blob([u8arr], { type: mime });
}

