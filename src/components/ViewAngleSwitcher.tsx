import React, { useState } from 'react';
import type { ViewAngle, CustomTShirtState } from '../types';
import { Shirt, Ruler, X } from 'lucide-react';

interface ViewAngleSwitcherProps {
  activeView: ViewAngle;
  onSelectView: (view: ViewAngle) => void;
  designs: CustomTShirtState['designs'];
  sleeveType?: 'short' | 'long';
}

export const ViewAngleSwitcher: React.FC<ViewAngleSwitcherProps> = ({
  activeView,
  onSelectView,
  designs,
  sleeveType = 'short',
}) => {
  const [showSizeChart, setShowSizeChart] = useState(false);

  const views: { id: ViewAngle; label: string; sub: string }[] = [
    { id: 'front', label: 'Depan', sub: 'Front View' },
    { id: 'back', label: 'Belakang', sub: 'Back View' },
    {
      id: 'sleeve-left',
      label: 'Lengan Kiri',
      sub: sleeveType === 'long' ? 'Left Arm (Panjang)' : 'Left Arm (Pendek)',
    },
    {
      id: 'sleeve-right',
      label: 'Lengan Kanan',
      sub: sleeveType === 'long' ? 'Right Arm (Panjang)' : 'Right Arm (Pendek)',
    },
  ];

  return (
    <>
      <div className="flex items-center gap-1.5 sm:gap-2 bg-white/90 backdrop-blur-md p-1 sm:p-1.5 rounded-2xl shadow-sm border border-slate-200 overflow-x-auto w-full max-w-full scrollbar-hide">
        {views.map((v) => {
          const isActive = activeView === v.id;
          const hasDesign = !!designs[v.id];

          return (
            <button
              key={v.id}
              onClick={() => onSelectView(v.id)}
              className={`relative flex items-center gap-1 sm:gap-2 px-2 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-semibold transition-all whitespace-nowrap flex-shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Shirt className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${isActive ? 'text-sky-400' : 'text-slate-400'}`} />
              <div className="flex flex-col items-start leading-tight">
                <span>{v.label}</span>
                <span className={`text-[9px] sm:text-[10px] font-normal hidden sm:block ${isActive ? 'text-slate-300' : 'text-slate-400'}`}>
                  {v.sub}
                </span>
              </div>

              {/* Design indicator dot */}
              {hasDesign && (
                <span
                  className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500 shadow-xs"
                  title="Ada desain pada sisi ini"
                />
              )}
            </button>
          );
        })}

        {/* Divider */}
        <div className="h-6 w-px bg-slate-200 mx-0.5 sm:mx-1 flex-shrink-0" />

        {/* Size Chart / Specification Info Button */}
        <button
          type="button"
          onClick={() => setShowSizeChart(true)}
          className="relative flex items-center gap-1 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-semibold text-slate-700 hover:text-sky-700 bg-slate-50 hover:bg-sky-50 border border-slate-200 hover:border-sky-300 transition-all whitespace-nowrap flex-shrink-0 cursor-pointer shadow-2xs"
          title="Lihat Panduan Ukuran & Spesifikasi Kaos (Size Chart)"
        >
          <Ruler className="w-3.5 h-3.5 text-sky-600 flex-shrink-0" />
          <div className="flex flex-col items-start leading-tight">
            <span>Size Chart</span>
            <span className="text-[9px] sm:text-[10px] font-normal text-slate-400 hidden sm:block">
              Panduan Ukuran
            </span>
          </div>
        </button>
      </div>

      {/* Size Chart & Specification Modal */}
      {showSizeChart && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-200"
          onClick={() => setShowSizeChart(false)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-4 sm:p-5 border border-slate-150 max-h-[92vh] flex flex-col animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center shadow-2xs">
                  <Ruler className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">
                    Panduan Ukuran (Size Chart)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Spesifikasi standar ukuran kaos Custom Apparel Bandung.id
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSizeChart(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Image Body */}
            <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center bg-slate-50 rounded-2xl p-2 sm:p-3 border border-slate-150">
              <img
                src={`${import.meta.env.BASE_URL}size-chart.png`}
                alt="Size Chart Panduan Ukuran Kaos"
                className="w-full max-h-[58vh] sm:max-h-[62vh] object-contain rounded-xl shadow-2xs"
              />
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-slate-100 mt-3 flex items-center justify-between gap-2 text-[11px] text-slate-500">
              <span className="italic">* Toleransi ukuran 2-3 cm karena proses jahit konveksi.</span>
              <button
                type="button"
                onClick={() => setShowSizeChart(false)}
                className="py-1.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition cursor-pointer whitespace-nowrap shadow-xs"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
