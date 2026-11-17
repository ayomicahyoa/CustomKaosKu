import React from 'react';
import type {
  CustomTShirtState,
  NeckType,
  SleeveType,
  MaterialOption,
  ShirtColor,
  PrintTechnique,
} from '../types';
import { SHIRT_COLORS, MATERIALS, PRINT_TECHNIQUES } from '../data/mockData';
import { Shirt, Palette, Layers, Printer, Check } from 'lucide-react';

interface ConfiguratorSidebarProps {
  state: CustomTShirtState;
  onChangeNeck: (neck: NeckType) => void;
  onChangeSleeve: (sleeve: SleeveType) => void;
  onChangeColor: (color: ShirtColor) => void;
  onChangeMaterial: (mat: MaterialOption) => void;
  onChangeTechnique: (tech: PrintTechnique) => void;
  onChangeSize: (size: CustomTShirtState['size']) => void;
}

export const ConfiguratorSidebar: React.FC<ConfiguratorSidebarProps> = ({
  state,
  onChangeNeck,
  onChangeSleeve,
  onChangeColor,
  onChangeMaterial,
  onChangeTechnique,
  onChangeSize,
}) => {
  const sizes: CustomTShirtState['size'][] = ['S', 'M', 'L', 'XL', 'XXL', '3XL'];

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

        {/* Ukuran (Sizes) */}
        <div>
          <label className="text-xs font-semibold text-slate-600 block mb-1.5">
            Pilihan Size Kaos
          </label>
          <div className="grid grid-cols-6 gap-1.5">
            {sizes.map((s) => (
              <button
                key={s}
                onClick={() => onChangeSize(s)}
                className={`py-1.5 rounded-lg border text-xs font-bold transition ${
                  state.size === s
                    ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-400'
                }`}
              >
                {s}
              </button>
            ))}
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
          {SHIRT_COLORS.map((c) => {
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
          {MATERIALS.map((mat) => {
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
          {PRINT_TECHNIQUES.map((tech) => {
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
    </div>
  );
};
