import React, { useState, useRef } from 'react';
import type {
  JerseyCustomization,
  JerseyPattern,
  ShirtSize,
  JerseyRosterItem,
  JerseyPartColors,
  JerseyElementPosition,
  JerseyGraphicElement,
} from '../types';
import {
  Palette,
  User,
  Image as ImageIcon,
  Shield,
  Plus,
  Trash2,
  Check,
  Type,
  Upload,
  Layers,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { JerseyFontPickerModal } from './JerseyFontPickerModal';
import { ALL_JERSEY_FONTS, ensureJerseyFontLoaded } from '../data/jerseyFonts';

const QUICK_PRESETS = [
  { id: 'Impact', name: 'Varsity Bold (Impact)' },
  { id: 'JerseyFont_123', name: 'Persib Bandung' },
  { id: 'JerseyFont_138', name: 'Real Madrid UCL' },
  { id: 'JerseyFont_97', name: 'NBA Bulls' },
];

interface JerseyConfigSidebarProps {
  jerseyConfig: JerseyCustomization;
  onChangeJerseyConfig: (cfg: JerseyCustomization) => void;
  quantity?: number;
  onChangeQuantity: (q: number) => void;
  sizeBreakdown?: Record<ShirtSize, number>;
  onChangeSizeBreakdown: (breakdown: Record<ShirtSize, number>) => void;
}

const PRESET_PATTERNS: { id: JerseyPattern; name: string; desc: string }[] = [
  { id: 'stripes', name: 'Stripes Vertikal', desc: 'Garis-garis atletik klasik khas tim sepak bola' },
  { id: 'geometric', name: 'Hexagon Grid', desc: 'Pola sarang lebah futuristik modern esport & futsal' },
  { id: 'diagonal', name: 'Speed Slashes', desc: 'Garis miring dinamis gaya racing & jersey lari' },
  { id: 'camo', name: 'Sporty Camo', desc: 'Motif kamuflase estetik modern' },
  { id: 'solid', name: 'Minimalist Solid', desc: 'Dua warna bersih tanpa motif ramai' },
];

export const JerseyConfigSidebar: React.FC<JerseyConfigSidebarProps> = ({
  jerseyConfig,
  onChangeJerseyConfig,
  onChangeQuantity,
  onChangeSizeBreakdown,
}) => {
  const [activeTab, setActiveTab] = useState<'parts' | 'player' | 'elements' | 'roster'>('player');
  const [isFontModalOpen, setIsFontModalOpen] = useState<boolean>(false);
  const [fontModalTarget, setFontModalTarget] = useState<'player' | string>('player');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activePart = jerseyConfig.activePart || 'all';

  const showPlayerName = Boolean(jerseyConfig.showPlayerName);
  const showPlayerNumber = Boolean(jerseyConfig.showPlayerNumber);

  const partColors: JerseyPartColors = jerseyConfig.partColors || {
    frontBody: jerseyConfig.primaryColor,
    backBody: jerseyConfig.primaryColor,
    leftSleeve: jerseyConfig.primaryColor,
    rightSleeve: jerseyConfig.primaryColor,
    collar: jerseyConfig.collarColor || jerseyConfig.accentColor,
  };

  const currentPlayerFont =
    ALL_JERSEY_FONTS.find((f) => f.id === (jerseyConfig.fontFamily || 'Impact')) ||
    ALL_JERSEY_FONTS[0];

  const updateField = <K extends keyof JerseyCustomization>(
    key: K,
    value: JerseyCustomization[K]
  ) => {
    onChangeJerseyConfig({
      ...jerseyConfig,
      [key]: value,
    });
  };

  const updatePartColor = (part: keyof JerseyPartColors | 'all', color: string) => {
    if (part === 'all') {
      const updated: JerseyPartColors = {
        frontBody: color,
        backBody: color,
        leftSleeve: color,
        rightSleeve: color,
        collar: partColors.collar,
      };
      onChangeJerseyConfig({
        ...jerseyConfig,
        primaryColor: color,
        partColors: updated,
      });
    } else {
      const updated: JerseyPartColors = {
        ...partColors,
        [part]: color,
      };
      onChangeJerseyConfig({
        ...jerseyConfig,
        partColors: updated,
      });
    }
  };

  const updateElementPos = (
    key: 'playerNamePos' | 'playerNumberPos',
    field: keyof JerseyElementPosition,
    val: number
  ) => {
    const current = jerseyConfig[key] || { x: 50, y: 50, scale: 1 };
    onChangeJerseyConfig({
      ...jerseyConfig,
      [key]: {
        ...current,
        [field]: val,
      },
    });
  };

  // Upload custom logo / image
  const handleUploadImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      const newElem: JerseyGraphicElement = {
        id: 'img-' + Date.now(),
        type: 'image',
        name: file.name.replace(/\.[^/.]+$/, '').slice(0, 15),
        imageUrl: dataUrl,
        x: 25.8, // front chest position
        y: 35,
        scale: 1,
      };
      onChangeJerseyConfig({
        ...jerseyConfig,
        customElements: [...(jerseyConfig.customElements || []), newElem],
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Add custom text element (e.g. Sponsor Dada)
  const handleAddCustomText = () => {
    const newElem: JerseyGraphicElement = {
      id: 'text-' + Date.now(),
      type: 'text',
      name: 'Teks Sponsor',
      text: 'SPONSOR',
      x: 25.8,
      y: 40,
      scale: 1,
      color: '#ffffff',
      strokeColor: '#000000',
      fontFamily: jerseyConfig.fontFamily || 'Impact',
    };
    onChangeJerseyConfig({
      ...jerseyConfig,
      customElements: [...(jerseyConfig.customElements || []), newElem],
    });
  };

  const handleDeleteCustomElement = (id: string) => {
    onChangeJerseyConfig({
      ...jerseyConfig,
      customElements: (jerseyConfig.customElements || []).filter((el) => el.id !== id),
    });
  };

  const handleUpdateCustomElement = (id: string, updates: Partial<JerseyGraphicElement>) => {
    onChangeJerseyConfig({
      ...jerseyConfig,
      customElements: (jerseyConfig.customElements || []).map((el) => {
        if (el.id === id) {
          return { ...el, ...updates };
        }
        return el;
      }),
    });
  };

  // Add new roster player
  const handleAddRosterPlayer = () => {
    const currentRoster = jerseyConfig.roster || [];
    const newItem: JerseyRosterItem = {
      id: 'p-' + Date.now(),
      name: 'PEMAIN ' + (currentRoster.length + 1),
      number: String(currentRoster.length + 1),
      size: 'L',
    };
    const updated = [...currentRoster, newItem];
    updateField('roster', updated);

    const newBreakdown: Record<ShirtSize, number> = {
      S: 0,
      M: 0,
      L: 0,
      XL: 0,
      XXL: 0,
      '3XL': 0,
    };
    updated.forEach((p) => {
      newBreakdown[p.size] = (newBreakdown[p.size] || 0) + 1;
    });
    onChangeSizeBreakdown(newBreakdown);
    onChangeQuantity(updated.length);
  };

  const handleRemoveRosterPlayer = (id: string) => {
    const currentRoster = jerseyConfig.roster || [];
    const updated = currentRoster.filter((p) => p.id !== id);
    updateField('roster', updated);

    if (updated.length > 0) {
      const newBreakdown: Record<ShirtSize, number> = {
        S: 0,
        M: 0,
        L: 0,
        XL: 0,
        XXL: 0,
        '3XL': 0,
      };
      updated.forEach((p) => {
        newBreakdown[p.size] = (newBreakdown[p.size] || 0) + 1;
      });
      onChangeSizeBreakdown(newBreakdown);
      onChangeQuantity(updated.length);
    }
  };

  const handleUpdateRosterPlayer = (
    id: string,
    field: keyof JerseyRosterItem,
    val: string
  ) => {
    const currentRoster = jerseyConfig.roster || [];
    const updated = currentRoster.map((p) => {
      if (p.id === id) {
        return { ...p, [field]: val };
      }
      return p;
    });
    updateField('roster', updated);

    if (field === 'size') {
      const newBreakdown: Record<ShirtSize, number> = {
        S: 0,
        M: 0,
        L: 0,
        XL: 0,
        XXL: 0,
        '3XL': 0,
      };
      updated.forEach((p) => {
        newBreakdown[p.size] = (newBreakdown[p.size] || 0) + 1;
      });
      onChangeSizeBreakdown(newBreakdown);
    }
  };

  return (
    <div className="space-y-4">
      {/* Hidden file input for uploading custom logos */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        onChange={handleUploadImage}
        className="hidden"
      />

      {/* Tab Switcher: Bagian Pola vs Pemain vs Elemen/Logo vs Roster Tim */}
      <div className="grid grid-cols-4 gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('player')}
          className={`py-1.5 px-1 rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer truncate ${
            activeTab === 'player'
              ? 'bg-white text-sky-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>Pemain</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('elements')}
          className={`py-1.5 px-1 rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer truncate ${
            activeTab === 'elements'
              ? 'bg-white text-sky-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5" />
          <span>Logo & Teks</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('parts')}
          className={`py-1.5 px-1 rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer truncate ${
            activeTab === 'parts'
              ? 'bg-white text-sky-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Palette className="w-3.5 h-3.5" />
          <span>Pola Warna</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('roster')}
          className={`py-1.5 px-1 rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer truncate ${
            activeTab === 'roster'
              ? 'bg-white text-sky-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>Roster Tim</span>
        </button>
      </div>

      {/* TAB 1: NAMA & NOMOR PEMAIN (DENGAN TOGGLE ON/OFF OPSIONAL) */}
      {activeTab === 'player' && (
        <div className="space-y-4">
          {/* Card: Nomor Punggung */}
          <div className="p-3 bg-white rounded-2xl border border-slate-200 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <span>Nomor Punggung</span>
              </span>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showPlayerNumber}
                  onChange={(e) => updateField('showPlayerNumber', e.target.checked)}
                  className="rounded text-sky-600 focus:ring-sky-500 w-4 h-4 cursor-pointer"
                />
                <span className="text-[11px] font-semibold text-slate-600">
                  {showPlayerNumber ? 'Aktif' : 'Nonaktif'}
                </span>
              </label>
            </div>

            {showPlayerNumber && (
              <div className="space-y-2.5 pt-1 border-t border-slate-100">
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                    Angka Nomor:
                  </label>
                  <input
                    type="text"
                    value={jerseyConfig.playerNumber}
                    onChange={(e) => updateField('playerNumber', e.target.value)}
                    placeholder="10"
                    maxLength={3}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold tracking-wider focus:outline-sky-500 bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-50 p-2 rounded-xl border border-slate-200 text-center">
                    <span className="text-[10px] font-bold text-slate-600 block mb-1">
                      Warna Nomor
                    </span>
                    <input
                      type="color"
                      value={jerseyConfig.numberColor}
                      onChange={(e) => updateField('numberColor', e.target.value)}
                      className="w-7 h-7 rounded-lg cursor-pointer border border-slate-300 mx-auto block"
                    />
                  </div>
                  <div className="bg-slate-50 p-2 rounded-xl border border-slate-200 text-center">
                    <span className="text-[10px] font-bold text-slate-600 block mb-1">
                      Garis Tepi (Stroke)
                    </span>
                    <input
                      type="color"
                      value={jerseyConfig.numberStrokeColor}
                      onChange={(e) => updateField('numberStrokeColor', e.target.value)}
                      className="w-7 h-7 rounded-lg cursor-pointer border border-slate-300 mx-auto block"
                    />
                  </div>
                </div>

                {/* Slider Ukuran */}
                <div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                    <span>Ukuran Nomor:</span>
                    <span className="font-mono font-bold text-slate-800">
                      {(jerseyConfig.playerNumberPos?.scale || 1).toFixed(1)}x
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="1.6"
                    step="0.05"
                    value={jerseyConfig.playerNumberPos?.scale || 1}
                    onChange={(e) => updateElementPos('playerNumberPos', 'scale', Number(e.target.value))}
                    className="w-full accent-sky-600"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Card: Nama Punggung */}
          <div className="p-3 bg-white rounded-2xl border border-slate-200 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <span>Nama Punggung</span>
              </span>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showPlayerName}
                  onChange={(e) => updateField('showPlayerName', e.target.checked)}
                  className="rounded text-sky-600 focus:ring-sky-500 w-4 h-4 cursor-pointer"
                />
                <span className="text-[11px] font-semibold text-slate-600">
                  {showPlayerName ? 'Aktif' : 'Nonaktif'}
                </span>
              </label>
            </div>

            {showPlayerName && (
              <div className="space-y-2.5 pt-1 border-t border-slate-100">
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                    Teks Nama:
                  </label>
                  <input
                    type="text"
                    value={jerseyConfig.playerName}
                    onChange={(e) => updateField('playerName', e.target.value.toUpperCase())}
                    placeholder="PERALTA"
                    maxLength={14}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold uppercase tracking-wider focus:outline-sky-500 bg-white"
                  />
                </div>

                {/* Slider Ukuran Nama */}
                <div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                    <span>Ukuran Nama:</span>
                    <span className="font-mono font-bold text-slate-800">
                      {(jerseyConfig.playerNamePos?.scale || 1).toFixed(1)}x
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="1.6"
                    step="0.05"
                    value={jerseyConfig.playerNamePos?.scale || 1}
                    onChange={(e) => updateElementPos('playerNamePos', 'scale', Number(e.target.value))}
                    className="w-full accent-sky-600"
                  />
                </div>

                {/* Font Style */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-semibold text-slate-500">
                      Gaya Huruf & Angka (Font):
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setFontModalTarget('player');
                        setIsFontModalOpen(true);
                      }}
                      className="text-[11px] font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>Semua Font ({ALL_JERSEY_FONTS.length})</span>
                    </button>
                  </div>

                  {/* Active Selected Font Card Preview */}
                  <div
                    onClick={() => {
                      setFontModalTarget('player');
                      setIsFontModalOpen(true);
                    }}
                    className="p-2.5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-sky-950 text-white border border-slate-700 hover:border-sky-400 transition cursor-pointer shadow-xs flex items-center justify-between gap-3 group"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-300 border border-sky-400/30">
                          Aktif
                        </span>
                        <span className="text-xs font-bold truncate text-white">
                          {currentPlayerFont.name}
                        </span>
                      </div>
                      <div
                        className="text-base sm:text-lg font-black tracking-widest text-white leading-none drop-shadow"
                        style={{ fontFamily: currentPlayerFont.id }}
                      >
                        {jerseyConfig.playerNumber || '10'} {jerseyConfig.playerName || 'PERALTA'}
                      </div>
                    </div>
                    <div className="px-2.5 py-1.5 rounded-xl bg-white/10 group-hover:bg-sky-600 text-[11px] font-bold transition flex-shrink-0 text-white">
                      Ganti Font →
                    </div>
                  </div>

                  {/* Quick Popular Presets */}
                  <div className="grid grid-cols-2 gap-1.5 mt-2">
                    {QUICK_PRESETS.map((font) => (
                      <button
                        key={font.id}
                        type="button"
                        onClick={() => {
                          ensureJerseyFontLoaded(font.id);
                          updateField('fontFamily', font.id);
                        }}
                        className={`py-1.5 px-2 rounded-xl border text-[11px] font-semibold transition cursor-pointer text-left truncate ${
                          jerseyConfig.fontFamily === font.id
                            ? 'border-sky-500 bg-sky-50 text-sky-900 shadow-2xs font-bold'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        {font.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Reset ke Posisi Standar Jersey */}
          <button
            type="button"
            onClick={() => {
              onChangeJerseyConfig({
                ...jerseyConfig,
                playerNamePos: { x: 75.0, y: 16.5, scale: 1 },
                playerNumberPos: { x: 75.0, y: 29.5, scale: 1 },
              });
            }}
            className="w-full py-2.5 px-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs border border-slate-200"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            <span>Reset Posisi Standar Jersey</span>
          </button>

          <div className="p-2.5 rounded-xl bg-sky-50 border border-sky-200 text-[11px] text-sky-900 flex items-start gap-1.5">
            <Layers className="w-4 h-4 text-sky-600 flex-shrink-0 mt-0.5" />
            <span>
              Tip: Anda bisa <strong>klik & geser langsung</strong> nomor dan nama di atas pola kain di sebelah kiri.
            </span>
          </div>
        </div>
      )}

      {/* TAB 2: ELEMEN & LOGO KUSTOM (UPLOAD BEBAS, GESER, DAN BISA DIHAPUS KAPAN SAJA) */}
      {activeTab === 'elements' && (
        <div className="space-y-4">
          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="py-2.5 px-3 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Gambar</span>
            </button>

            <button
              type="button"
              onClick={handleAddCustomText}
              className="py-2.5 px-3 rounded-2xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Type className="w-3.5 h-3.5" />
              <span>Tambah Teks</span>
            </button>
          </div>

          {/* List of Custom Graphic Elements */}
          {(!jerseyConfig.customElements || jerseyConfig.customElements.length === 0) ? (
            <div className="p-6 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 text-center">
              <ImageIcon className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-700">Belum ada logo atau teks tambahan</p>
              <p className="text-[11px] text-slate-400 mt-1 max-w-[220px] mx-auto">
                Jersey tampil bersih tanpa logo bawaan. Klik tombol di atas jika ingin menambahkan logo tim atau sponsor!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center justify-between">
                <span>Daftar Elemen ({jerseyConfig.customElements.length})</span>
                <span className="text-[10px] text-slate-400 font-normal">Bisa digeser & dihapus</span>
              </div>

              {jerseyConfig.customElements.map((el, idx) => (
                <div
                  key={el.id}
                  className="p-3 bg-white rounded-2xl border border-slate-200 space-y-2.5 shadow-2xs"
                >
                  {/* Header Row: Icon/Thumb, Name, & Delete Button */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {el.type === 'image' && el.imageUrl ? (
                        <img
                          src={el.imageUrl}
                          alt={el.name}
                          className="w-7 h-7 object-contain rounded-lg bg-slate-100 border border-slate-200 p-0.5 flex-shrink-0"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center flex-shrink-0 font-bold text-xs">
                          T
                        </div>
                      )}
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-slate-800 block truncate">
                          {idx + 1}. {el.name || (el.type === 'image' ? 'Logo Gambar' : 'Teks Kustom')}
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          {el.type === 'image' ? 'Gambar/Logo' : 'Teks'} • Geser langsung di pola
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteCustomElement(el.id)}
                      className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-50 transition cursor-pointer flex-shrink-0"
                      title="Hapus Elemen"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* If Text type: allow text editing */}
                  {el.type === 'text' && (
                    <div className="space-y-2 pt-1 border-t border-slate-100">
                      <input
                        type="text"
                        value={el.text || ''}
                        onChange={(e) => handleUpdateCustomElement(el.id, { text: e.target.value.toUpperCase() })}
                        placeholder="Teks..."
                        className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 text-xs font-bold uppercase tracking-wider bg-slate-50"
                      />
                      {/* Font Teks Kustom */}
                      <div className="flex items-center justify-between bg-slate-50 p-2 rounded-xl border border-slate-200">
                        <div className="min-w-0 pr-2">
                          <span className="text-[10px] text-slate-500 block">Font Teks:</span>
                          <span
                            className="text-xs font-bold text-slate-800 truncate block"
                            style={{ fontFamily: el.fontFamily || jerseyConfig.fontFamily || 'Impact' }}
                          >
                            {ALL_JERSEY_FONTS.find((f) => f.id === (el.fontFamily || jerseyConfig.fontFamily))?.name || 'Standard'}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setFontModalTarget(el.id);
                            setIsFontModalOpen(true);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 hover:border-sky-500 text-sky-700 text-[11px] font-bold transition cursor-pointer flex-shrink-0 shadow-2xs"
                        >
                          Ganti Font
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex-1 flex items-center justify-between bg-slate-50 p-1.5 rounded-xl border border-slate-200">
                          <span className="text-[10px] font-semibold text-slate-600">Warna:</span>
                          <input
                            type="color"
                            value={el.color || '#ffffff'}
                            onChange={(e) => handleUpdateCustomElement(el.id, { color: e.target.value })}
                            className="w-6 h-6 rounded cursor-pointer border border-slate-300"
                          />
                        </div>
                        <div className="flex-1 flex items-center justify-between bg-slate-50 p-1.5 rounded-xl border border-slate-200">
                          <span className="text-[10px] font-semibold text-slate-600">Stroke:</span>
                          <input
                            type="color"
                            value={el.strokeColor || '#000000'}
                            onChange={(e) => handleUpdateCustomElement(el.id, { strokeColor: e.target.value })}
                            className="w-6 h-6 rounded cursor-pointer border border-slate-300"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Size / Scale Slider */}
                  <div className="pt-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 mb-0.5">
                      <span>Ukuran:</span>
                      <span className="font-mono font-bold text-slate-800">
                        {(el.scale || 1).toFixed(1)}x
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.3"
                      max="2.5"
                      step="0.05"
                      value={el.scale || 1}
                      onChange={(e) => handleUpdateCustomElement(el.id, { scale: Number(e.target.value) })}
                      className="w-full accent-sky-600"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: BAGIAN POLA & MOTIF (WARNA DAN CORAK) */}
      {activeTab === 'parts' && (
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-2">
              1. Pilih Bagian Pola Jersey (Custom by Part)
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'all', label: 'Semua Bagian' },
                { id: 'front', label: 'Badan Depan' },
                { id: 'back', label: 'Badan Belakang' },
                { id: 'sleeve-left', label: 'Lengan Kiri' },
                { id: 'sleeve-right', label: 'Lengan Kanan' },
                { id: 'collar', label: 'Kerah / Rib' },
              ].map((p) => {
                const isSelected = activePart === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => updateField('activePart', p.id as any)}
                    className={`py-2 px-1.5 rounded-xl border text-[11px] font-bold transition cursor-pointer text-center truncate ${
                      isSelected
                        ? 'border-sky-500 bg-sky-50 text-sky-900 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Color for selected part */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">
                Warna Bagian:{' '}
                <span className="text-sky-600 uppercase font-extrabold">
                  {activePart === 'all'
                    ? 'Semua Bagian'
                    : activePart === 'front'
                    ? 'Badan Depan'
                    : activePart === 'back'
                    ? 'Badan Belakang'
                    : activePart === 'sleeve-left'
                    ? 'Lengan Kiri'
                    : activePart === 'sleeve-right'
                    ? 'Lengan Kanan'
                    : 'Kerah / Rib'}
                </span>
              </span>
              <input
                type="color"
                value={
                  activePart === 'all'
                    ? jerseyConfig.primaryColor
                    : activePart === 'front'
                    ? partColors.frontBody
                    : activePart === 'back'
                    ? partColors.backBody
                    : activePart === 'sleeve-left'
                    ? partColors.leftSleeve
                    : activePart === 'sleeve-right'
                    ? partColors.rightSleeve
                    : partColors.collar
                }
                onChange={(e) => {
                  if (activePart === 'all') updatePartColor('all', e.target.value);
                  else if (activePart === 'front') updatePartColor('frontBody', e.target.value);
                  else if (activePart === 'back') updatePartColor('backBody', e.target.value);
                  else if (activePart === 'sleeve-left') updatePartColor('leftSleeve', e.target.value);
                  else if (activePart === 'sleeve-right') updatePartColor('rightSleeve', e.target.value);
                  else if (activePart === 'collar') updatePartColor('collar', e.target.value);
                }}
                className="w-8 h-8 rounded-lg cursor-pointer border border-slate-300 shadow-xs"
              />
            </div>

            {/* Quick Palette Swatches */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              {[
                '#1e3a8a', '#dc2626', '#16a34a', '#0f172a', '#ffffff', '#f59e0b', '#7c3aed', '#0891b2',
              ].map((hex) => (
                <button
                  key={hex}
                  type="button"
                  onClick={() => {
                    if (activePart === 'all') updatePartColor('all', hex);
                    else if (activePart === 'front') updatePartColor('frontBody', hex);
                    else if (activePart === 'back') updatePartColor('backBody', hex);
                    else if (activePart === 'sleeve-left') updatePartColor('leftSleeve', hex);
                    else if (activePart === 'sleeve-right') updatePartColor('rightSleeve', hex);
                    else if (activePart === 'collar') updatePartColor('collar', hex);
                  }}
                  className="w-6 h-6 rounded-full border border-slate-300 shadow-2xs hover:scale-110 transition cursor-pointer"
                  style={{ backgroundColor: hex }}
                />
              ))}
            </div>
          </div>

          {/* Motif Sublimasi */}
          <div>
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-2">
              2. Motif / Corak Sublimasi
            </label>
            <div className="space-y-1.5">
              {PRESET_PATTERNS.map((p) => {
                const isSelected = jerseyConfig.pattern === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => updateField('pattern', p.id)}
                    className={`w-full p-2.5 rounded-xl border text-left transition flex items-center justify-between gap-3 cursor-pointer ${
                      isSelected
                        ? 'border-sky-500 bg-sky-50/80 text-sky-950 shadow-2xs'
                        : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold">{p.name}</div>
                      <div className="text-[11px] text-slate-500 line-clamp-1">{p.desc}</div>
                    </div>
                    {isSelected && (
                      <span className="w-5 h-5 rounded-full bg-sky-600 text-white flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Warna Motif Sekunder */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-xs font-semibold text-slate-700">Warna Corak/Motif:</span>
            <input
              type="color"
              value={jerseyConfig.secondaryColor}
              onChange={(e) => updateField('secondaryColor', e.target.value)}
              className="w-8 h-8 rounded-lg cursor-pointer border border-slate-300 shadow-xs"
            />
          </div>
        </div>
      )}

      {/* TAB 4: ROSTER TIM (MULTI-PEMAIN) */}
      {activeTab === 'roster' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Daftar Pemain Tim ({jerseyConfig.roster?.length || 1} pcs)
              </div>
              <p className="text-[11px] text-slate-400">
                Data nama & nomor punggung per ukuran kaos
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddRosterPlayer}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah</span>
            </button>
          </div>

          <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
            {(jerseyConfig.roster && jerseyConfig.roster.length > 0
              ? jerseyConfig.roster
              : [
                  {
                    id: 'p-default',
                    name: jerseyConfig.playerName || 'PERALTA',
                    number: jerseyConfig.playerNumber || '10',
                    size: 'L' as ShirtSize,
                  },
                ]
            ).map((player, idx) => (
              <div
                key={player.id}
                className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center gap-2"
              >
                <span className="text-[10px] font-bold text-slate-400 w-4 text-center">
                  #{idx + 1}
                </span>

                <input
                  type="text"
                  value={player.name}
                  onChange={(e) =>
                    handleUpdateRosterPlayer(player.id, 'name', e.target.value.toUpperCase())
                  }
                  placeholder="Nama"
                  className="flex-1 min-w-0 px-2 py-1 rounded-lg border border-slate-200 text-xs font-bold uppercase tracking-wider"
                />

                <input
                  type="text"
                  value={player.number}
                  onChange={(e) =>
                    handleUpdateRosterPlayer(player.id, 'number', e.target.value)
                  }
                  placeholder="No"
                  maxLength={3}
                  className="w-12 px-1.5 py-1 rounded-lg border border-slate-200 text-xs font-bold text-center"
                />

                <select
                  value={player.size}
                  onChange={(e) =>
                    handleUpdateRosterPlayer(player.id, 'size', e.target.value as ShirtSize)
                  }
                  className="px-2 py-1 rounded-lg border border-slate-200 text-xs font-bold bg-white cursor-pointer"
                >
                  {(['S', 'M', 'L', 'XL', 'XXL', '3XL'] as ShirtSize[]).map((sz) => (
                    <option key={sz} value={sz}>
                      {sz}
                    </option>
                  ))}
                </select>

                {jerseyConfig.roster && jerseyConfig.roster.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveRosterPlayer(player.id)}
                    className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 transition cursor-pointer"
                    title="Hapus Pemain"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2">
            <span>
              Total pcs pesanan tim otomatis terhitung dari jumlah pemain di daftar roster ini saat checkout.
            </span>
          </div>
        </div>
      )}
      {/* Jersey Font Picker Modal */}
      <JerseyFontPickerModal
        isOpen={isFontModalOpen}
        onClose={() => setIsFontModalOpen(false)}
        selectedFontId={
          fontModalTarget === 'player'
            ? jerseyConfig.fontFamily || 'Impact'
            : jerseyConfig.customElements?.find((e) => e.id === fontModalTarget)?.fontFamily ||
              jerseyConfig.fontFamily ||
              'Impact'
        }
        onSelectFont={(fontId) => {
          if (fontModalTarget === 'player') {
            updateField('fontFamily', fontId);
          } else {
            handleUpdateCustomElement(fontModalTarget, { fontFamily: fontId });
          }
        }}
        previewText={
          fontModalTarget === 'player'
            ? jerseyConfig.playerName || 'PERALTA'
            : jerseyConfig.customElements?.find((e) => e.id === fontModalTarget)?.text || 'CUSTOM'
        }
        previewNumber={jerseyConfig.playerNumber || '10'}
      />
    </div>
  );
};

