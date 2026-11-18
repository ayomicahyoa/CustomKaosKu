import React from 'react';
import { Shirt, Package } from 'lucide-react';

interface NavbarProps {
  onReset?: () => void;
  onNavigateToTracking?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onNavigateToTracking }) => {
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

        {/* Action Button */}
        <div className="flex items-center gap-2">
          {/* Cek Pesanan Pelanggan */}
          <button
            onClick={onNavigateToTracking || (() => { window.location.hash = '/cekorderan'; })}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold transition shadow-xs cursor-pointer"
            title="Lacak status pesanan kaos Anda"
          >
            <Package className="w-3.5 h-3.5 text-sky-400" />
            <span>Cek Pesanan</span>
          </button>
        </div>
      </div>
    </header>
  );
};

