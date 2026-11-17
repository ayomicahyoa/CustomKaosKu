import React from 'react';
import { Shirt, Sparkles, RefreshCcw, Layers } from 'lucide-react';

interface NavbarProps {
  onReset: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onReset }) => {
  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
            <Shirt className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-slate-900 tracking-tight text-base sm:text-lg">
                CustomKaos<span className="text-sky-600 font-extrabold">Web</span>
              </span>
              <span className="hidden sm:inline-flex text-[10px] font-bold text-sky-700 bg-sky-100 px-2 py-0.5 rounded-full">
                PROTOTYPE STUDIO
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block">
              Interactive 3D-Look T-Shirt Mockup & Custom Apparel Generator
            </p>
          </div>
        </div>

        {/* Badges / Tech Highlights */}
        <div className="hidden md:flex items-center gap-2 text-xs">
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            DTF, Polyflex & Sablon Manual
          </span>
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-medium">
            <Layers className="w-3.5 h-3.5 text-sky-500" />
            Multi-Angle View
          </span>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-xs font-semibold transition"
            title="Reset ke pengaturan awal"
          >
            <RefreshCcw className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Reset Desain</span>
          </button>
        </div>
      </div>
    </header>
  );
};

