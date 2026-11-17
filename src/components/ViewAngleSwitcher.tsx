import React from 'react';
import type { ViewAngle, CustomTShirtState } from '../types';
import { Shirt } from 'lucide-react';

interface ViewAngleSwitcherProps {
  activeView: ViewAngle;
  onSelectView: (view: ViewAngle) => void;
  designs: CustomTShirtState['designs'];
}

export const ViewAngleSwitcher: React.FC<ViewAngleSwitcherProps> = ({
  activeView,
  onSelectView,
  designs,
}) => {
  const views: { id: ViewAngle; label: string; sub: string }[] = [
    { id: 'front', label: 'Depan', sub: 'Front View' },
    { id: 'back', label: 'Belakang', sub: 'Back View' },
    { id: 'sleeve-left', label: 'Lengan Kiri', sub: 'Left Arm' },
    { id: 'sleeve-right', label: 'Lengan Kanan', sub: 'Right Arm' },
  ];

  return (
    <div className="flex items-center gap-1.5 sm:gap-2 bg-white/90 backdrop-blur-md p-1 sm:p-1.5 rounded-2xl shadow-sm border border-slate-200 overflow-x-auto w-full max-w-full scrollbar-hide">
      {views.map((v) => {
        const isActive = activeView === v.id;
        const hasDesign = !!designs[v.id];

        return (
          <button
            key={v.id}
            onClick={() => onSelectView(v.id)}
            className={`relative flex items-center gap-1 sm:gap-2 px-2 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-semibold transition-all whitespace-nowrap flex-shrink-0 ${
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
    </div>
  );
};
