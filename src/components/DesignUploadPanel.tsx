import React, { useRef, useState } from 'react';
import type { CustomTShirtState, PlacedDesign, PresetPlacement, PrintZonePreset } from '../types';
import { PRINT_ZONE_PRESETS, SAMPLE_ARTWORKS } from '../data/mockData';
import { AiDesignGenerator } from './AiDesignGenerator';
import {
  Upload,
  Sparkles,
  Sliders,
  Maximize2,
  RotateCw,
  Wand2,
  Undo2,
  Layers,
  CheckCircle2,
} from 'lucide-react';

interface DesignUploadPanelProps {
  state: CustomTShirtState;
  printZones?: PrintZonePreset[];
  onUpdateDesign: (design: PlacedDesign | null) => void;
}

export const DesignUploadPanel: React.FC<DesignUploadPanelProps> = ({
  state,
  printZones = PRINT_ZONE_PRESETS,
  onUpdateDesign,
}) => {
  const [sourceMode, setSourceMode] = useState<'upload' | 'ai'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeDesign = state.designs[state.activeView] || null;

  // Filter presets for the active view (mirrored for right sleeve)
  const currentPresets = printZones.filter((p) => {
    if (state.activeView === 'sleeve-left' || state.activeView === 'sleeve-right') {
      return p.view === 'sleeve-left';
    }
    return p.view === state.activeView;
  }).map((p) => {
    if (state.activeView === 'sleeve-right') {
      return {
        ...p,
        defaultX: 100 - p.defaultX,
      };
    }
    return p;
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      const defaultPreset = currentPresets[0];

      onUpdateDesign({
        imageUrl: url,
        originalImageUrl: url,
        fileName: file.name,
        zonePreset: defaultPreset.id,
        x: defaultPreset.defaultX,
        y: defaultPreset.defaultY,
        scale: 1,
        rotation: 0,
        aspectRatio: 1,
        wrinkleIntensity: 0.92,
        blendMode: 'normal',
        cornerRadius: 0,
      });
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleApplyAiDesign = (dataUrl: string, promptName: string) => {
    const defaultPreset = currentPresets[0];
    onUpdateDesign({
      imageUrl: dataUrl,
      originalImageUrl: dataUrl,
      fileName: promptName,
      zonePreset: activeDesign?.zonePreset || defaultPreset.id,
      x: defaultPreset.defaultX,
      y: defaultPreset.defaultY,
      scale: 1,
      rotation: 0,
      aspectRatio: 1,
      wrinkleIntensity: 0.92,
      blendMode: 'normal',
      cornerRadius: 0,
    });
  };

  const handleApplySample = (sample: (typeof SAMPLE_ARTWORKS)[0]) => {
    const svgBlob = new Blob([sample.svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    const defaultPreset = currentPresets[0];

    onUpdateDesign({
      imageUrl: url,
      originalImageUrl: url,
      fileName: `${sample.name}.svg`,
      zonePreset: defaultPreset.id,
      x: defaultPreset.defaultX,
      y: defaultPreset.defaultY,
      scale: 1,
      rotation: 0,
      aspectRatio: 1,
      wrinkleIntensity: 0.92,
      blendMode: 'normal',
      cornerRadius: 0,
    });
  };

  // Instant Auto-Adjust to chosen print zone
  const handleSelectPreset = (presetId: PresetPlacement) => {
    const preset = currentPresets.find((p) => p.id === presetId);
    if (!preset) return;

    if (activeDesign) {
      onUpdateDesign({
        ...activeDesign,
        zonePreset: presetId,
        x: preset.defaultX,
        y: preset.defaultY,
        scale: 1, // Auto fit size
      });
    }
  };

  // Magic Background Remover (Auto samples corners and makes background transparent)
  const handleRemoveBackground = () => {
    if (!activeDesign) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);

      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;

      // Sample 4 corners to find background color
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

      const tolerance = 40;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const dist = Math.sqrt(
          (r - targetR) ** 2 + (g - targetG) ** 2 + (b - targetB) ** 2
        );

        if (dist < tolerance) {
          data[i + 3] = 0; // Completely transparent
        } else if (dist < tolerance + 20) {
          // Feather edge
          data[i + 3] = Math.round(((dist - tolerance) / 20) * 255);
        }
      }

      ctx.putImageData(imgData, 0, 0);
      const transparentDataUrl = canvas.toDataURL('image/png');

      onUpdateDesign({
        ...activeDesign,
        originalImageUrl: activeDesign.originalImageUrl || activeDesign.imageUrl,
        imageUrl: transparentDataUrl,
      });
    };
    img.src = activeDesign.imageUrl;
  };

  // Restore Original Background
  const handleRestoreBackground = () => {
    if (!activeDesign || !activeDesign.originalImageUrl) return;
    onUpdateDesign({
      ...activeDesign,
      imageUrl: activeDesign.originalImageUrl,
      originalImageUrl: undefined,
    });
  };

  return (
    <div className="space-y-5">
      {/* Method Switcher Tabs: File Upload vs AI Generator */}
      <div className="flex items-center p-1 bg-slate-100 rounded-2xl border border-slate-200">
        <button
          type="button"
          onClick={() => setSourceMode('upload')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            sourceMode === 'upload'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Upload File Sendiri</span>
        </button>

        <button
          type="button"
          onClick={() => setSourceMode('ai')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            sourceMode === 'ai'
              ? 'bg-gradient-to-r from-indigo-600 to-sky-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>Buat Desain AI</span>
        </button>
      </div>

      {/* Mode Content: File Upload (Prioritized) vs AI Generator */}
      {sourceMode === 'upload' ? (
        /* Mode: Manual File Upload */
        <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl">
          <label className="block text-xs font-semibold text-slate-700 mb-2">
            Upload File ({state.activeView === 'front' ? 'Tampak Depan' : state.activeView === 'back' ? 'Tampak Belakang' : 'Area Lengan'})
          </label>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/svg+xml,image/webp"
            onChange={handleFileUpload}
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex flex-col items-center justify-center p-5 border-2 border-dashed border-sky-300 hover:border-sky-500 bg-sky-50/50 hover:bg-sky-50 rounded-xl transition cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <Upload className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800">
              {activeDesign ? 'Ganti File Gambar Desain' : 'Klik untuk Upload Gambar Desain'}
            </span>
            <span className="text-[11px] text-slate-500 mt-0.5">
              Format PNG transparan, JPG, atau SVG
            </span>
          </button>
        </div>
      ) : (
        /* Mode: AI Generator */
        <AiDesignGenerator
          onApplyDesign={handleApplyAiDesign}
          activeView={state.activeView}
        />
      )}

      {/* Active Design Badge & Quick Actions */}
      {activeDesign && (
        <div className="p-3 bg-white border border-slate-200 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-[11px] bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200/80">
            <span className="truncate max-w-[200px] text-slate-700 font-mono font-medium">
              📎 {activeDesign.fileName}
            </span>
            <span className="text-emerald-600 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Terpasang
            </span>
          </div>

          {/* Quick Background Remover Button */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleRemoveBackground}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-lg text-[11px] font-bold shadow-xs transition cursor-pointer"
              title="Hapus background warna/putih otomatis agar gambar menyatu dengan kaos"
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>Hapus Background Otomatis</span>
            </button>

            {activeDesign.originalImageUrl && (
              <button
                onClick={handleRestoreBackground}
                className="flex items-center justify-center gap-1 py-1.5 px-2.5 bg-slate-150 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold transition cursor-pointer"
                title="Kembalikan background kotak asli"
              >
                <Undo2 className="w-3.5 h-3.5" />
                <span>Undo</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Preset Placement Selection (Auto-adjust) */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold text-slate-700">
            Pilih Ukuran & Area Cetak (Auto-Adjust)
          </label>
          <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Auto Resize & Snap
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {currentPresets.map((preset) => {
            const isSelected = activeDesign?.zonePreset === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => handleSelectPreset(preset.id)}
                className={`text-left p-2.5 rounded-xl border text-xs transition-all relative cursor-pointer ${
                  isSelected
                    ? 'border-sky-500 bg-sky-50/70 shadow-xs ring-1 ring-sky-500'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`font-bold ${isSelected ? 'text-sky-900' : 'text-slate-800'}`}>
                    {preset.name}
                  </span>
                  <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                    {preset.dimensions}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1 line-clamp-1">
                  {preset.description}
                </p>
                <div className="mt-1.5 flex items-center justify-between text-[10px]">
                  <span className="font-semibold text-sky-600">
                    + Rp {preset.cost.toLocaleString('id-ID')}
                  </span>
                  {isSelected && (
                    <span className="text-[9px] font-bold text-sky-700 uppercase">
                      Aktif ✓
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Adjustments: Scale Fit, Vertical Adjust, Rotation & Realism Folds */}
      {activeDesign && (
        <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-3.5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
              <Sliders className="w-3.5 h-3.5 text-sky-600" />
              <span>Zoom & Posisi di Dalam Area</span>
            </div>
            <span className="text-[10px] text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200 font-semibold">
              Auto-Clipped di Batas Area
            </span>
          </div>

          {/* Zoom / Lebar Gambar Slider */}
          <div>
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-slate-700 font-semibold flex items-center gap-1">
                <Maximize2 className="w-3 h-3 text-sky-600" /> Zoom / Lebar Gambar
              </span>
              <span className="font-mono text-slate-800 font-bold bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">
                {Math.round(activeDesign.scale * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.05"
              value={activeDesign.scale}
              onChange={(e) =>
                onUpdateDesign({
                  ...activeDesign,
                  scale: parseFloat(e.target.value),
                })
              }
              className="w-full accent-sky-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[9px] text-slate-400 mt-0.5">
              <span>Fit (100%)</span>
              <span>Zoom Lebih Lebar (Terpotong di Batas)</span>
            </div>
          </div>

          {/* Vertical Adjust (Atas / Bawah) Slider */}
          <div>
            <div className="flex justify-between items-center text-[11px] mb-1">
              <span className="text-slate-700 font-semibold flex items-center gap-1">
                ↕ Posisi Atas / Bawah
              </span>
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-slate-800 font-bold bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">
                  {(activeDesign.offsetY ?? 0) > 0 ? `+${activeDesign.offsetY}%` : `${activeDesign.offsetY ?? 0}%`}
                </span>
                {(activeDesign.offsetY ?? 0) !== 0 && (
                  <button
                    onClick={() =>
                      onUpdateDesign({
                        ...activeDesign,
                        offsetY: 0,
                      })
                    }
                    className="text-[9px] text-sky-600 hover:underline font-medium"
                    title="Kembalikan posisi vertikal ke tengah"
                  >
                    Reset Tengah
                  </button>
                )}
              </div>
            </div>
            <input
              type="range"
              min="-40"
              max="40"
              step="1"
              value={activeDesign.offsetY ?? 0}
              onChange={(e) =>
                onUpdateDesign({
                  ...activeDesign,
                  offsetY: parseInt(e.target.value, 10),
                })
              }
              className="w-full accent-sky-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[9px] text-slate-400 mt-0.5">
              <span>Naik ke Atas</span>
              <span>Tengah (0)</span>
              <span>Turun ke Bawah</span>
            </div>
          </div>

          {/* Rotation Slider */}
          <div>
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-slate-600 flex items-center gap-1">
                <RotateCw className="w-3 h-3 text-slate-400" /> Kemiringan Sudut (Rotasi)
              </span>
              <span className="font-mono text-slate-800 font-semibold">
                {activeDesign.rotation}°
              </span>
            </div>
            <input
              type="range"
              min="-45"
              max="45"
              step="1"
              value={activeDesign.rotation}
              onChange={(e) =>
                onUpdateDesign({
                  ...activeDesign,
                  rotation: parseInt(e.target.value, 10),
                })
              }
              className="w-full accent-sky-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
            />
          </div>

          {/* Wrinkle & Shadow Overlay Intensity */}
          <div>
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-slate-600 flex items-center gap-1">
                <Layers className="w-3 h-3 text-amber-500" /> Efek Lipatan & Kerutan Kain
              </span>
              <span className="font-mono text-slate-800 font-semibold">
                {Math.round((activeDesign.wrinkleIntensity ?? 0.92) * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0.5"
              max="1.0"
              step="0.02"
              value={activeDesign.wrinkleIntensity ?? 0.92}
              onChange={(e) =>
                onUpdateDesign({
                  ...activeDesign,
                  wrinkleIntensity: parseFloat(e.target.value),
                })
              }
              className="w-full accent-amber-500 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[9px] text-slate-400 mt-0.5">
              <span>Halus (Flat)</span>
              <span>Kerutan Nyata (3D)</span>
            </div>
          </div>

          {/* Corner Radius Slider (for box images) */}
          <div>
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-slate-600">Lengkung Sudut Gambar</span>
              <span className="font-mono text-slate-800 font-semibold">
                {activeDesign.cornerRadius ?? 0}px
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="24"
              step="2"
              value={activeDesign.cornerRadius ?? 0}
              onChange={(e) =>
                onUpdateDesign({
                  ...activeDesign,
                  cornerRadius: parseInt(e.target.value, 10),
                })
              }
              className="w-full accent-sky-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
            />
          </div>
        </div>
      )}

      {/* Quick Sample Graphics */}
      <div className="p-3.5 bg-slate-50/80 border border-slate-200/60 rounded-2xl">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Atau Gunakan Desain Contoh (Preview Cepat)</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {SAMPLE_ARTWORKS.map((sample) => (
            <button
              key={sample.id}
              onClick={() => handleApplySample(sample)}
              className="flex flex-col items-center p-2 rounded-xl border border-slate-200 bg-white hover:border-sky-400 hover:shadow-xs transition group text-center cursor-pointer"
            >
              <div
                className="w-12 h-12 flex items-center justify-center p-1 bg-slate-900 rounded-lg mb-1.5 group-hover:scale-105 transition-transform"
                dangerouslySetInnerHTML={{ __html: sample.svg }}
              />
              <span className="text-[10px] font-medium text-slate-700 leading-tight">
                {sample.name}
              </span>
              <span className="text-[9px] text-slate-400">{sample.category}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
