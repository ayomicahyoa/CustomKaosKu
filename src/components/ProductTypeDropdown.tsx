import React, { useState, useRef, useEffect } from 'react';
import type { ProductTypeOption } from '../types';
import { Shirt, ChevronDown, Check, Sparkles } from 'lucide-react';

interface ProductTypeDropdownProps {
  productTypes: ProductTypeOption[];
  activeProductTypeId: string;
  onSelectProductType: (id: string) => void;
}

export const ProductTypeDropdown: React.FC<ProductTypeDropdownProps> = ({
  productTypes,
  activeProductTypeId,
  onSelectProductType,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeProduct =
    productTypes.find((p) => p.id === activeProductTypeId) || productTypes[0];

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative w-full max-w-full" ref={dropdownRef}>
      <label className="text-xs font-semibold text-slate-700 block mb-1.5 px-0.5">
        Pilih Product:
      </label>
      {/* Dropdown Trigger Bar */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-2 bg-white/95 hover:bg-white backdrop-blur-md px-3.5 py-2.5 rounded-2xl shadow-sm border border-slate-200 transition cursor-pointer text-left group"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 flex-shrink-0 group-hover:bg-sky-100 transition">
            <Shirt className="w-4 h-4" />
          </div>
          <div className="min-w-0 text-left">
            <div className="text-xs sm:text-sm font-bold text-slate-900 truncate flex items-center gap-1.5">
              <span>{activeProduct.name}</span>
              {activeProduct.badge && (
                <span className="text-[9px] font-semibold bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded-full">
                  {activeProduct.badge}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="w-7 h-7 rounded-lg bg-slate-100 group-hover:bg-slate-200 text-slate-600 flex items-center justify-center transition flex-shrink-0">
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {/* Dropdown Menu List */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 z-40 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 space-y-1 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Pilih Pola & Potongan Kaos</span>
            <span>{productTypes.length} Pilihan</span>
          </div>

          {productTypes.map((pt) => {
            const isSelected = pt.id === activeProduct.id;
            return (
              <button
                key={pt.id}
                type="button"
                onClick={() => {
                  onSelectProductType(pt.id);
                  setIsOpen(false);
                }}
                className={`w-full text-left p-2.5 rounded-xl transition flex items-center justify-between gap-3 cursor-pointer ${
                  isSelected
                    ? 'bg-sky-50/80 border border-sky-300 text-sky-950 shadow-2xs'
                    : 'hover:bg-slate-50 border border-transparent text-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      isSelected
                        ? 'bg-sky-600 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <Shirt className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold flex items-center gap-1.5">
                      <span className="truncate">{pt.name}</span>
                      {pt.badge && (
                        <span className="text-[9px] font-medium bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded-full">
                          {pt.badge}
                        </span>
                      )}
                    </div>
                    {pt.description && (
                      <div className="text-[11px] text-slate-500 line-clamp-1">
                        {pt.description}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {pt.baseExtraPrice && pt.baseExtraPrice > 0 ? (
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                      +Rp {pt.baseExtraPrice.toLocaleString('id-ID')}
                    </span>
                  ) : null}
                  {isSelected && (
                    <span className="w-5 h-5 rounded-full bg-sky-600 text-white flex items-center justify-center">
                      <Check className="w-3 h-3" />
                    </span>
                  )}
                </div>
              </button>
            );
          })}

          <div className="pt-1.5 mt-1 border-t border-slate-100 px-2 flex items-center justify-between text-[10px] text-slate-400">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Model Polo, Jaket & Raglan akan segera ditambahkan</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
