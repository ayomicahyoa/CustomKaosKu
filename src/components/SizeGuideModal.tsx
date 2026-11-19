import React, { useState } from 'react';
import type { ShirtSize } from '../types';
import { Ruler, Sparkles, X, Check, Calculator, Info } from 'lucide-react';

interface SizeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSize?: (size: ShirtSize) => void;
  currentSize?: ShirtSize;
}

interface SizeSpec {
  size: ShirtSize;
  width: number; // Lebar Dada (cm)
  length: number; // Panjang Baju (cm)
  chestCircumference: number; // Lingkar Dada (cm)
  weightRange: string;
}

const SIZE_CHART: SizeSpec[] = [
  { size: 'S', width: 46, length: 68, chestCircumference: 92, weightRange: '45 - 55 kg' },
  { size: 'M', width: 48, length: 70, chestCircumference: 96, weightRange: '55 - 65 kg' },
  { size: 'L', width: 52, length: 72, chestCircumference: 104, weightRange: '65 - 75 kg' },
  { size: 'XL', width: 54, length: 74, chestCircumference: 108, weightRange: '75 - 85 kg' },
  { size: 'XXL', width: 56, length: 76, chestCircumference: 112, weightRange: '85 - 95 kg' },
  { size: '3XL', width: 60, length: 79, chestCircumference: 120, weightRange: '> 95 kg' },
];

export const SizeGuideModal: React.FC<SizeGuideModalProps> = ({
  isOpen,
  onClose,
  onSelectSize,
  currentSize,
}) => {
  const [activeTab, setActiveTab] = useState<'calculator' | 'table'>('calculator');

  // Calculator inputs
  const [height, setHeight] = useState<number>(170); // cm
  const [weight, setWeight] = useState<number>(65); // kg
  const [fitPreference, setFitPreference] = useState<'slim' | 'regular' | 'oversized'>('regular');

  if (!isOpen) return null;

  // Hitung rekomendasi ukuran
  const calculateRecommendedSize = (): { size: ShirtSize; note: string } => {
    let baseIndex = 1; // Default M

    if (weight < 53) baseIndex = 0; // S
    else if (weight <= 63) baseIndex = 1; // M
    else if (weight <= 73) baseIndex = 2; // L
    else if (weight <= 84) baseIndex = 3; // XL
    else if (weight <= 95) baseIndex = 4; // XXL
    else baseIndex = 5; // 3XL

    // Sesuaikan dengan tinggi badan jika proporsi tinggi kurus atau pendek padat
    if (height > 180 && baseIndex < 2) baseIndex = 2; // L minimal untuk tinggi > 180cm agar baju tidak gantung
    if (height > 185 && baseIndex < 3) baseIndex = 3; // XL

    // Sesuaikan dengan preferensi gaya fitting
    if (fitPreference === 'oversized') {
      baseIndex = Math.min(5, baseIndex + 1);
    } else if (fitPreference === 'slim') {
      baseIndex = Math.max(0, baseIndex - 1);
    }

    const rec = SIZE_CHART[baseIndex];
    let note = 'Pas dan proporsional untuk postur harian.';
    if (fitPreference === 'oversized') note = 'Gaya longgar streetwear kekinian (Oversized fit).';
    if (fitPreference === 'slim') note = 'Pas di badan (Slim fit / Atletis).';

    return { size: rec.size, note };
  };

  const recommendation = calculateRecommendedSize();
  const recommendedSpec = SIZE_CHART.find((s) => s.size === recommendation.size)!;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center">
              <Ruler className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Panduan & Rekomendasi Ukuran
              </h3>
              <p className="text-[11px] text-slate-500">
                Standar Pola Regular Distro Bandung (Cotton Combed)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex p-1 bg-slate-100 rounded-2xl my-3 text-xs font-bold">
          <button
            onClick={() => setActiveTab('calculator')}
            className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activeTab === 'calculator'
                ? 'bg-white text-sky-700 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>Kalkulator Pas (BB & TB)</span>
          </button>
          <button
            onClick={() => setActiveTab('table')}
            className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activeTab === 'table'
                ? 'bg-white text-sky-700 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Ruler className="w-3.5 h-3.5" />
            <span>Tabel Dimensi (Size Chart)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto flex-1 pr-1 space-y-4">
          {activeTab === 'calculator' ? (
            <div className="space-y-4">
              {/* Sliders Input */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3.5">
                {/* Tinggi Badan */}
                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                    <span>Tinggi Badan (TB):</span>
                    <span className="font-mono text-sky-700 font-bold bg-sky-50 px-2 py-0.5 rounded-lg border border-sky-200">
                      {height} cm
                    </span>
                  </div>
                  <input
                    type="range"
                    min="145"
                    max="200"
                    step="1"
                    value={height}
                    onChange={(e) => setHeight(parseInt(e.target.value, 10))}
                    className="w-full accent-sky-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                    <span>145 cm</span>
                    <span>170 cm</span>
                    <span>200 cm</span>
                  </div>
                </div>

                {/* Berat Badan */}
                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                    <span>Berat Badan (BB):</span>
                    <span className="font-mono text-sky-700 font-bold bg-sky-50 px-2 py-0.5 rounded-lg border border-sky-200">
                      {weight} kg
                    </span>
                  </div>
                  <input
                    type="range"
                    min="40"
                    max="120"
                    step="1"
                    value={weight}
                    onChange={(e) => setWeight(parseInt(e.target.value, 10))}
                    className="w-full accent-sky-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                    <span>40 kg</span>
                    <span>65 kg</span>
                    <span>120 kg</span>
                  </div>
                </div>

                {/* Fitting Preference */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Preferensi Kenyamanan Pakai:
                  </label>
                  <div className="grid grid-cols-3 gap-1.5 text-xs">
                    {(
                      [
                        { id: 'slim', label: 'Pas Badan' },
                        { id: 'regular', label: 'Standar (Nyaman)' },
                        { id: 'oversized', label: 'Oversized' },
                      ] as const
                    ).map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setFitPreference(f.id)}
                        className={`py-1.5 px-2 rounded-xl border text-center font-semibold transition cursor-pointer ${
                          fitPreference === f.id
                            ? 'border-sky-500 bg-white text-sky-700 shadow-xs ring-1 ring-sky-500'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Rekomendasi Box */}
              <div className="p-4 bg-gradient-to-br from-sky-500/10 via-indigo-500/10 to-transparent border border-sky-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs text-sky-700 font-bold">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Rekomendasi Ukuran Terbaik Anda:</span>
                  </div>
                  <div className="text-3xl font-black text-slate-900 mt-0.5">
                    Size {recommendation.size}
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Lebar: <strong>{recommendedSpec.width} cm</strong> • Panjang: <strong>{recommendedSpec.length} cm</strong>
                  </p>
                  <p className="text-[10px] text-slate-500 italic mt-0.5">
                    {recommendation.note}
                  </p>
                </div>

                {onSelectSize && (
                  <button
                    type="button"
                    onClick={() => {
                      onSelectSize(recommendation.size);
                      onClose();
                    }}
                    className="w-full sm:w-auto py-2 px-4 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer flex-shrink-0"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Pilih Size {recommendation.size}</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Table Size Chart */
            <div className="space-y-3">
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold text-[11px] uppercase">
                    <tr>
                      <th className="py-2.5 px-3">Size</th>
                      <th className="py-2.5 px-3">Lebar Dada</th>
                      <th className="py-2.5 px-3">Panjang Baju</th>
                      <th className="py-2.5 px-3">Lingkar Dada</th>
                      <th className="py-2.5 px-3">Estimasi BB</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-600">
                    {SIZE_CHART.map((s) => {
                      const isCurrent = currentSize === s.size;
                      return (
                        <tr
                          key={s.size}
                          onClick={() => onSelectSize && onSelectSize(s.size)}
                          className={`hover:bg-sky-50/50 cursor-pointer transition ${
                            isCurrent ? 'bg-sky-50 font-bold text-sky-900' : ''
                          }`}
                        >
                          <td className="py-2 px-3 font-bold text-slate-900">
                            {s.size} {isCurrent && '✓'}
                          </td>
                          <td className="py-2 px-3">{s.width} cm</td>
                          <td className="py-2 px-3">{s.length} cm</td>
                          <td className="py-2 px-3">{s.chestCircumference} cm</td>
                          <td className="py-2 px-3 text-slate-500">{s.weightRange}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl text-[11px] text-slate-500 flex items-start gap-2 border border-slate-200/80">
                <Info className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Tips Mengukur:</strong> Ukur lebar baju favorit Anda dari ujung jahitan ketiak kiri ke ketiak kanan dalam posisi dibentangkan rata. Toleransi susut jahit ±1-2 cm.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

