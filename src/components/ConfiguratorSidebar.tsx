import React, { useState } from 'react';
import type {
  CustomTShirtState,
  NeckType,
  SleeveType,
  MaterialOption,
  ShirtColor,
  PrintTechnique,
  ShirtSize,
} from '../types';
import { SHIRT_COLORS, MATERIALS, PRINT_TECHNIQUES } from '../data/mockData';
import { Shirt, Palette, Layers, Printer, Check, Minus, Plus, Ruler } from 'lucide-react';
import { SizeGuideModal } from './SizeGuideModal';

interface ConfiguratorSidebarProps {
  state: CustomTShirtState;
  materials?: MaterialOption[];
  techniques?: PrintTechnique[];
  colors?: ShirtColor[];
  onChangeNeck: (neck: NeckType) => void;
  onChangeSleeve: (sleeve: SleeveType) => void;
  onChangeColor: (color: ShirtColor) => void;
  onChangeMaterial: (mat: MaterialOption) => void;
  onChangeTechnique: (tech: PrintTechnique) => void;
  onChangeSize: (size: ShirtSize) => void;
  onChangeSizeBreakdown: (breakdown: Record<ShirtSize, number>) => void;
}

export const ConfiguratorSidebar: React.FC<ConfiguratorSidebarProps> = ({
  state,
  materials = MATERIALS,
  techniques = PRINT_TECHNIQUES,
  colors = SHIRT_COLORS,
  onChangeNeck,
  onChangeSleeve,
  onChangeColor,
  onChangeMaterial,
  onChangeTechnique,
  onChangeSize,
  onChangeSizeBreakdown,
}) => {
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const sizes: ShirtSize[] = ['S', 'M', 'L', 'XL', 'XXL', '3XL'];

  const currentBreakdown: Record<ShirtSize, number> = {
    S: state.sizeBreakdown?.S ?? 0,
    M: state.sizeBreakdown?.M ?? 0,
    L: state.sizeBreakdown?.L ?? (state.quantity || 12),
    XL: state.sizeBreakdown?.XL ?? 0,
    XXL: state.sizeBreakdown?.XXL ?? 0,
    '3XL': state.sizeBreakdown?.['3XL'] ?? 0,
  };

  const handleUpdateSizeQty = (size: ShirtSize, newQty: number) => {
    const safeQty = Math.max(0, newQty);
    const updated = { ...currentBreakdown, [size]: safeQty };
    // Ensure at least 1 pcs total
    const total = Object.values(updated).reduce((acc, v) => acc + v, 0);
    if (total === 0) {
      updated[size] = 1;
    }
    onChangeSize(size);
    onChangeSizeBreakdown(updated);
  };

  const handleSelectSingleSizeAll = (size: ShirtSize) => {
    const total = Math.max(1, state.quantity);
    const updated: Record<ShirtSize, number> = {
      S: 0,
      M: 0,
      L: 0,
      XL: 0,
      XXL: 0,
      '3XL': 0,
      [size]: total,
    };
    onChangeSize(size);
    onChangeSizeBreakdown(updated);
  };

  const handleDistributeEvenly = () => {
    const commonSizes: ShirtSize[] = ['S', 'M', 'L', 'XL'];
    const total = Math.max(4, state.quantity);
    const base = Math.floor(total / commonSizes.length);
    const rem = total % commonSizes.length;

    const updated: Record<ShirtSize, number> = {
      S: base + (rem > 0 ? 1 : 0),
      M: base + (rem > 1 ? 1 : 0),
      L: base + (rem > 2 ? 1 : 0),
      XL: base,
      XXL: 0,
      '3XL': 0,
    };
    onChangeSizeBreakdown(updated);
  };

  return (
    <div className="space-y-6">
      {/* 1. Model & Kerah / Lengan */}
      <div>
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5">
          <Shirt className="w-3.5 h-3.5 text-sky-600" />
          <span>1. Model & Bentuk Kaos</span>
        </div>

        {/* Kerah (Neck) */}
        <div className="mb-3">
          <label className="text-xs font-semibold text-slate-600 block mb-1.5">
            Bentuk Kerah (Neckline)
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onChangeNeck('round')}
              className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                state.neckType === 'round'
                  ? 'border-sky-500 bg-sky-50 text-sky-900 shadow-xs'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
              }`}
            >
              <span>Round Neck (O-Neck)</span>
              {state.neckType === 'round' && <Check className="w-3.5 h-3.5 text-sky-600" />}
            </button>
            <button
              onClick={() => onChangeNeck('v-neck')}
              className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                state.neckType === 'v-neck'
                  ? 'border-sky-500 bg-sky-50 text-sky-900 shadow-xs'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
              }`}
            >
              <span>V-Neck</span>
              {state.neckType === 'v-neck' && <Check className="w-3.5 h-3.5 text-sky-600" />}
            </button>
          </div>
        </div>

        {/* Lengan (Sleeve) */}
        <div className="mb-3">
          <label className="text-xs font-semibold text-slate-600 block mb-1.5">
            Panjang Lengan
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onChangeSleeve('short')}
              className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                state.sleeveType === 'short'
                  ? 'border-sky-500 bg-sky-50 text-sky-900 shadow-xs'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
              }`}
            >
              <span>Lengan Pendek</span>
              {state.sleeveType === 'short' && <Check className="w-3.5 h-3.5 text-sky-600" />}
            </button>
            <button
              onClick={() => onChangeSleeve('long')}
              className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                state.sleeveType === 'long'
                  ? 'border-sky-500 bg-sky-50 text-sky-900 shadow-xs'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
              }`}
            >
              <span>Lengan Panjang (+10k)</span>
              {state.sleeveType === 'long' && <Check className="w-3.5 h-3.5 text-sky-600" />}
            </button>
          </div>
        </div>

        {/* Ukuran (Sizes Matrix & Breakdown) */}
        <div className="pt-1">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-slate-700">
              Distribusi Ukuran Kaos ({state.quantity} pcs)
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsSizeGuideOpen(true)}
                className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 hover:underline"
                title="Buka panduan ukuran & kalkulator BB/TB"
              >
                <Ruler className="w-3 h-3" />
                <span>Panduan Ukuran</span>
              </button>
              <span className="text-slate-300">•</span>
              <button
                type="button"
                onClick={handleDistributeEvenly}
                className="text-[10px] text-sky-600 hover:text-sky-700 font-bold hover:underline"
              >
                Bagi Rata (S-XL)
              </button>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 mb-2.5">
            Tentukan jumlah pcs untuk masing-masing ukuran kaos yang dipesan:
          </p>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {sizes.map((s) => {
              const qty = currentBreakdown[s] || 0;
              const hasQty = qty > 0;
              return (
                <div
                  key={s}
                  className={`p-2 rounded-xl border flex flex-col items-center justify-between transition ${
                    hasQty
                      ? 'border-sky-500 bg-sky-50/50 shadow-2xs'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  {/* Size Title (Click to make all quantity this size) */}
                  <button
                    type="button"
                    onClick={() => handleSelectSingleSizeAll(s)}
                    className="text-xs font-black text-slate-800 hover:text-sky-600 w-full text-center pb-1"
                    title={`Klik untuk ubah semua (${state.quantity} pcs) ke ukuran ${s}`}
                  >
                    {s}
                  </button>

                  {/* Quantity Counter */}
                  <div className="flex items-center gap-1 w-full justify-center">
                    <button
                      type="button"
                      onClick={() => handleUpdateSizeQty(s, qty - 1)}
                      className="w-5 h-5 rounded-md bg-white border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-600 transition"
                    >
                      <Minus className="w-2.5 h-2.5" />
                    </button>
                    <input
                      type="number"
                      min="0"
                      value={qty}
                      onChange={(e) => handleUpdateSizeQty(s, parseInt(e.target.value) || 0)}
                      className="w-7 text-center font-bold text-xs font-mono bg-transparent border-none focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleUpdateSizeQty(s, qty + 1)}
                      className="w-5 h-5 rounded-md bg-white border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-600 transition"
                    >
                      <Plus className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Breakdown summary pill */}
          <div className="mt-2.5 p-2 bg-slate-50 rounded-xl border border-slate-200/80 text-[11px] text-slate-600 flex items-center justify-between flex-wrap gap-1">
            <span className="font-semibold text-slate-700">Rincian:</span>
            <span className="font-mono text-slate-800 font-bold">
              {Object.entries(currentBreakdown)
                .filter(([, q]) => q > 0)
                .map(([s, q]) => `${s}: ${q} pcs`)
                .join(', ') || 'Belum ada ukuran'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Warna Kaos (Color Swatches) */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wider">
            <Palette className="w-3.5 h-3.5 text-sky-600" />
            <span>2. Warna Kaos</span>
          </div>
          <span className="text-xs font-semibold text-slate-700 font-mono">
            {state.color.name}
          </span>
        </div>

        <div className="grid grid-cols-6 gap-2">
          {colors.map((c) => {
            const isSelected = state.color.id === c.id;
            return (
              <button
                key={c.id}
                onClick={() => onChangeColor(c)}
                title={c.name}
                className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all transform hover:scale-110 relative ${
                  isSelected
                    ? 'ring-2 ring-sky-500 ring-offset-2 scale-105 border-transparent shadow-sm'
                    : 'border-slate-300 hover:border-slate-400'
                }`}
                style={{ backgroundColor: c.hex }}
              >
                {isSelected && (
                  <Check
                    className={`w-4 h-4 ${c.isDark ? 'text-white' : 'text-slate-900'}`}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Bahan Kaos (Fabric / Material) */}
      <div>
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5">
          <Layers className="w-3.5 h-3.5 text-sky-600" />
          <span>3. Pilihan Bahan Kain</span>
        </div>

        <div className="space-y-2">
          {materials.map((mat) => {
            const isSelected = state.material.id === mat.id;
            return (
              <button
                key={mat.id}
                onClick={() => onChangeMaterial(mat)}
                className={`w-full text-left p-3 rounded-xl border text-xs transition-all relative ${
                  isSelected
                    ? 'border-sky-500 bg-sky-50/60 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{mat.name}</span>
                    {mat.badge && (
                      <span className="text-[9px] font-semibold text-sky-700 bg-sky-100 px-1.5 py-0.5 rounded-full">
                        {mat.badge}
                      </span>
                    )}
                  </div>
                  <span className="font-mono font-bold text-slate-800">
                    Rp {mat.basePrice.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                  Ketebalan: {mat.gsm}
                </div>
                <p className="text-[11px] text-slate-600 mt-1 leading-snug">
                  {mat.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Teknik Sablon / Cetak */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wider">
            <Printer className="w-3.5 h-3.5 text-sky-600" />
            <span>4. Teknik Sablon & Cetak</span>
          </div>
          <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            {state.technique.badge}
          </span>
        </div>

        <div className="space-y-2">
          {techniques.map((tech) => {
            const isSelected = state.technique.id === tech.id;
            return (
              <button
                key={tech.id}
                onClick={() => onChangeTechnique(tech)}
                className={`w-full text-left p-3 rounded-xl border text-xs transition-all ${
                  isSelected
                    ? 'border-sky-500 bg-sky-50/60 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{tech.name}</span>
                  <span className="text-[10px] text-slate-500 font-mono bg-slate-100 px-1.5 py-0.5 rounded">
                    Min. {tech.minQty} pcs
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 mt-1 leading-snug">
                  {tech.description}
                </p>
                <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-100 pt-1.5">
                  <span>Cocok untuk: <strong className="text-slate-700">{tech.bestFor}</strong></span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Size Guide & BB/TB Calculator Modal */}
      <SizeGuideModal
        isOpen={isSizeGuideOpen}
        onClose={() => setIsSizeGuideOpen(false)}
        currentSize={state.size}
        onSelectSize={(selectedSize) => {
          onChangeSize(selectedSize);
          handleUpdateSizeQty(selectedSize, (currentBreakdown[selectedSize] || 0) + 1);
        }}
      />
    </div>
  );
};
