import React, { useRef, useState, useEffect } from 'react';
import type { CustomTShirtState, PlacedDesign, PresetPlacement, PrintZonePreset } from '../types';
import { PRINT_ZONE_PRESETS, SAMPLE_ARTWORKS } from '../data/mockData';
import { AiDesignGenerator } from './AiDesignGenerator';
import { TextDesignGenerator } from './TextDesignGenerator';
import {
  analyzeImageForPrint,
  autoAdjustImageForPrint,
  type PrintQualityReport,
} from '../services/imageOptimizer';
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
  ShieldAlert,
  Zap,
  RefreshCw,
  AlertTriangle,
  Type,
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
  const [sourceMode, setSourceMode] = useState<'upload' | 'text' | 'ai'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeDesign = state.designs[state.activeView] || null;

  // Print Quality State
  const [qualityReport, setQualityReport] = useState<PrintQualityReport | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [rejectedFile, setRejectedFile] = useState<{
    fileName: string;
    width: number;
    height: number;
    url: string;
  } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Analyze active image on view or image change
  useEffect(() => {
    let isMounted = true;
    if (activeDesign?.imageUrl) {
      analyzeImageForPrint(activeDesign.imageUrl)
        .then((report) => {
          if (isMounted) setQualityReport(report);
        })
        .catch(() => {
          if (isMounted) setQualityReport(null);
        });
    } else {
      setQualityReport(null);
    }
    return () => {
      isMounted = false;
    };
  }, [activeDesign?.imageUrl]);

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
    reader.onload = async (event) => {
      const url = event.target?.result as string;

      try {
        const report = await analyzeImageForPrint(url);
        // Validasi Standar Percetakan: Tolak otomatis jika di bawah 300px
        if (report.score === 'rejected') {
          setRejectedFile({
            fileName: file.name,
            width: report.width,
            height: report.height,
            url,
          });
          return;
        }

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
      } catch {
        // Fallback jika analisis error
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
      }
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Auto-Adjust file yang sebelumnya ditolak karena resolusi rendah
  const handleAutoAdjustRejected = async () => {
    if (!rejectedFile) return;
    setIsOptimizing(true);
    try {
      const res = await autoAdjustImageForPrint(rejectedFile.url, {
        upscale: true,
        sharpen: true,
        removeWhiteBg: true,
        boostContrast: true,
      });

      const defaultPreset = currentPresets[0];
      onUpdateDesign({
        imageUrl: res.enhancedUrl,
        originalImageUrl: rejectedFile.url,
        fileName: `${rejectedFile.fileName} (Auto-Enhanced)`,
        zonePreset: defaultPreset.id,
        x: defaultPreset.defaultX,
        y: defaultPreset.defaultY,
        scale: 1,
        rotation: 0,
        aspectRatio: 1,
        wrinkleIntensity: 0.92,
        blendMode: 'normal',
        cornerRadius: 0,
        isAutoAdjusted: true,
      });

      setRejectedFile(null);
      showToast('⚡ Resolusi berhasil ditingkatkan & dipertajam ke standar cetak sablon!');
    } catch {
      alert('Gagal meningkatkan resolusi file secara otomatis.');
    } finally {
      setIsOptimizing(false);
    }
  };

  // Auto-Adjust desain aktif
  const handleAutoAdjustActive = async () => {
    if (!activeDesign) return;
    setIsOptimizing(true);
    try {
      const targetSource = activeDesign.originalImageUrl || activeDesign.imageUrl;
      const res = await autoAdjustImageForPrint(targetSource, {
        upscale: true,
        sharpen: true,
        removeWhiteBg: true,
        boostContrast: true,
      });

      onUpdateDesign({
        ...activeDesign,
        imageUrl: res.enhancedUrl,
        originalImageUrl: targetSource,
        isAutoAdjusted: true,
      });

      showToast('⚡ Berhasil di-adjust! Resolusi ditingkatkan, garis dipertajam, dan background disesuaikan.');
    } catch {
      alert('Gagal melakukan optimasi gambar otomatis.');
    } finally {
      setIsOptimizing(false);
    }
  };

  // Kembalikan ke file asli
  const handleRestoreOriginal = () => {
    if (!activeDesign || !activeDesign.originalImageUrl) return;
    onUpdateDesign({
      ...activeDesign,
      imageUrl: activeDesign.originalImageUrl,
      isAutoAdjusted: false,
    });
    showToast('Gambar dikembalikan ke file asli.');
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
      showToast('🪄 Background berhasil dihapus menjadi transparan!');
    };
    img.src = activeDesign.imageUrl;
  };

  return (
    <div className="space-y-5">
      {/* Method Switcher Tabs: File Upload vs Text Generator vs AI Generator */}
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
          <span>Upload File</span>
        </button>

        <button
          type="button"
          onClick={() => setSourceMode('text')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            sourceMode === 'text'
              ? 'bg-white text-sky-600 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Type className="w-3.5 h-3.5 text-sky-600" />
          <span>Ketik Teks</span>
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
          <span>Desain AI</span>
        </button>
      </div>

      {/* Mode Content: File Upload vs Text Generator vs AI Generator */}
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
      ) : sourceMode === 'text' ? (
        /* Mode: Text Generator */
        <TextDesignGenerator
          onApplyDesign={handleApplyAiDesign}
          activeView={state.activeView}
        />
      ) : (
        /* Mode: AI Generator */
        <AiDesignGenerator
          onApplyDesign={handleApplyAiDesign}
          activeView={state.activeView}
        />
      )}

      {/* Active Design Badge, Print Quality Indicator & Quick Actions */}
      {activeDesign && (
        <div className="p-3.5 bg-white border border-slate-200 rounded-2xl space-y-3 shadow-xs">
          {/* File Name & Status */}
          <div className="flex items-center justify-between text-[11px] bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200/80">
            <span className="truncate max-w-[190px] text-slate-700 font-mono font-medium">
              📎 {activeDesign.fileName}
            </span>
            <span className="text-emerald-600 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Terpasang
            </span>
          </div>

          {/* Standar Percetakan (Print Readiness Report) */}
          {qualityReport && (
            <div
              className={`p-3 rounded-xl border transition-all text-xs space-y-2 ${
                qualityReport.score === 'excellent'
                  ? 'bg-emerald-50/70 border-emerald-200'
                  : qualityReport.score === 'good'
                  ? 'bg-sky-50/70 border-sky-200'
                  : 'bg-amber-50/80 border-amber-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-slate-800 text-[11px]">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      qualityReport.score === 'excellent'
                        ? 'bg-emerald-500'
                        : qualityReport.score === 'good'
                        ? 'bg-sky-500'
                        : 'bg-amber-500 animate-pulse'
                    }`}
                  />
                  <span>Standar Percetakan:</span>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${qualityReport.badgeColor}`}
                >
                  {qualityReport.score === 'excellent'
                    ? '✓ Siap Cetak HD'
                    : qualityReport.score === 'good'
                    ? '✓ Standar Sablon A4'
                    : '⚠️ Perlu Optimasi'}
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-600">
                <span>
                  Resolusi: <strong>{qualityReport.width} × {qualityReport.height} px</strong>
                </span>
                <span className="font-mono text-[10px] bg-white/80 px-1.5 py-0.5 rounded border border-slate-200/60 text-slate-500">
                  {qualityReport.megapixels} MP
                </span>
              </div>

              {qualityReport.hasSolidBackground && (
                <div className="text-[10px] text-amber-800 bg-amber-100/70 px-2 py-1 rounded-lg flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                  <span>Background kotak putih terdeteksi (bisa disesuaikan otomatis).</span>
                </div>
              )}

              {/* Action Buttons: ⚡ Auto-Adjust Standar Cetak & 🪄 Hapus Background */}
              <div className="pt-1 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleAutoAdjustActive}
                  disabled={isOptimizing}
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer disabled:opacity-50"
                  title="Tingkatkan resolusi gambar, pertajam garis detail, dan sesuaikan background otomatis"
                >
                  {isOptimizing ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Mengoptimalkan...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-3.5 h-3.5 text-amber-300" />
                      <span>⚡ Auto-Adjust Standar Cetak</span>
                    </>
                  )}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleRemoveBackground}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
                    title="Hapus background warna/putih otomatis agar gambar menyatu dengan kaos"
                  >
                    <Wand2 className="w-3.5 h-3.5" />
                    <span>Hapus Background Otomatis</span>
                  </button>

                  {(activeDesign.isAutoAdjusted || activeDesign.originalImageUrl) && (
                    <button
                      type="button"
                      onClick={handleRestoreOriginal}
                      className="flex items-center justify-center gap-1 py-2 px-3 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition cursor-pointer"
                      title="Kembalikan ke gambar asli"
                    >
                      <Undo2 className="w-3.5 h-3.5" />
                      <span>Asli</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions jika laporan kualitas sedang dimuat */}
          {!qualityReport && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRemoveBackground}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span>Hapus Background Otomatis</span>
              </button>
              {activeDesign.originalImageUrl && (
                <button
                  type="button"
                  onClick={handleRestoreOriginal}
                  className="flex items-center justify-center gap-1 py-2 px-2.5 bg-slate-150 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                  <span>Undo</span>
                </button>
              )}
            </div>
          )}
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

        {(state.activeView === 'sleeve-left' || state.activeView === 'sleeve-right') && (
          <div className="mb-2.5 p-2 bg-sky-50 border border-sky-200/80 rounded-xl flex items-center justify-between text-[11px] text-sky-900">
            <span className="font-semibold">
              Sisi Lengan: <strong className="text-sky-700">{state.sleeveType === 'long' ? 'Lengan Panjang' : 'Lengan Pendek'}</strong>
            </span>
            <span className="text-[10px] text-sky-700 bg-white px-2 py-0.5 rounded-md border border-sky-200 font-medium">
              {state.sleeveType === 'long' ? 'Full Arm & Manset Tersedia' : 'Patch & Vertikal Standar'}
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {currentPresets.map((preset) => {
            const isSelected = activeDesign?.zonePreset === preset.id;
            const isLongSleevePreset = preset.id === 'sleeve-long-full' || preset.id === 'sleeve-wrist';
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
                <div className="flex items-center justify-between gap-1 flex-wrap">
                  <span className={`font-bold ${isSelected ? 'text-sky-900' : 'text-slate-800'}`}>
                    {preset.name}
                  </span>
                  <div className="flex items-center gap-1">
                    {isLongSleevePreset && (
                      <span className="text-[9px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
                        Panjang
                      </span>
                    )}
                    <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                      {preset.dimensions}
                    </span>
                  </div>
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

      {/* Modal Penolakan Gambar (Di Bawah Standar Percetakan) */}
      {rejectedFile && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-rose-200 animate-in zoom-in-95 duration-150">
            <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3.5 shadow-xs">
              <ShieldAlert className="w-7 h-7" />
            </div>

            <h3 className="text-base font-bold text-slate-900 text-center">
              Standar Percetakan Tidak Terpenuhi
            </h3>

            <p className="text-xs text-slate-600 text-center mt-2 leading-relaxed">
              File <strong className="text-slate-800">{rejectedFile.fileName}</strong> hanya berukuran{' '}
              <strong className="text-rose-600">{rejectedFile.width} × {rejectedFile.height} px</strong>.
              Resolusi ini terlalu kecil dan akan menghasilkan sablon yang sangat pecah / buram pada kaos.
            </p>

            <div className="mt-4 p-3 bg-amber-50 rounded-2xl border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2.5">
              <Zap className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Solusi Otomatis:</strong> Sistem kami dapat meningkatkan skala resolusi, menajamkan garis sablon, dan merapikan background secara otomatis.
              </span>
            </div>

            <div className="mt-5 flex flex-col gap-2">
              <button
                type="button"
                onClick={handleAutoAdjustRejected}
                disabled={isOptimizing}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-700 hover:to-sky-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
              >
                {isOptimizing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Meningkatkan Kualitas Cetak...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5 text-amber-300" />
                    <span>⚡ Auto-Adjust ke Standar Cetak</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setRejectedFile(null);
                  setTimeout(() => fileInputRef.current?.click(), 100);
                }}
                className="w-full py-2 px-3 text-slate-600 hover:text-slate-900 text-xs font-semibold rounded-xl border border-slate-200 hover:bg-slate-50 transition cursor-pointer"
              >
                Pilih File Gambar Lain
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Success Toast */}
      {toastMessage && (
        <div className="fixed bottom-24 right-4 sm:right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-semibold animate-in slide-in-from-bottom duration-200 border border-slate-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
