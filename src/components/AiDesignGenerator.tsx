import React, { useState } from 'react';
import {
  Sparkles,
  Wand2,
  RefreshCw,
  Palette,
  Check,
  AlertCircle,
  Lightbulb,
} from 'lucide-react';

interface AiDesignGeneratorProps {
  onApplyDesign: (dataUrl: string, promptName: string) => void;
  activeView: string;
}

interface ArtStyle {
  id: string;
  name: string;
  badge: string;
  desc: string;
  promptSuffix: string;
}

const ART_STYLES: ArtStyle[] = [
  {
    id: 'vector-mascot',
    name: 'Vector Distro Mascot',
    badge: 'Populer',
    desc: 'Garis tegas, warna kontras tinggi, gaya stiker & brand distro modern',
    promptSuffix:
      'vector art, sharp clean outlines, t-shirt mascot, graphic apparel design, white background',
  },
  {
    id: 'streetwear-cyberpunk',
    name: 'Streetwear & Cyberpunk',
    badge: 'Edgy',
    desc: 'Modern, futuristik, neon glowing, gaya clothing Harajuku / techwear',
    promptSuffix:
      'streetwear graphic design, cyberpunk neon accents, dark techwear style, t-shirt print',
  },
  {
    id: 'vintage-retro',
    name: 'Vintage / Retro 80s',
    badge: 'Classic',
    desc: 'Tekstur sablon lawas, distressed halftone, nuansa summer / biker 70s-80s',
    promptSuffix:
      'vintage retro 1980s aesthetic, distressed screenprint t-shirt graphic, warm faded colors',
  },
  {
    id: 'anime-manga',
    name: 'Japanese Anime / Ukiyo-e',
    badge: 'Manga',
    desc: 'Gaya karakter anime dinamis dengan sentuhan seni lukis tradisional Jepang',
    promptSuffix:
      'japanese anime illustration, dynamic manga line art, ukiyo-e style, t-shirt graphic, white background',
  },
  {
    id: 'minimalist-lineart',
    name: 'Minimalist Line Art',
    badge: 'Clean',
    desc: 'Satu garis elegan, monokrom, modern estetik ala cafe / typography',
    promptSuffix:
      'minimalist continuous line art, clean modern graphic, single color, apparel design',
  },
  {
    id: 'pixel-gaming',
    name: 'Pixel Art 16-Bit',
    badge: 'Gaming',
    desc: 'Nuansa game retro arcade, pixelated sprite, nostalgia 90-an',
    promptSuffix:
      '16-bit pixel art style, retro arcade game graphic, vibrant colors, t-shirt design, white background',
  },
];

const PROMPT_INSPIRATIONS = [
  'Harimau bermahkota emas dengan pedang samurai',
  'Astronot kucing minum boba di luar angkasa',
  'Tengkorak biker retro dengan mawar merah',
  'Robot mecha naga dengan lampu neon tokyo',
  'Panda pembalap motor GP gaya kartun streetwear',
  'Burung elang gagah dengan bendera sunset retro',
];

export const AiDesignGenerator: React.FC<AiDesignGeneratorProps> = ({
  onApplyDesign,
  activeView,
}) => {
  const [prompt, setPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState<string>('vector-mascot');
  const [autoRemoveBg, setAutoRemoveBg] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Helper: auto remove flat/white background using canvas corner-sampling flood fill
  const processImageTransparency = (img: HTMLImageElement): string => {
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return img.src;

    ctx.drawImage(img, 0, 0);
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;

    // Sample 4 corners to detect background color
    const corners = [
      [0, 0],
      [canvas.width - 1, 0],
      [0, canvas.height - 1],
      [canvas.width - 1, canvas.height - 1],
    ];

    let rSum = 0,
      gSum = 0,
      bSum = 0;
    corners.forEach(([cx, cy]) => {
      const idx = (cy * canvas.width + cx) * 4;
      rSum += data[idx];
      gSum += data[idx + 1];
      bSum += data[idx + 2];
    });
    const targetR = rSum / 4;
    const targetG = gSum / 4;
    const targetB = bSum / 4;

    const tolerance = 42;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const dist = Math.sqrt(
        (r - targetR) ** 2 + (g - targetG) ** 2 + (b - targetB) ** 2
      );

      if (dist < tolerance) {
        data[i + 3] = 0; // Transparent
      } else if (dist < tolerance + 25) {
        // Soft feather edge
        data[i + 3] = Math.round(((dist - tolerance) / 25) * 255);
      }
    }

    ctx.putImageData(imgData, 0, 0);
    return canvas.toDataURL('image/png');
  };

  const fetchAiImageBlob = async (queryText: string): Promise<Blob> => {
    const seed = Math.floor(Math.random() * 999999);
    const rawAiUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(
      queryText
    )}?nologo=true&seed=${seed}`;

    // Pass through weserv proxy to bypass browser Origin 403 and provide full Access-Control-Allow-Origin: *
    const proxiedUrl = `https://images.weserv.nl/?url=${encodeURIComponent(rawAiUrl)}`;

    try {
      const res = await fetch(proxiedUrl);
      if (res.ok) {
        return await res.blob();
      }
    } catch {
      // If weserv fails, try direct
    }

    const directRes = await fetch(rawAiUrl);
    if (!directRes.ok) {
      throw new Error(`Server AI mengembalikan status ${directRes.status}`);
    }
    return await directRes.blob();
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setErrorMsg('Silakan tuliskan deskripsi gambar yang ingin Anda buat.');
      return;
    }

    setErrorMsg(null);
    setLoading(true);
    setLoadingStep('Menghubungkan ke engine AI...');

    try {
      const styleObj = ART_STYLES.find((s) => s.id === selectedStyle) || ART_STYLES[0];
      const fullPrompt = `${prompt.trim()}, ${styleObj.promptSuffix}`;

      setLoadingStep('Membuat gambar desain...');

      let finalDataUrl = '';
      try {
        const blob = await fetchAiImageBlob(fullPrompt);
        setLoadingStep('Memproses gambar...');
        const blobUrl = URL.createObjectURL(blob);

        const img = new Image();
        img.crossOrigin = 'anonymous';
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error('Gagal merender file gambar.'));
          img.src = blobUrl;
        });

        if (autoRemoveBg) {
          setLoadingStep('Membersihkan background transparan...');
          finalDataUrl = processImageTransparency(img);
        } else {
          // Convert blob to Data URL for export compatibility
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth || img.width;
          canvas.height = img.naturalHeight || img.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            finalDataUrl = canvas.toDataURL('image/png');
          } else {
            finalDataUrl = blobUrl;
          }
        }
      } catch (fetchErr) {
        console.warn('Proxy fetch failed, falling back to direct image embed:', fetchErr);
        // Fallback: direct image embedding (always succeeds in HTML <img> tags)
        const seed = Math.floor(Math.random() * 999999);
        finalDataUrl = `https://images.weserv.nl/?url=${encodeURIComponent(
          `https://image.pollinations.ai/prompt/${encodeURIComponent(fullPrompt)}?nologo=true&seed=${seed}`
        )}`;
      }

      onApplyDesign(finalDataUrl, `AI: ${prompt.slice(0, 20)}`);
      setLoading(false);
      setLoadingStep('');
    } catch (err: unknown) {
      console.error('AI Generation error:', err);
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'Server AI sedang sibuk. Silakan klik tombol Generate kembali.'
      );
      setLoading(false);
      setLoadingStep('');
    }
  };

  return (
    <div className="space-y-4 bg-gradient-to-br from-indigo-50/50 via-sky-50/30 to-white p-4 rounded-2xl border border-indigo-100 shadow-2xs">
      {/* Header Info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
            <Sparkles className="w-4 h-4 text-amber-300" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900">AI T-Shirt Graphic Generator</h4>
            <span className="text-[10px] text-slate-500">
              Model FLUX • 100% Gratis Tanpa Token
            </span>
          </div>
        </div>
        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
          Online ✓
        </span>
      </div>

      {/* Prompt Input */}
      <div>
        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
          Deskripsikan Gambar Desain yang Diinginkan
        </label>
        <div className="relative">
          <textarea
            value={prompt}
            onChange={(e) => {
              setPrompt(e.target.value);
              if (errorMsg) setErrorMsg(null);
            }}
            placeholder="Contoh: Harimau bermahkota emas dengan pedang samurai gaya streetwear jepang..."
            rows={3}
            className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white shadow-2xs resize-none"
            disabled={loading}
          />
        </div>

        {/* Quick Inspiration Pills */}
        <div className="mt-2">
          <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-500 mb-1.5">
            <Lightbulb className="w-3 h-3 text-amber-500" />
            <span>Ide Cepat (Klik untuk coba):</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {PROMPT_INSPIRATIONS.map((insp, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setPrompt(insp)}
                disabled={loading}
                className="text-[10px] px-2 py-1 bg-white hover:bg-indigo-50 text-slate-600 hover:text-indigo-700 border border-slate-200 hover:border-indigo-300 rounded-lg transition text-left cursor-pointer"
              >
                + {insp}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Art Style Configurator Grid */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
            <Palette className="w-3.5 h-3.5 text-indigo-600" />
            <span>Pilihan Gaya Desain (Art Style)</span>
          </label>
          <span className="text-[10px] text-indigo-600 font-semibold font-mono">
            {ART_STYLES.find((s) => s.id === selectedStyle)?.name}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-0.5">
          {ART_STYLES.map((style) => {
            const isSelected = selectedStyle === style.id;
            return (
              <button
                key={style.id}
                type="button"
                onClick={() => setSelectedStyle(style.id)}
                disabled={loading}
                className={`p-2 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-50/80 shadow-xs ring-1 ring-indigo-500'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/80'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span
                    className={`text-[11px] font-bold line-clamp-1 ${
                      isSelected ? 'text-indigo-950' : 'text-slate-800'
                    }`}
                  >
                    {style.name}
                  </span>
                  {isSelected ? (
                    <Check className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
                  ) : (
                    <span className="text-[9px] text-slate-400 bg-slate-100 px-1 py-0.5 rounded">
                      {style.badge}
                    </span>
                  )}
                </div>
                <p className="text-[9px] text-slate-500 mt-1 line-clamp-2 leading-tight">
                  {style.desc}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Auto Background Removal Toggle */}
      <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200 text-xs">
        <label
          htmlFor="ai-auto-bg"
          className="flex items-center gap-2 cursor-pointer select-none"
        >
          <input
            id="ai-auto-bg"
            type="checkbox"
            checked={autoRemoveBg}
            onChange={(e) => setAutoRemoveBg(e.target.checked)}
            disabled={loading}
            className="w-4 h-4 rounded text-indigo-600 accent-indigo-600 cursor-pointer"
          />
          <div>
            <div className="text-[11px] font-bold text-slate-800">
              Hapus Background Otomatis
            </div>
            <div className="text-[10px] text-slate-500">
              Latar putih/polos dibuat transparan agar menyatu dengan warna kaos
            </div>
          </div>
        </label>
        <Wand2 className="w-4 h-4 text-amber-500 flex-shrink-0" />
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div className="flex items-start gap-2 bg-rose-50 border border-rose-200 p-2.5 rounded-xl text-rose-700 text-[11px]">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Generate Action Button */}
      <button
        type="button"
        onClick={handleGenerate}
        disabled={loading || !prompt.trim()}
        className={`w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition cursor-pointer ${
          loading || !prompt.trim()
            ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
            : 'bg-gradient-to-r from-indigo-600 via-sky-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white shadow-indigo-500/25'
        }`}
      >
        {loading ? (
          <>
            <RefreshCw className="w-4 h-4 animate-spin text-white" />
            <div className="flex flex-col items-start leading-tight">
              <span>{loadingStep || 'Sedang memproses AI...'}</span>
              <span className="text-[9px] font-normal text-indigo-200">
                Membutuhkan ~3–7 detik
              </span>
            </div>
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Generate & Pasang Desain ke {activeView === 'front' ? 'Tampak Depan' : activeView === 'back' ? 'Tampak Belakang' : 'Lengan'}</span>
          </>
        )}
      </button>
    </div>
  );
};
