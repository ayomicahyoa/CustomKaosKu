import React from 'react';
import type { CustomTShirtState, PlacedDesign, PrintZonePreset } from '../types';
import { PRINT_ZONE_PRESETS } from '../data/mockData';
import { Trash2, Eye, EyeOff, Sparkles } from 'lucide-react';

interface TShirtCanvasProps {
  state: CustomTShirtState;
  printZones?: PrintZonePreset[];
  onUpdateDesign: (design: PlacedDesign | null) => void;
  showGuides: boolean;
  setShowGuides: (val: boolean) => void;
}

export const TShirtCanvas: React.FC<TShirtCanvasProps> = ({
  state,
  printZones = PRINT_ZONE_PRESETS,
  onUpdateDesign,
  showGuides,
  setShowGuides,
}) => {
  const activeDesign = state.designs[state.activeView] || null;

  // Active presets for the current view (mirrored for right sleeve)
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

  const activePreset = activeDesign
    ? currentPresets.find((p) => p.id === activeDesign.zonePreset) || currentPresets[0]
    : currentPresets[0];

  const shirtColor = state.color.hex;
  const isDark = state.color.isDark;

  // Real Photo Asset Path selection
  const baseUrl = import.meta.env.BASE_URL;
  const getRealPhotoPath = () => {
    // 0. Basic Hoodie Pullover
    if (state.productType === 'hoodie-basic') {
      if (state.activeView === 'front') return `${baseUrl}mockups/hoodie-front.png`;
      if (state.activeView === 'back') return `${baseUrl}mockups/hoodie-back.png`;
      if (state.activeView === 'sleeve-left') return `${baseUrl}mockups/hoodie-left.png`;
      return `${baseUrl}mockups/hoodie-right.png`;
    }

    // 1. T-Shirt Boxy Oversized
    if (state.productType === 'tshirt-boxy') {
      if (state.activeView === 'front') return `${baseUrl}mockups/tshirt-boxy-front.png`;
      if (state.activeView === 'back') return `${baseUrl}mockups/tshirt-boxy-back.png`;
      if (state.activeView === 'sleeve-left') return `${baseUrl}mockups/tshirt-boxy-left.png`;
      return `${baseUrl}mockups/tshirt-boxy-right.png`;
    }

    // 2. Long Sleeve Models
    if (state.sleeveType === 'long') {
      if (state.activeView === 'front') {
        return state.neckType === 'v-neck'
          ? `${baseUrl}mockups/tshirt-vneck-longsleeve-front.png`
          : `${baseUrl}mockups/tshirt-longsleeve-front.png`;
      }
      if (state.activeView === 'back') return `${baseUrl}mockups/tshirt-longsleeve-back.png`;
      if (state.activeView === 'sleeve-left') return `${baseUrl}mockups/tshirt-longsleeve-left.png`;
      return `${baseUrl}mockups/tshirt-longsleeve-right.png`;
    }

    // 3. Short Sleeve Standard (Round & V-Neck)
    if (state.activeView === 'front') {
      return state.neckType === 'v-neck'
        ? `${baseUrl}mockups/tshirt-vneck-front.png`
        : `${baseUrl}mockups/tshirt-front-round-real.png`;
    }
    if (state.activeView === 'back') {
      return `${baseUrl}mockups/tshirt-back-real.png`;
    }
    if (state.activeView === 'sleeve-left') {
      return `${baseUrl}mockups/tshirt-sleeve-left-real.png`;
    }
    return `${baseUrl}mockups/tshirt-sleeve-right-real.png`;
  };

  const activePhotoUrl = getRealPhotoPath();

  // Calculated wrinkle shading opacity
  const wrinkleOpacity =
    activeDesign?.wrinkleIntensity !== undefined
      ? activeDesign.wrinkleIntensity
      : isDark
      ? 0.95
      : 0.90;

  return (
    <div className="relative flex flex-col items-center justify-center w-full h-full min-h-[350px] sm:min-h-[500px] select-none p-2 sm:p-4">
      {/* Mockup Canvas Container */}
      <div
        id="tshirt-mockup-export-area"
        className="relative w-full max-w-[560px] aspect-[4/5] bg-white rounded-3xl shadow-xl border border-slate-200/80 flex items-center justify-center overflow-hidden transition-all duration-300"
        style={{
          background: 'radial-gradient(circle at 50% 40%, #ffffff 0%, #f1f5f9 100%)',
        }}
      >
        {/* Ambient Studio Lighting Effect */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-50/40 via-transparent to-slate-900/5" />

        {/* REAL PHOTO MOCKUP (Photo Layering & Blending) */}
        <div className="relative w-[92%] h-[92%] flex items-center justify-center">
          {/* LAYER 1: Solid Color Base Mask */}
          <div
            className="absolute inset-0 w-full h-full transition-colors duration-300 pointer-events-none"
            style={{
              backgroundColor: shirtColor,
              maskImage: `url(${activePhotoUrl})`,
              WebkitMaskImage: `url(${activePhotoUrl})`,
              maskSize: 'contain',
              WebkitMaskSize: 'contain',
              maskRepeat: 'no-repeat',
              WebkitMaskRepeat: 'no-repeat',
              maskPosition: 'center',
              WebkitMaskPosition: 'center',
            }}
          />

          {/* LAYER 2: Auto-Adjusted Artwork Graphic (Clipped strictly within activePreset) */}
          {activeDesign && activePreset && (
            <div
              className="absolute z-10 transition-all duration-200 pointer-events-none overflow-hidden"
              style={{
                left: `${activePreset.defaultX}%`,
                top: `${activePreset.defaultY}%`,
                width: `${activePreset.defaultWidth}%`,
                height: `${activePreset.defaultHeight}%`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <div className="w-full h-full relative flex items-center justify-center">
                <img
                  src={activeDesign.imageUrl}
                  alt="Custom Graphic"
                  className="w-full h-full object-contain pointer-events-none transition-transform duration-100"
                  style={{
                    transform: `scale(${activeDesign.scale || 1}) translate(${activeDesign.offsetX || 0}%, ${activeDesign.offsetY || 0}%) rotate(${activeDesign.rotation || 0}deg)`,
                    borderRadius: `${activeDesign.cornerRadius || 0}px`,
                    mixBlendMode: activeDesign.blendMode === 'multiply' ? 'multiply' : 'normal',
                    filter: 'contrast(1.02) brightness(0.98)',
                  }}
                  draggable={false}
                />
              </div>
            </div>
          )}

          {/* LAYER 3: Real Photographic Cotton Shading & Wrinkles (OVER the artwork) */}
          <img
            src={activePhotoUrl}
            alt="Real T-Shirt Shading"
            className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none z-20 transition-opacity duration-300 filter drop-shadow-md"
            style={{
              mixBlendMode: 'multiply',
              opacity: wrinkleOpacity,
            }}
          />

          {/* LAYER 4: Real Photographic Highlights (OVER the artwork for natural sheen) */}
          <img
            src={activePhotoUrl}
            alt="Real T-Shirt Highlight"
            className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none z-20"
            style={{
              mixBlendMode: 'screen',
              opacity: isDark ? 0.32 : 0.14,
            }}
          />
        </div>

        {/* --- PRINTABLE BOUNDING BOX GUIDE (Dashed Area) --- */}
        {showGuides && activePreset && (
          <div
            className="absolute border-2 border-dashed border-sky-500/80 rounded-lg pointer-events-none transition-all duration-300 z-30 flex flex-col justify-between p-1.5"
            style={{
              left: `${activePreset.defaultX}%`,
              top: `${activePreset.defaultY}%`,
              width: `${activePreset.defaultWidth}%`,
              height: `${activePreset.defaultHeight}%`,
              transform: 'translate(-50%, -50%)',
              backgroundColor: 'rgba(14, 165, 233, 0.05)',
            }}
          >
            <div className="flex items-center justify-between pointer-events-none">
              <span className="text-[10px] font-bold text-sky-700 bg-sky-100/95 px-1.5 py-0.5 rounded shadow-xs">
                {activePreset.name}
              </span>
              <span className="text-[9px] font-semibold text-slate-600 bg-white/90 px-1 rounded shadow-2xs">
                {activePreset.dimensions}
              </span>
            </div>
            <span className="text-[9px] text-center text-sky-600 font-mono font-medium pointer-events-none">
              Posisi Otomatis Terkalibrasi
            </span>
          </div>
        )}

        {/* Empty state prompt on canvas */}
        {!activeDesign && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-slate-400 px-6 text-center z-10">
            <div className="w-16 h-16 rounded-full bg-slate-150/80 flex items-center justify-center mb-2 shadow-inner">
              <Sparkles className="w-7 h-7 text-slate-400 opacity-60" />
            </div>
            <p className="text-xs font-semibold text-slate-700">
              Belum ada desain di {state.activeView === 'front' ? 'bagian depan' : state.activeView === 'back' ? 'bagian belakang' : 'bagian lengan'}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Pilih ukuran cetak di panel kanan untuk auto-adjust penempatan desain
            </p>
          </div>
        )}
      </div>

      {/* Toolbar Under Canvas */}
      <div className="mt-3 sm:mt-4 flex items-center justify-between w-full max-w-[560px] bg-white px-3 sm:px-4 py-2 rounded-2xl shadow-sm border border-slate-200 text-xs">
        {/* Toggle Guides */}
        <button
          onClick={() => setShowGuides(!showGuides)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all font-semibold text-[11px] ${
            showGuides
              ? 'bg-sky-50 text-sky-700 border border-sky-200'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
          title="Tampilkan/sembunyikan garis batas area cetak"
        >
          {showGuides ? <Eye className="w-3.5 h-3.5 text-sky-600" /> : <EyeOff className="w-3.5 h-3.5" />}
          <span>{showGuides ? 'Sembunyikan Panduan' : 'Tampilkan Panduan Area'}</span>
        </button>

        {/* Delete current view design */}
        {activeDesign ? (
          <button
            onClick={() => onUpdateDesign(null)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition font-semibold text-[11px]"
            title="Hapus desain dari sisi ini"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Hapus Desain</span>
          </button>
        ) : (
          <span className="text-[10px] text-slate-400 italic">Preview Real-Time</span>
        )}
      </div>
    </div>
  );
};
