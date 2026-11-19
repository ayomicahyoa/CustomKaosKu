/**
 * Image Quality Validator & Auto-Adjustment Engine for Screen Printing (Sablon)
 * Custom Apparel Bandung.id
 */

export interface PrintQualityReport {
  score: 'excellent' | 'good' | 'warning' | 'rejected';
  width: number;
  height: number;
  megapixels: number;
  hasSolidBackground: boolean;
  backgroundColorHex?: string;
  badgeLabel: string;
  badgeColor: string; // Tailwind color class
  recommendations: string[];
  canAutoEnhance: boolean;
}

/**
 * Menganalisis gambar untuk kelayakan standar sablon/percetakan (DTF/DTG/Manual)
 */
export const analyzeImageForPrint = (imageUrl: string): Promise<PrintQualityReport> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const width = img.naturalWidth || img.width;
      const height = img.naturalHeight || img.height;
      const megapixels = Number(((width * height) / 1000000).toFixed(2));

      // Quick canvas check for background transparency & corner colors
      const canvas = document.createElement('canvas');
      // Downscale for fast pixel inspection
      const sampleW = Math.min(width, 200);
      const sampleH = Math.min(height, 200);
      canvas.width = sampleW;
      canvas.height = sampleH;
      const ctx = canvas.getContext('2d');

      let hasSolidBackground = false;
      let backgroundColorHex: string | undefined = undefined;

      if (ctx) {
        ctx.drawImage(img, 0, 0, sampleW, sampleH);
        const imgData = ctx.getImageData(0, 0, sampleW, sampleH).data;

        // Sample 4 corners
        const cornerCoords = [
          [2, 2],
          [sampleW - 3, 2],
          [2, sampleH - 3],
          [sampleW - 3, sampleH - 3],
        ];

        let cornerR = 0, cornerG = 0, cornerB = 0, cornerA = 0;
        let opaqueCorners = 0;

        cornerCoords.forEach(([cx, cy]) => {
          const idx = (cy * sampleW + cx) * 4;
          const r = imgData[idx];
          const g = imgData[idx + 1];
          const b = imgData[idx + 2];
          const a = imgData[idx + 3];

          cornerR += r;
          cornerG += g;
          cornerB += b;
          cornerA += a;

          if (a > 240) opaqueCorners++;
        });

        const avgA = cornerA / 4;
        const avgR = Math.round(cornerR / 4);
        const avgG = Math.round(cornerG / 4);
        const avgB = Math.round(cornerB / 4);

        // Jika semua 4 sudut tidak transparan dan berwarna terang (biasanya background kotak JPG)
        if (opaqueCorners === 4 && avgA > 230) {
          // Check if white or light grey (> 215)
          if (avgR > 215 && avgG > 215 && avgB > 215) {
            hasSolidBackground = true;
            backgroundColorHex = `#${avgR.toString(16).padStart(2, '0')}${avgG.toString(16).padStart(2, '0')}${avgB.toString(16).padStart(2, '0')}`;
          }
        }
      }

      // Tentukan Skor Kualitas Percetakan
      const minDimension = Math.min(width, height);
      let score: PrintQualityReport['score'] = 'good';
      let badgeLabel = 'Kualitas Bagus (Standar Sablon)';
      let badgeColor = 'text-emerald-700 bg-emerald-50 border-emerald-200';
      const recommendations: string[] = [];

      if (minDimension < 300) {
        score = 'rejected';
        badgeLabel = 'Resolusi Terlalu Rendah (Ditolak)';
        badgeColor = 'text-rose-700 bg-rose-50 border-rose-200';
        recommendations.push(
          `Resolusi file hanya ${width}×${height}px. Hasil cetak akan sangat pecah dan buram pada kaos.`
        );
        recommendations.push(
          'Gunakan gambar dengan resolusi minimal 600px atau klik "Auto-Adjust Standar Cetak" untuk mencoba peningkatan otomatis.'
        );
      } else if (minDimension < 700) {
        score = 'warning';
        badgeLabel = 'Kualitas Cukup (Disarankan Auto-Adjust)';
        badgeColor = 'text-amber-700 bg-amber-50 border-amber-200';
        recommendations.push(
          `Resolusi ${width}×${height}px cukup untuk logo saku/dada (A6), tapi berpotensi kurang tajam jika dicetak ukuran A4 atau A3.`
        );
      } else if (minDimension >= 1400) {
        score = 'excellent';
        badgeLabel = 'Kualitas Sangat Bagus (Siap Cetak HD 300 DPI)';
        badgeColor = 'text-emerald-700 bg-emerald-50 border-emerald-300';
        recommendations.push(
          `Resolusi tinggi ${width}×${height}px (${megapixels} MP). Sangat tajam untuk cetak hingga area A3+ depan & belakang.`
        );
      } else {
        score = 'good';
        badgeLabel = 'Kualitas Bagus (Standar Sablon A4)';
        badgeColor = 'text-sky-700 bg-sky-50 border-sky-200';
        recommendations.push(
          `Resolusi ${width}×${height}px sangat aman dan jernih untuk cetak sablon ukuran standar.`
        );
      }

      if (hasSolidBackground) {
        recommendations.push(
          'Background putih/kotak terdeteksi. Gunakan fitur "Hapus Background" agar gambar menyatu mulus dengan warna kaos.'
        );
      }

      resolve({
        score,
        width,
        height,
        megapixels,
        hasSolidBackground,
        backgroundColorHex,
        badgeLabel,
        badgeColor,
        recommendations,
        canAutoEnhance: score !== 'excellent' || hasSolidBackground,
      });
    };

    img.onerror = () => {
      reject(new Error('Gagal memuat file gambar untuk dianalisis.'));
    };

    img.src = imageUrl;
  });
};

/**
 * Auto-Adjustment Engine:
 * 1. Upscale resolusi jika di bawah standar percetakan
 * 2. Unsharp Masking (Penajaman tepi garis sablon)
 * 3. Hapus Background Putih/Kotak jika terdeteksi
 * 4. Peningkatan Kontras & Kepekatan Warna agar hasil DTF/sablon pekat
 */
export const autoAdjustImageForPrint = (
  imageUrl: string,
  options: {
    upscale?: boolean;
    sharpen?: boolean;
    removeWhiteBg?: boolean;
    boostContrast?: boolean;
  } = {}
): Promise<{ enhancedUrl: string; newWidth: number; newHeight: number }> => {
  return new Promise((resolve, reject) => {
    const {
      upscale = true,
      sharpen = true,
      removeWhiteBg = true,
      boostContrast = true,
    } = options;

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const origW = img.naturalWidth || img.width;
      const origH = img.naturalHeight || img.height;

      // 1. Tentukan ukuran target (Upscale cerdas minimal 1200px jika gambar kecil)
      let targetW = origW;
      let targetH = origH;

      if (upscale && Math.max(origW, origH) < 1400) {
        const factor = Math.min(2.5, 1400 / Math.max(origW, origH));
        targetW = Math.round(origW * factor);
        targetH = Math.round(origH * factor);
      }

      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Gagal menginisialisasi canvas context.'));
        return;
      }

      // High quality scaling
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, targetW, targetH);

      // Ambil ImageData untuk manipulasi pixel
      const imgData = ctx.getImageData(0, 0, targetW, targetH);
      const data = imgData.data;

      // 2. Deteksi sudut untuk remove white/light background
      let targetR = 255, targetG = 255, targetB = 255;
      let isCornerLight = false;

      if (removeWhiteBg) {
        const sampleCoords = [
          [0, 0],
          [targetW - 1, 0],
          [0, targetH - 1],
          [targetW - 1, targetH - 1],
        ];

        let rSum = 0, gSum = 0, bSum = 0;
        sampleCoords.forEach(([cx, cy]) => {
          const idx = (cy * targetW + cx) * 4;
          rSum += data[idx];
          gSum += data[idx + 1];
          bSum += data[idx + 2];
        });

        targetR = rSum / 4;
        targetG = gSum / 4;
        targetB = bSum / 4;

        // Hanya hapus jika sudut memang terang (putih/abu-abu muda > 210)
        if (targetR > 210 && targetG > 210 && targetB > 210) {
          isCornerLight = true;
        }
      }

      // 3. Contrast adjustment factor (+12%)
      const contrast = boostContrast ? 1.12 : 1.0;
      const intercept = 128 * (1 - contrast);

      const tolerance = 42;
      const featherRange = 22;

      for (let i = 0; i < data.length; i += 4) {
        let r = data[i];
        let g = data[i + 1];
        let b = data[i + 2];
        const a = data[i + 3];

        // Background Removal
        if (isCornerLight && a > 0) {
          const dist = Math.sqrt(
            (r - targetR) ** 2 + (g - targetG) ** 2 + (b - targetB) ** 2
          );

          if (dist < tolerance) {
            data[i + 3] = 0; // transparan penuh
            continue;
          } else if (dist < tolerance + featherRange) {
            // Feather edge halus
            const alphaFactor = (dist - tolerance) / featherRange;
            data[i + 3] = Math.round(a * alphaFactor);
          }
        }

        // Contrast & Color Boost
        if (boostContrast && data[i + 3] > 0) {
          r = Math.min(255, Math.max(0, Math.round(r * contrast + intercept)));
          g = Math.min(255, Math.max(0, Math.round(g * contrast + intercept)));
          b = Math.min(255, Math.max(0, Math.round(b * contrast + intercept)));

          data[i] = r;
          data[i + 1] = g;
          data[i + 2] = b;
        }
      }

      ctx.putImageData(imgData, 0, 0);

      // 4. Sharpening filter via Convolution
      if (sharpen) {
        applySharpenFilter(ctx, targetW, targetH);
      }

      const enhancedUrl = canvas.toDataURL('image/png', 0.98);
      resolve({
        enhancedUrl,
        newWidth: targetW,
        newHeight: targetH,
      });
    };

    img.onerror = () => {
      reject(new Error('Gagal memproses peningkatan gambar.'));
    };

    img.src = imageUrl;
  });
};

/**
 * Unsharp Mask Convolution Filter untuk mempertajam detail gambar
 */
function applySharpenFilter(ctx: CanvasRenderingContext2D, width: number, height: number) {
  try {
    const srcData = ctx.getImageData(0, 0, width, height);
    const src = srcData.data;
    const outputData = ctx.createImageData(width, height);
    const dst = outputData.data;

    // Kernel Sharpen Halus (tidak membuat noise berlebih)
    //  0  -0.3   0
    // -0.3 2.2  -0.3
    //  0  -0.3   0
    const wCenter = 2.2;
    const wEdge = -0.3;

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;

        for (let c = 0; c < 3; c++) {
          const center = src[idx + c];
          const top = src[((y - 1) * width + x) * 4 + c];
          const bottom = src[((y + 1) * width + x) * 4 + c];
          const left = src[(y * width + (x - 1)) * 4 + c];
          const right = src[(y * width + (x + 1)) * 4 + c];

          const val =
            center * wCenter + (top + bottom + left + right) * wEdge;

          dst[idx + c] = Math.min(255, Math.max(0, Math.round(val)));
        }
        // Alpha dipertahankan
        dst[idx + 3] = src[idx + 3];
      }
    }

    ctx.putImageData(outputData, 0, 0);
  } catch {
    // Abaikan jika browser memory tidak mengizinkan convolution
  }
}

