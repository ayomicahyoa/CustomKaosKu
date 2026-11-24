import React, { useState, useRef, useMemo, useEffect } from 'react';
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
  Plus,
  Trash2,
  Check,
  Type,
  Upload,
  Layers,
  Sparkles,
  RefreshCw,
  Search,
  Folder,
  FileSpreadsheet,
  Eye,
  RotateCcw,
  Users,
  Wand2,
} from 'lucide-react';
import { JerseyFontPickerModal } from './JerseyFontPickerModal';
import { JerseyRosterImportModal } from './JerseyRosterImportModal';
import { extractDominantPalette } from '../utils/jerseyColorExtractor';
import { isPaletteModified } from '../utils/jerseyRecolor';
import { removeImageBackground } from '../utils/imageBackgroundRemover';
import { ALL_JERSEY_FONTS, ensureJerseyFontLoaded } from '../data/jerseyFonts';
import { JERSEY_TEMPLATES, JERSEY_FOLDERS, type JerseyTemplateItem } from '../data/jerseyTemplates';

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
  const [activeTab, setActiveTab] = useState<'templates' | 'player' | 'elements' | 'parts' | 'roster'>('templates');
  const [isFontModalOpen, setIsFontModalOpen] = useState<boolean>(false);
  const [fontModalTarget, setFontModalTarget] = useState<'player' | string>('player');
  const [sampleLogoColor, setSampleLogoColor] = useState<'white' | 'black'>('black');
  const [selectedFolder, setSelectedFolder] = useState<string>('Semua');
  const [templateSearch, setTemplateSearch] = useState<string>('');
  const [visibleTemplateLimit, setVisibleTemplateLimit] = useState<number>(36);
  const [isRosterModalOpen, setIsRosterModalOpen] = useState<boolean>(false);
  const [processingBgId, setProcessingBgId] = useState<string | null>(null);
  const [autoRemoveBgOnUpload, setAutoRemoveBgOnUpload] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const templateUploadRef = useRef<HTMLInputElement>(null);

  const filteredTemplates = useMemo(() => {
    return JERSEY_TEMPLATES.filter((tmpl) => {
      const matchFolder = selectedFolder === 'Semua' || tmpl.folder === selectedFolder;
      const matchSearch =
        !templateSearch.trim() ||
        tmpl.name.toLowerCase().includes(templateSearch.toLowerCase()) ||
        (tmpl.folder && tmpl.folder.toLowerCase().includes(templateSearch.toLowerCase()));
      return matchFolder && matchSearch;
    });
  }, [selectedFolder, templateSearch]);

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

  const lastExtractedUrlRef = useRef<string>('');

  // Dynamically extract dominant color palette whenever template texture changes
  useEffect(() => {
    if (!jerseyConfig.templateTextureUrl) return;

    if (
      lastExtractedUrlRef.current === jerseyConfig.templateTextureUrl &&
      jerseyConfig.colorPalette &&
      jerseyConfig.colorPalette.length > 0
    ) {
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = jerseyConfig.templateTextureUrl;
    img.onload = () => {
      const palette = extractDominantPalette(img, jerseyConfig.templateTextureUrl);
      if (palette && palette.length > 0) {
        lastExtractedUrlRef.current = jerseyConfig.templateTextureUrl!;
        onChangeJerseyConfig({
          ...jerseyConfig,
          colorPalette: palette,
        });
      }
    };
  }, [jerseyConfig.templateTextureUrl, jerseyConfig.colorPalette]);

  const handleUpdatePaletteColor = (colorId: string, newHex: string) => {
    const current = jerseyConfig.colorPalette || [];
    const updated = current.map((p) => {
      if (p.id === colorId) {
        return { ...p, currentHex: newHex };
      }
      return p;
    });
    onChangeJerseyConfig({
      ...jerseyConfig,
      colorPalette: updated,
    });
  };

  const handleResetPalette = () => {
    const current = jerseyConfig.colorPalette || [];
    const reverted = current.map((p) => ({
      ...p,
      currentHex: p.originalHex,
    }));
    onChangeJerseyConfig({
      ...jerseyConfig,
      colorPalette: reverted,
    });
  };

  const PRESET_THEMES = [
    { name: 'Merah - Putih', colors: ['#dc2626', '#ffffff', '#991b1b', '#f8fafc'] },
    { name: 'Biru - Kuning', colors: ['#1d4ed8', '#facc15', '#1e40af', '#fef08a'] },
    { name: 'Hitam - Emas', colors: ['#0f172a', '#eab308', '#1e293b', '#fde047'] },
    { name: 'Neon Green', colors: ['#15803d', '#4ade80', '#166534', '#86efac'] },
    { name: 'Monokrom', colors: ['#09090b', '#71717a', '#27272a', '#e4e4e7'] },
    { name: 'Cyberpunk', colors: ['#7c3aed', '#06b6d4', '#6d28d9', '#22d3ee'] },
  ];

  const handleApplyTheme = (themeColors: string[]) => {
    const current = jerseyConfig.colorPalette || [];
    const updated = current.map((p, idx) => ({
      ...p,
      currentHex: themeColors[idx % themeColors.length] || p.currentHex,
    }));
    onChangeJerseyConfig({
      ...jerseyConfig,
      colorPalette: updated,
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
    reader.onload = async (ev) => {
      let dataUrl = ev.target?.result as string;
      const originalUrl = dataUrl;
      let hasRemoved = false;

      if (autoRemoveBgOnUpload) {
        try {
          dataUrl = await removeImageBackground(originalUrl);
          hasRemoved = true;
        } catch (err) {
          console.warn('Auto remove background failed:', err);
        }
      }

      const newElem: JerseyGraphicElement = {
        id: 'img-' + Date.now(),
        type: 'image',
        name: file.name.replace(/\.[^/.]+$/, '').slice(0, 15),
        imageUrl: dataUrl,
        originalImageUrl: originalUrl,
        hasRemovedBg: hasRemoved,
        bgTolerance: 42,
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

  // Magic Background Remover for custom uploaded logo/element
  const handleToggleRemoveBg = async (el: JerseyGraphicElement, customTolerance?: number) => {
    if (!el.imageUrl) return;

    // If already removed and user clicks revert (no custom tolerance specified)
    if (el.hasRemovedBg && customTolerance === undefined && el.originalImageUrl) {
      handleUpdateCustomElement(el.id, {
        imageUrl: el.originalImageUrl,
        hasRemovedBg: false,
      });
      return;
    }

    try {
      setProcessingBgId(el.id);
      const original = el.originalImageUrl || el.imageUrl;
      const tolerance = customTolerance ?? el.bgTolerance ?? 42;
      const transparentDataUrl = await removeImageBackground(original, {
        tolerance,
        feather: 16,
      });

      handleUpdateCustomElement(el.id, {
        originalImageUrl: original,
        imageUrl: transparentDataUrl,
        hasRemovedBg: true,
        bgTolerance: tolerance,
      });
    } catch (err) {
      console.error('Failed to remove background:', err);
    } finally {
      setProcessingBgId(null);
    }
  };

  // Upload fullprint custom sublimation pattern
  const handleUploadTemplateTexture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      onChangeJerseyConfig({
        ...jerseyConfig,
        templateId: 'custom-upload',
        templateTextureUrl: dataUrl,
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Select a preset template design
  const handleSelectTemplate = (template: JerseyTemplateItem | null) => {
    let elements = (jerseyConfig.customElements || []).filter(
      (el) => !el.id.startsWith('tmpl-')
    );

    if (!template) {
      onChangeJerseyConfig({
        ...jerseyConfig,
        templateId: undefined,
        templateTextureUrl: undefined,
        customElements: elements,
      });
      return;
    }

    const updatedCollar = template.defaultCollarColor || jerseyConfig.collarColor;
    const updatedNumberColor = '#111827'; // Default nomor hitam
    const updatedStrokeColor = '#ffffff'; // Default garis tepi putih

    // If elements list is empty, inject default 3 sample elements (badge, apparel, sponsor) in black
    if (elements.length === 0) {
      elements = [
        {
          id: 'default-badge',
          type: 'image',
          name: 'Logo Klub (Dada Kiri)',
          imageUrl: '/mockups/elements/badge_black.png',
          x: 35.0,
          y: 20.0,
          scale: 0.55,
        },
        {
          id: 'default-apparel',
          type: 'image',
          name: 'Logo Apparel (Dada Kanan)',
          imageUrl: '/mockups/elements/apparel_black.png',
          x: 15.0,
          y: 20.0,
          scale: 0.45,
        },
        {
          id: 'default-sponsor',
          type: 'image',
          name: 'Sponsor Dada (Cursive)',
          imageUrl: '/mockups/elements/sponsor_black.png',
          x: 25.0,
          y: 38.0,
          scale: 1.1,
        },
      ];
    } else {
      // Keep sample elements in black by default
      elements = elements.map((el) => {
        if (el.imageUrl?.includes('/mockups/elements/')) {
          const newUrl = el.imageUrl.replace('_white.png', '_black.png');
          return { ...el, imageUrl: newUrl };
        }
        return el;
      });
    }

    onChangeJerseyConfig({
      ...jerseyConfig,
      templateId: template.id,
      templateTextureUrl: template.textureUrl,
      collarColor: updatedCollar,
      numberColor: updatedNumberColor,
      numberStrokeColor: updatedStrokeColor,
      showPlayerName: true,
      showPlayerNumber: true,
      colorPalette: undefined,
      partColors: {
        ...partColors,
        collar: updatedCollar,
      },
      customElements: elements,
    });
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

  // Add sample logo / sponsor element to front chest area
  const handleAddPresetElement = (type: 'badge' | 'apparel' | 'sponsor', color: 'white' | 'black') => {
    let newElem: JerseyGraphicElement;
    if (type === 'badge') {
      newElem = {
        id: 'preset-badge-' + Date.now(),
        type: 'image',
        name: 'Logo Klub (Dada Kiri)',
        imageUrl: `/mockups/elements/badge_${color}.png`,
        x: 35.0, // Left chest on front body
        y: 20.0,
        scale: 0.55,
      };
    } else if (type === 'apparel') {
      newElem = {
        id: 'preset-apparel-' + Date.now(),
        type: 'image',
        name: 'Logo Apparel (Dada Kanan)',
        imageUrl: `/mockups/elements/apparel_${color}.png`,
        x: 15.0, // Right chest on front body
        y: 20.0,
        scale: 0.45,
      };
    } else {
      newElem = {
        id: 'preset-sponsor-' + Date.now(),
        type: 'image',
        name: 'Sponsor Dada (Cursive)',
        imageUrl: `/mockups/elements/sponsor_${color}.png`,
        x: 25.0, // Center chest on front body
        y: 38.0,
        scale: 1.1,
      };
    }

    onChangeJerseyConfig({
      ...jerseyConfig,
      customElements: [...(jerseyConfig.customElements || []), newElem],
    });
  };

  // Add all 3 sample elements (badge, apparel, sponsor) at once to front chest
  const handleAddAllPresetElements = (color: 'white' | 'black') => {
    const t = Date.now();
    const newElems: JerseyGraphicElement[] = [
      {
        id: 'preset-badge-' + t,
        type: 'image',
        name: 'Logo Klub (Dada Kiri)',
        imageUrl: `/mockups/elements/badge_${color}.png`,
        x: 35.0,
        y: 20.0,
        scale: 0.55,
      },
      {
        id: 'preset-apparel-' + (t + 1),
        type: 'image',
        name: 'Logo Apparel (Dada Kanan)',
        imageUrl: `/mockups/elements/apparel_${color}.png`,
        x: 15.0,
        y: 20.0,
        scale: 0.45,
      },
      {
        id: 'preset-sponsor-' + (t + 2),
        type: 'image',
        name: 'Sponsor Dada (Cursive)',
        imageUrl: `/mockups/elements/sponsor_${color}.png`,
        x: 25.0,
        y: 38.0,
        scale: 1.1,
      },
    ];

    onChangeJerseyConfig({
      ...jerseyConfig,
      customElements: [...(jerseyConfig.customElements || []), ...newElems],
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

  // Helper to sync size breakdown and total quantity
  const syncRosterBreakdown = (rosterList: JerseyRosterItem[]) => {
    const newBreakdown: Record<ShirtSize, number> = {
      S: 0,
      M: 0,
      L: 0,
      XL: 0,
      XXL: 0,
      '3XL': 0,
    };
    rosterList.forEach((p) => {
      newBreakdown[p.size] = (newBreakdown[p.size] || 0) + 1;
    });
    onChangeSizeBreakdown(newBreakdown);
    onChangeQuantity(Math.max(1, rosterList.length));
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
    syncRosterBreakdown(updated);
  };

  const handleRemoveRosterPlayer = (id: string) => {
    const currentRoster = jerseyConfig.roster || [];
    const updated = currentRoster.filter((p) => p.id !== id);
    updateField('roster', updated);
    syncRosterBreakdown(updated);
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
      syncRosterBreakdown(updated);
    }
  };

  // Preview specific player on 3D Jersey
  const handlePreviewPlayerIn3D = (player: JerseyRosterItem) => {
    onChangeJerseyConfig({
      ...jerseyConfig,
      showPlayerName: true,
      playerName: player.name,
      showPlayerNumber: true,
      playerNumber: player.number,
    });
  };

  // Apply imported roster from modal
  const handleApplyImportedRoster = (
    imported: JerseyRosterItem[],
    mode: 'replace' | 'append'
  ) => {
    const currentRoster = jerseyConfig.roster || [];
    const updated = mode === 'replace' ? imported : [...currentRoster, ...imported];
    const firstPlayer = updated[0];
    onChangeJerseyConfig({
      ...jerseyConfig,
      roster: updated,
      playerName: firstPlayer ? firstPlayer.name : jerseyConfig.playerName,
      playerNumber: firstPlayer ? firstPlayer.number : jerseyConfig.playerNumber,
      showPlayerName: true,
      showPlayerNumber: true,
    });
    syncRosterBreakdown(updated);
  };

  // Reset roster to single default player
  const handleResetRoster = () => {
    if (!window.confirm('Reset roster kembali ke 1 pemain?')) return;
    const defaultRoster: JerseyRosterItem[] = [
      {
        id: 'p-default',
        name: jerseyConfig.playerName || 'PERALTA',
        number: jerseyConfig.playerNumber || '10',
        size: 'L',
      },
    ];
    updateField('roster', defaultRoster);
    syncRosterBreakdown(defaultRoster);
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

      {/* Hidden file input for uploading fullprint template texture */}
      <input
        ref={templateUploadRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={handleUploadTemplateTexture}
        className="hidden"
      />

      {/* Tab Switcher: Desain vs Pemain vs Logo/Teks vs Pola Warna vs Roster */}
      <div className="grid grid-cols-5 gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('templates')}
          className={`py-1.5 px-1 rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer truncate ${
            activeTab === 'templates'
              ? 'bg-white text-sky-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Desain</span>
        </button>
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
          <span>Logo</span>
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
          <span>Warna</span>
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
          <Users className="w-3.5 h-3.5" />
          <span>Roster</span>
          {jerseyConfig.roster && jerseyConfig.roster.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-sky-100 text-sky-800 text-[9px] font-bold">
              {jerseyConfig.roster.length}
            </span>
          )}
        </button>
      </div>

      {/* TAB 0: KATALOG TEMPLATE DESAIN JERSEY (SUBIMASI) */}
      {activeTab === 'templates' && (
        <div className="space-y-4">
          <div className="p-3 bg-gradient-to-br from-amber-500/10 via-sky-500/10 to-transparent rounded-2xl border border-amber-200/50">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <h3 className="text-xs font-bold text-slate-800">Katalog Desain Jersey Siap Pakai</h3>
            </div>
            <p className="text-[11px] text-slate-600 mt-1">
              Pilih dari <b>{JERSEY_TEMPLATES.length}</b> motif autentik CorelDRAW tanpa logo dummy.
            </p>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={templateSearch}
              onChange={(e) => {
                setTemplateSearch(e.target.value);
                setVisibleTemplateLimit(36);
              }}
              placeholder="Cari motif jersey (contoh: Milan, Persib, 001)..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-sky-500 focus:bg-white transition"
            />
            {templateSearch && (
              <button
                type="button"
                onClick={() => {
                  setTemplateSearch('');
                  setVisibleTemplateLimit(36);
                }}
                className="absolute right-2.5 top-2 text-[10px] text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Folder Pills Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            {JERSEY_FOLDERS.map((fld) => {
              const count =
                fld === 'Semua'
                  ? JERSEY_TEMPLATES.length
                  : JERSEY_TEMPLATES.filter((t) => t.folder === fld).length;
              const isAct = selectedFolder === fld;
              return (
                <button
                  key={fld}
                  type="button"
                  onClick={() => {
                    setSelectedFolder(fld);
                    setVisibleTemplateLimit(36);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold shrink-0 transition flex items-center gap-1 cursor-pointer ${
                    isAct
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <Folder className={`w-3 h-3 ${isAct ? 'text-white' : 'text-slate-500'}`} />
                  <span>{fld}</span>
                  <span
                    className={`text-[9px] px-1 py-0.2 rounded-full font-semibold ${
                      isAct ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-slate-600'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Grid Template Cards */}
          <div className="grid grid-cols-2 gap-2.5">
            {/* Opsi 0: Tanpa Template (Polos / Warna Dasar) - muncul saat filter Semua dan tidak sedang cari */}
            {selectedFolder === 'Semua' && !templateSearch && (
              <button
                type="button"
                onClick={() => handleSelectTemplate(null)}
                className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer group ${
                  !jerseyConfig.templateTextureUrl
                    ? 'border-sky-600 bg-sky-50/50 ring-2 ring-sky-500/20 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="w-full aspect-[4/3] rounded-lg bg-slate-100 border border-slate-200 flex flex-col items-center justify-center text-slate-400 group-hover:text-slate-600 mb-2">
                  <Palette className="w-6 h-6 mb-1 text-slate-400" />
                  <span className="text-[10px] font-semibold">Warna Polos</span>
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-800">Polos / Custom</span>
                    {!jerseyConfig.templateTextureUrl && (
                      <span className="w-4 h-4 rounded-full bg-sky-600 text-white flex items-center justify-center text-[10px]">
                        <Check className="w-2.5 h-2.5" />
                      </span>
                    )}
                  </div>
                  <p className="text-[9.5px] text-slate-500 mt-0.5 leading-tight">
                    Warna solid atau garis manual dari tab Warna.
                  </p>
                </div>
              </button>
            )}

            {/* Template List from Filtered Templates */}
            {filteredTemplates.slice(0, visibleTemplateLimit).map((tmpl) => {
              const isSelected = jerseyConfig.templateId === tmpl.id;
              return (
                <button
                  key={tmpl.id}
                  type="button"
                  onClick={() => handleSelectTemplate(tmpl)}
                  className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer group relative overflow-hidden ${
                    isSelected
                      ? 'border-sky-600 bg-sky-50/60 ring-2 ring-sky-500/30 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-2xs'
                  }`}
                >
                  <div className="w-full aspect-[4/3] rounded-lg overflow-hidden border border-slate-200/80 mb-2 bg-slate-900 relative">
                    <img
                      src={tmpl.thumbnailUrl}
                      alt={tmpl.name}
                      loading="lazy"
                      className="w-full h-full object-contain group-hover:scale-105 transition duration-300"
                    />
                    <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded text-[8px] font-bold bg-black/70 text-white backdrop-blur-xs">
                      {tmpl.folder}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-900 line-clamp-1" title={tmpl.name}>
                        {tmpl.name}
                      </span>
                      {isSelected && (
                        <span className="w-4 h-4 shrink-0 rounded-full bg-sky-600 text-white flex items-center justify-center text-[10px] ml-1">
                          <Check className="w-2.5 h-2.5" />
                        </span>
                      )}
                    </div>
                    <p className="text-[9px] text-slate-500 mt-0.5 line-clamp-1 leading-tight">
                      {tmpl.description}
                    </p>
                  </div>
                </button>
              );
            })}

            {/* Tombol Load More jika masih banyak template */}
            {filteredTemplates.length > visibleTemplateLimit && (
              <div className="col-span-2 pt-2">
                <button
                  type="button"
                  onClick={() => setVisibleTemplateLimit((prev) => prev + 36)}
                  className="w-full py-2.5 rounded-xl bg-sky-50 hover:bg-sky-100/80 border border-sky-200 text-sky-700 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Tampilkan Lebih Banyak (+{Math.min(36, filteredTemplates.length - visibleTemplateLimit)} dari {filteredTemplates.length} desain)</span>
                </button>
              </div>
            )}

            {filteredTemplates.length === 0 && (
              <div className="col-span-2 py-8 text-center text-slate-400">
                <p className="text-xs font-medium">Tidak ada motif yang cocok dengan pencarian "{templateSearch}"</p>
              </div>
            )}
          </div>

          {/* Opsi Upload Desain Sublimasi Sendiri */}
          <div className="p-3 bg-white rounded-2xl border border-slate-200 space-y-2 shadow-2xs">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-800">Punya Desain Sendiri?</h4>
                <p className="text-[10.5px] text-slate-500">
                  Upload file full-print resolusi tinggi (.png atau .jpg).
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => templateUploadRef.current?.click()}
              className="w-full py-2 px-3 rounded-xl border border-dashed border-sky-300 bg-sky-50/50 hover:bg-sky-100/60 text-sky-700 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Unggah File Desain Custom</span>
            </button>
            {jerseyConfig.templateId === 'custom-upload' && (
              <div className="flex items-center justify-between px-2.5 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-[10px] font-semibold">
                <span>File custom aktif</span>
                <button
                  type="button"
                  onClick={() => handleSelectTemplate(null)}
                  className="text-red-500 hover:text-red-700 underline cursor-pointer"
                >
                  Hapus
                </button>
              </div>
            )}
          </div>
        </div>
      )}

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

          {/* Quick Option: Auto remove background when uploading */}
          <label className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100 transition">
            <input
              type="checkbox"
              checked={autoRemoveBgOnUpload}
              onChange={(e) => setAutoRemoveBgOnUpload(e.target.checked)}
              className="w-3.5 h-3.5 rounded text-sky-600 focus:ring-sky-500 cursor-pointer"
            />
            <div className="text-[11px] leading-tight">
              <span className="font-bold text-slate-700 block">Otomatis Hapus Background Saat Upload</span>
              <span className="text-[9.5px] text-slate-400">Hilangkan kotak putih/hitam polos logo secara instan</span>
            </div>
          </label>

          {/* Preset Template Logos & Sponsor (Front Area) */}
          <div className="p-3 bg-white rounded-2xl border border-slate-200 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Preset Logo & Sponsor (Depan)</span>
                </span>
                <p className="text-[10.5px] text-slate-500 mt-0.5">
                  Pilih warna lalu klik untuk pasang di dada depan:
                </p>
              </div>
              {/* Color switch: White vs Black */}
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                <button
                  type="button"
                  onClick={() => setSampleLogoColor('white')}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition cursor-pointer flex items-center gap-1 ${
                    sampleLogoColor === 'white'
                      ? 'bg-white text-slate-800 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                  title="Pilih warna putih untuk jersey gelap"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-white border border-slate-300" />
                  <span>Putih</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSampleLogoColor('black')}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition cursor-pointer flex items-center gap-1 ${
                    sampleLogoColor === 'black'
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                  title="Pilih warna hitam untuk jersey terang"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-black border border-slate-700" />
                  <span>Hitam</span>
                </button>
              </div>
            </div>

            {/* 3 Quick Cards */}
            <div className="grid grid-cols-3 gap-2">
              {/* Dada Kiri (Badge) */}
              <button
                type="button"
                onClick={() => handleAddPresetElement('badge', sampleLogoColor)}
                className="p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-sky-50 hover:border-sky-300 transition text-center cursor-pointer group flex flex-col items-center justify-between"
              >
                <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center p-1.5 mb-1.5 shadow-2xs group-hover:scale-105 transition">
                  <img
                    src={`/mockups/elements/badge_${sampleLogoColor}.png`}
                    alt="Logo Klub"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
                <span className="text-[10px] font-bold text-slate-700 block leading-tight">
                  Dada Kiri
                </span>
                <span className="text-[8.5px] text-sky-600 font-semibold mt-0.5 block">
                  + Pasang
                </span>
              </button>

              {/* Dada Kanan (Apparel) */}
              <button
                type="button"
                onClick={() => handleAddPresetElement('apparel', sampleLogoColor)}
                className="p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-sky-50 hover:border-sky-300 transition text-center cursor-pointer group flex flex-col items-center justify-between"
              >
                <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center p-1.5 mb-1.5 shadow-2xs group-hover:scale-105 transition">
                  <img
                    src={`/mockups/elements/apparel_${sampleLogoColor}.png`}
                    alt="Logo Apparel"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
                <span className="text-[10px] font-bold text-slate-700 block leading-tight">
                  Dada Kanan
                </span>
                <span className="text-[8.5px] text-sky-600 font-semibold mt-0.5 block">
                  + Pasang
                </span>
              </button>

              {/* Dada Tengah (Sponsor) */}
              <button
                type="button"
                onClick={() => handleAddPresetElement('sponsor', sampleLogoColor)}
                className="p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-sky-50 hover:border-sky-300 transition text-center cursor-pointer group flex flex-col items-center justify-between"
              >
                <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center p-1 mb-1.5 shadow-2xs group-hover:scale-105 transition">
                  <img
                    src={`/mockups/elements/sponsor_${sampleLogoColor}.png`}
                    alt="Sponsor Cursive"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
                <span className="text-[10px] font-bold text-slate-700 block leading-tight">
                  Sponsor
                </span>
                <span className="text-[8.5px] text-sky-600 font-semibold mt-0.5 block">
                  + Pasang
                </span>
              </button>
            </div>

            {/* Pasang 3 Elemen Sekaligus Button */}
            <button
              type="button"
              onClick={() => handleAddAllPresetElements(sampleLogoColor)}
              className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white text-[11px] font-bold transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Pasang 3 Elemen Sekaligus di Depan</span>
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

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {el.type === 'image' && el.imageUrl?.includes('/mockups/elements/') && (
                        <div className="flex items-center gap-0.5 bg-slate-100 p-0.5 rounded-lg border border-slate-200 mr-1">
                          <button
                            type="button"
                            onClick={() => handleUpdateCustomElement(el.id, {
                              imageUrl: el.imageUrl?.replace('_black.png', '_white.png')
                            })}
                            className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition cursor-pointer ${
                              el.imageUrl?.includes('_white.png')
                                ? 'bg-white text-slate-800 shadow-2xs'
                                : 'text-slate-500 hover:text-slate-700'
                            }`}
                            title="Ganti ke warna putih"
                          >
                            Putih
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateCustomElement(el.id, {
                              imageUrl: el.imageUrl?.replace('_white.png', '_black.png')
                            })}
                            className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition cursor-pointer ${
                              el.imageUrl?.includes('_black.png')
                                ? 'bg-slate-900 text-white shadow-2xs'
                                : 'text-slate-500 hover:text-slate-700'
                            }`}
                            title="Ganti ke warna hitam"
                          >
                            Hitam
                          </button>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDeleteCustomElement(el.id)}
                        className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-50 transition cursor-pointer flex-shrink-0"
                        title="Hapus Elemen"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
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

                  {/* Magic Background Remover Button & Fine-Tune Slider (for images) */}
                  {el.type === 'image' && el.imageUrl && (
                    <div className="pt-2 border-t border-slate-100 space-y-2">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleToggleRemoveBg(el)}
                          disabled={processingBgId === el.id}
                          className={`flex-1 py-1.5 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                            el.hasRemovedBg
                              ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                              : 'bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200'
                          }`}
                          title={
                            el.hasRemovedBg
                              ? 'Background sudah dihapus'
                              : 'Hapus background putih/polos otomatis'
                          }
                        >
                          {processingBgId === el.id ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-600" />
                              <span>Memproses...</span>
                            </>
                          ) : el.hasRemovedBg ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Background Terhapus (Transparan)</span>
                            </>
                          ) : (
                            <>
                              <Wand2 className="w-3.5 h-3.5 text-sky-600" />
                              <span>Hapus Background Logo</span>
                            </>
                          )}
                        </button>

                        {el.hasRemovedBg && (
                          <button
                            type="button"
                            onClick={() => handleToggleRemoveBg(el)}
                            className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition cursor-pointer flex-shrink-0"
                            title="Kembalikan Gambar Asli (Batal Hapus Background)"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Tolerance Slider if background is removed */}
                      {el.hasRemovedBg && (
                        <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                          <div className="flex items-center justify-between text-[10px] text-slate-500">
                            <span>Sensitivitas / Toleransi:</span>
                            <span className="font-mono font-bold text-slate-700">
                              {el.bgTolerance || 42}
                            </span>
                          </div>
                          <input
                            type="range"
                            min="15"
                            max="80"
                            step="2"
                            value={el.bgTolerance || 42}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              handleToggleRemoveBg(el, val);
                            }}
                            className="w-full accent-emerald-600 h-1.5 cursor-pointer"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: BAGIAN POLA & MOTIF (WARNA DAN CORAK) */}
      {activeTab === 'parts' && (
        <div className="space-y-4">
          {jerseyConfig.templateTextureUrl ? (
            /* JIKA TEMPLATE AKTIF: PALET WARNA MOTIF REAL-TIME */
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-sky-500/10 via-indigo-500/10 to-transparent border border-sky-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-sky-600" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">
                        Warna Motif Desain ({jerseyConfig.colorPalette?.length || 0} Warna Terdeteksi)
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Ubah warna corak desain ini langsung di model 3D!
                      </p>
                    </div>
                  </div>

                  {isPaletteModified(jerseyConfig.colorPalette) && (
                    <button
                      type="button"
                      onClick={handleResetPalette}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 text-[11px] font-bold transition cursor-pointer"
                      title="Kembalikan ke warna asli template"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Reset</span>
                    </button>
                  )}
                </div>

                {/* Color Items */}
                <div className="space-y-2">
                  {(jerseyConfig.colorPalette || []).map((cp, idx) => (
                    <div
                      key={cp.id}
                      className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <input
                          type="color"
                          value={cp.currentHex}
                          onChange={(e) => handleUpdatePaletteColor(cp.id, e.target.value)}
                          className="w-8 h-8 rounded-lg cursor-pointer border border-slate-300 shadow-xs"
                        />
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5 truncate">
                            <span>{cp.label || `Warna ${idx + 1}`}</span>
                            <span className="text-[10px] font-mono font-normal text-slate-400">
                              ({cp.percentage}%)
                            </span>
                          </div>
                          <div className="text-[10px] font-mono text-slate-500 uppercase flex items-center gap-1">
                            <span>{cp.currentHex}</span>
                            {cp.currentHex.toLowerCase() !== cp.originalHex.toLowerCase() && (
                              <span className="text-sky-600 font-bold">(Diubah)</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <span
                          className="w-4 h-4 rounded-full border border-slate-300 shadow-2xs"
                          style={{ backgroundColor: cp.originalHex }}
                          title={`Warna asli: ${cp.originalHex}`}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Quick Theme Presets */}
                <div className="pt-2 border-t border-sky-100">
                  <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    Tema Warna Cepat (1-Klik):
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {PRESET_THEMES.map((th) => (
                      <button
                        key={th.name}
                        type="button"
                        onClick={() => handleApplyTheme(th.colors)}
                        className="p-1.5 rounded-lg border border-slate-200 bg-white hover:border-sky-400 text-left transition cursor-pointer shadow-2xs flex flex-col gap-1"
                      >
                        <div className="flex items-center gap-1">
                          {th.colors.slice(0, 3).map((c, i) => (
                            <span
                              key={i}
                              className="w-3 h-3 rounded-full border border-slate-200"
                              style={{ backgroundColor: c }}
                            />
                          ))}
                        </div>
                        <span className="text-[10px] font-bold text-slate-700 truncate">
                          {th.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Warna Kerah / Rib */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">
                    Warna Kerah / Rib Leher:
                  </span>
                  <input
                    type="color"
                    value={
                      jerseyConfig.collarColor && jerseyConfig.collarColor !== 'auto'
                        ? jerseyConfig.collarColor
                        : '#1a1a1a'
                    }
                    onChange={(e) => updateField('collarColor', e.target.value)}
                    className="w-8 h-8 rounded-lg cursor-pointer border border-slate-300 shadow-xs"
                  />
                </div>
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  {['#111827', '#ffffff', '#1e3a8a', '#dc2626', '#16a34a', '#eab308'].map(
                    (hex) => (
                      <button
                        key={hex}
                        type="button"
                        onClick={() => updateField('collarColor', hex)}
                        className="w-6 h-6 rounded-full border border-slate-300 shadow-2xs hover:scale-110 transition cursor-pointer"
                        style={{ backgroundColor: hex }}
                      />
                    )
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Traditional Solid / Part Colors if no template is chosen */
            <>
              {/* Part selector */}
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
            </>
          )}
        </div>
      )}

      {/* TAB 4: ROSTER TIM (MULTI-PEMAIN) */}
      {activeTab === 'roster' && (
        <div className="space-y-4">
          {/* Header & Quick Action Buttons */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <span>Daftar Pemain Tim</span>
                  <span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 font-bold text-[10px]">
                    {jerseyConfig.roster?.length || 1} pcs
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Nama, nomor & ukuran tiap anggota tim
                </p>
              </div>

              {jerseyConfig.roster && jerseyConfig.roster.length > 1 && (
                <button
                  type="button"
                  onClick={handleResetRoster}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                  title="Reset Roster"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsRosterModalOpen(true)}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Import Excel / Teks</span>
              </button>

              <button
                type="button"
                onClick={handleAddRosterPlayer}
                className="flex items-center gap-1 px-3 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah</span>
              </button>
            </div>
          </div>

          {/* Size Breakdown Summary Chips */}
          {jerseyConfig.roster && jerseyConfig.roster.length > 0 && (
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Rincian Ukuran Pesanan:
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(['S', 'M', 'L', 'XL', 'XXL', '3XL'] as ShirtSize[]).map((sz) => {
                  const count = (jerseyConfig.roster || []).filter((p) => p.size === sz).length;
                  if (count === 0) return null;
                  return (
                    <span
                      key={sz}
                      className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[11px] font-bold text-slate-700 shadow-2xs flex items-center gap-1"
                    >
                      <span className="text-sky-700">{sz}:</span>
                      <span>{count} pcs</span>
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Player List */}
          <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
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
            ).map((player, idx) => {
              const isCurrentlyPreviewed =
                jerseyConfig.playerName === player.name &&
                jerseyConfig.playerNumber === player.number;

              return (
                <div
                  key={player.id}
                  className={`p-2.5 rounded-xl border transition-all flex items-center gap-2 ${
                    isCurrentlyPreviewed
                      ? 'bg-sky-50/70 border-sky-300 shadow-xs ring-1 ring-sky-300'
                      : 'bg-white border-slate-200 shadow-2xs hover:border-slate-300'
                  }`}
                >
                  {/* Preview on 3D Viewer Button */}
                  <button
                    type="button"
                    onClick={() => handlePreviewPlayerIn3D(player)}
                    title={isCurrentlyPreviewed ? 'Sedang tampil di 3D' : 'Klik untuk tampilkan pemain ini di 3D'}
                    className={`p-1.5 rounded-lg transition cursor-pointer ${
                      isCurrentlyPreviewed
                        ? 'bg-sky-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-sky-600 hover:bg-slate-100'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>

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
                    className="flex-1 min-w-0 px-2 py-1 rounded-lg border border-slate-200 text-xs font-bold uppercase tracking-wider bg-white"
                  />

                  <input
                    type="text"
                    value={player.number}
                    onChange={(e) =>
                      handleUpdateRosterPlayer(player.id, 'number', e.target.value.replace(/\D/g, ''))
                    }
                    placeholder="No"
                    maxLength={3}
                    className="w-12 px-1.5 py-1 rounded-lg border border-slate-200 text-xs font-bold text-center bg-white"
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
              );
            })}
          </div>

          <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2">
            <span>
              💡 <b>Tips:</b> Klik ikon mata <b>👁️</b> pada pemain untuk melihat jersey miliknya langsung di model 3D! Total pesanan ({jerseyConfig.roster?.length || 1} pcs) otomatis mendapatkan diskon grosir.
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

      {/* Jersey Roster Quick Import Modal */}
      <JerseyRosterImportModal
        isOpen={isRosterModalOpen}
        onClose={() => setIsRosterModalOpen(false)}
        onApplyRoster={handleApplyImportedRoster}
        existingCount={jerseyConfig.roster?.length || 0}
      />
    </div>
  );
};

