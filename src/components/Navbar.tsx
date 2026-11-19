import React, { useState, useEffect } from 'react';
import { Package, ShoppingBag, User } from 'lucide-react';
import { loadCart } from '../services/cartStorage';
import type { AppUser } from '../types';

interface NavbarProps {
  onReset?: () => void;
  onNavigateToTracking?: () => void;
  onOpenCart?: () => void;
  cartCount?: number;
  user?: AppUser | null;
  onOpenAuth?: () => void;
  onOpenUserHistory?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onNavigateToTracking,
  onOpenCart,
  cartCount,
  user,
  onOpenAuth,
  onOpenUserHistory,
}) => {
  const [itemsCount, setItemsCount] = useState(() => loadCart().length);

  useEffect(() => {
    const updateCount = () => {
      setItemsCount(loadCart().length);
    };
    window.addEventListener('cart-updated', updateCount);
    return () => window.removeEventListener('cart-updated', updateCount);
  }, []);

  const totalDisplay = cartCount !== undefined ? cartCount : itemsCount;
  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <img
            src="/logo.jpg"
            alt="Custom Apparel Bandung.id"
            className="h-10 sm:h-11 w-auto object-contain rounded-xl bg-white p-0.5 border border-slate-200/80 shadow-2xs"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-slate-900 tracking-tight text-base sm:text-lg">
                Custom Apparel <span className="text-sky-600 font-extrabold">Bandung.id</span>
              </span>
              <span className="hidden sm:inline-flex text-[10px] font-bold text-sky-700 bg-sky-100 px-2 py-0.5 rounded-full">
                OFFICIAL STUDIO
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block">
              Interactive 3D-Look T-Shirt Mockup & Custom Apparel Generator
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-2">
          {/* User Account / Login Button */}
          {user ? (
            <button
              onClick={onOpenUserHistory}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-sky-200 bg-sky-50 hover:bg-sky-100 text-sky-900 text-xs font-bold transition shadow-2xs cursor-pointer"
              title="Akun Anda (Riwayat Pesanan & Desain)"
            >
              <div className="w-5 h-5 rounded-full bg-sky-600 text-white text-[10px] flex items-center justify-center font-bold">
                {(user.fullName || user.email).charAt(0).toUpperCase()}
              </div>
              <span className="hidden sm:inline max-w-[120px] truncate">
                {user.fullName || user.email.split('@')[0]}
              </span>
            </button>
          ) : (
            onOpenAuth && (
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition shadow-2xs cursor-pointer"
                title="Masuk atau Daftar Akun"
              >
                <User className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline">Masuk</span>
              </button>
            )
          )}

          {/* Keranjang Belanja */}
          {onOpenCart && (
            <button
              onClick={onOpenCart}
              className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold transition shadow-2xs cursor-pointer"
              title="Lihat Keranjang Belanja"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-sky-600" />
              <span className="hidden sm:inline">Keranjang</span>
              {totalDisplay > 0 && (
                <span className="w-5 h-5 rounded-full bg-sky-600 text-white text-[10px] font-black flex items-center justify-center animate-in zoom-in-75">
                  {totalDisplay}
                </span>
              )}
            </button>
          )}

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


