import React, { useState, useMemo } from 'react';
import { Search, X, Check, Type, Sparkles } from 'lucide-react';
import {
  ALL_JERSEY_FONTS,
  JERSEY_FONT_CATEGORIES,
  type JerseyFontItem,
  ensureJerseyFontLoaded,
} from '../data/jerseyFonts';

interface JerseyFontPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedFontId?: string;
  onSelectFont: (fontId: string) => void;
  previewText?: string;
  previewNumber?: string;
}

export const JerseyFontPickerModal: React.FC<JerseyFontPickerModalProps> = ({
  isOpen,
  onClose,
  selectedFontId,
  onSelectFont,
  previewText = 'PERALTA',
  previewNumber = '10',
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredFonts = useMemo(() => {
    let list = ALL_JERSEY_FONTS;

    if (activeCategory !== 'all') {
      list = list.filter((f) => f.category === activeCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          f.id.toLowerCase().includes(q) ||
          (f.file && f.file.toLowerCase().includes(q))
      );
    }

    return list;
  }, [activeCategory, searchQuery]);

  if (!isOpen) return null;

  const handleSelect = async (font: JerseyFontItem) => {
    await ensureJerseyFontLoaded(font.id, `${previewNumber} ${previewText}`);
    onSelectFont(font.id);
    onClose();
  };

  const getCategoryBadge = (cat: JerseyFontItem['category']) => {
    switch (cat) {
      case 'liga1':
        return { label: 'Liga 1', color: 'bg-emerald-100 text-emerald-800' };
      case 'clubs':
        return { label: 'Klub Eropa', color: 'bg-blue-100 text-blue-800' };
      case 'national':
        return { label: 'Timnas', color: 'bg-amber-100 text-amber-800' };
      case 'nba':
        return { label: 'NBA', color: 'bg-purple-100 text-purple-800' };
      case 'custom':
        return { label: 'Esport/Street', color: 'bg-rose-100 text-rose-800' };
      default:
        return { label: 'Standard', color: 'bg-slate-100 text-slate-800' };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between gap-3 bg-gradient-to-r from-sky-900 via-sky-800 to-indigo-900 text-white">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center flex-shrink-0 backdrop-blur-xs">
              <Type className="w-5 h-5 text-sky-300" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-wide flex items-center gap-2">
                Pilih Font Jersey
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-sky-400/20 text-sky-200 border border-sky-300/30">
                  {ALL_JERSEY_FONTS.length} Koleksi
                </span>
              </h2>
              <p className="text-xs text-sky-200 truncate">
                Font autentik klub sepakbola, timnas, basket NBA, Liga 1 & esport
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Bar & Search */}
        <div className="p-3 sm:p-4 bg-slate-50 border-b border-slate-200 space-y-2.5">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari font (contoh: Persib, Madrid, Barca, Bulls, Milan, Adidas, 2024)..."
              className="w-full pl-10 pr-9 py-2 rounded-2xl bg-white border border-slate-300 text-xs sm:text-sm font-semibold focus:outline-sky-500 focus:border-sky-500 shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Categories Horizontal Scroll */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {JERSEY_FONT_CATEGORIES.map((cat) => {
              const count =
                cat.id === 'all'
                  ? ALL_JERSEY_FONTS.length
                  : ALL_JERSEY_FONTS.filter((f) => f.category === cat.id).length;
              const isActive = activeCategory === cat.id;

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 flex-shrink-0 ${
                    isActive
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <span>{cat.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isActive ? 'bg-sky-700/80 text-white' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Font Cards Grid */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 bg-slate-100">
          {filteredFonts.length === 0 ? (
            <div className="p-12 text-center">
              <Sparkles className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">Tidak ada font yang cocok</p>
              <p className="text-xs text-slate-500 mt-1">
                Coba ubah kata kunci pencarian atau ganti kategori.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
              {filteredFonts.map((font) => {
                const isSelected = selectedFontId === font.id;
                const badge = getCategoryBadge(font.category);

                return (
                  <div
                    key={font.id}
                    onClick={() => handleSelect(font)}
                    className={`group relative p-3 sm:p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between overflow-hidden ${
                      isSelected
                        ? 'bg-sky-50/90 border-sky-500 ring-2 ring-sky-500/30 shadow-md'
                        : 'bg-white border-slate-200 hover:border-sky-300 hover:shadow-md'
                    }`}
                  >
                    {/* Top Row: Font Name & Badge */}
                    <div className="flex items-center justify-between gap-1.5 mb-2">
                      <span className="text-xs font-bold text-slate-800 truncate" title={font.name}>
                        {font.name}
                      </span>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${badge.color}`}
                        >
                          {badge.label}
                        </span>
                        {isSelected && (
                          <span className="w-4 h-4 rounded-full bg-sky-600 text-white flex items-center justify-center">
                            <Check className="w-2.5 h-2.5" />
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Live Font Sample Preview */}
                    <div className="py-2.5 px-3 bg-slate-900 rounded-xl text-center text-white flex flex-col items-center justify-center min-h-[72px] shadow-inner">
                      <span
                        className="text-2xl sm:text-3xl font-black tracking-widest text-white leading-none mb-1 drop-shadow"
                        style={{ fontFamily: font.id }}
                      >
                        {previewNumber || '10'}
                      </span>
                      <span
                        className="text-xs font-bold tracking-wider text-sky-300 truncate max-w-full drop-shadow"
                        style={{ fontFamily: font.id }}
                      >
                        {previewText || 'PERALTA'}
                      </span>
                    </div>

                    {/* Bottom Status / Select Action */}
                    <div className="mt-2 flex items-center justify-between text-[11px]">
                      <span className="text-[10px] text-slate-400 font-mono truncate">
                        {font.id}
                      </span>
                      <span
                        className={`text-xs font-bold ${
                          isSelected
                            ? 'text-sky-600'
                            : 'text-slate-500 group-hover:text-sky-600 transition'
                        }`}
                      >
                        {isSelected ? 'Terpilih' : 'Pilih Font →'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 bg-white border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>
            Menampilkan <strong>{filteredFonts.length}</strong> dari{' '}
            <strong>{ALL_JERSEY_FONTS.length}</strong> font
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
