import React, { useState } from 'react';
import type {
  MaterialOption,
  PrintTechnique,
  PrintZonePreset,
  ShirtColor,
  ViewAngle,
} from '../types';
import type { ProductDatabaseState } from '../services/pricingStorage';
import {
  saveProductDatabase,
  resetProductDatabase,
  exportDatabaseToJson,
  importDatabaseFromJson,
  setAdminPin,
  getAdminPin,
  verifyAdminPin,
} from '../services/pricingStorage';
import { getAppsScriptUrl, setAppsScriptUrl } from '../services/driveUploader';
import {
  getSupabaseConfig,
  setSupabaseConfig,
  isSupabaseConfigured,
  saveCatalogToSupabase,
} from '../services/supabaseClient';
import { OrderListManager } from './admin/OrderListManager';
import { ReportingManager } from './admin/ReportingManager';
import {
  Layers,
  Printer,
  Maximize2,
  Palette,
  Database,
  Plus,
  Trash2,
  Edit2,
  RotateCcw,
  Download,
  Upload,
  X,
  Lock,
  ArrowLeft,
  CheckCircle2,
  LogOut,
  ExternalLink,
  ShieldCheck,
  KeyRound,
  ShoppingBag,
  BarChart3,
  Globe,
} from 'lucide-react';

interface AdminDashboardProps {
  db: ProductDatabaseState;
  onUpdateDb: (newDb: ProductDatabaseState) => void;
  onNavigateToStudio: () => void;
}

type AdminSection = 'orders' | 'reporting' | 'products';
type AdminTab = 'materials' | 'techniques' | 'zones' | 'colors' | 'settings';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  db,
  onUpdateDb,
  onNavigateToStudio,
}) => {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('customkaos_admin_auth') === 'true';
  });

  const [loginPin, setLoginPin] = useState('');
  const [loginError, setLoginError] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyAdminPin(loginPin)) {
      setIsAuthenticated(true);
      sessionStorage.setItem('customkaos_admin_auth', 'true');
      setLoginError(false);
      setLoginPin('');
    } else {
      setLoginError(true);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('customkaos_admin_auth');
  };

  const [activeSection, setActiveSection] = useState<AdminSection>('orders');
  const [activeTab, setActiveTab] = useState<AdminTab>('materials');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // ==========================================
  // 1. MATERIAL CRUD
  // ==========================================
  const [editingMaterial, setEditingMaterial] = useState<MaterialOption | null>(null);
  const [isAddingMaterial, setIsAddingMaterial] = useState(false);
  const [materialForm, setMaterialForm] = useState<Partial<MaterialOption>>({
    name: '',
    gsm: '160 gsm',
    basePrice: 50000,
    description: '',
    badge: '',
  });

  const handleSaveMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!materialForm.name || !materialForm.basePrice) return;

    let updatedMaterials: MaterialOption[];
    if (editingMaterial) {
      updatedMaterials = db.materials.map((m) =>
        m.id === editingMaterial.id
          ? {
              ...m,
              name: materialForm.name!,
              gsm: materialForm.gsm || '160 gsm',
              basePrice: Number(materialForm.basePrice),
              description: materialForm.description || '',
              badge: materialForm.badge || undefined,
            }
          : m
      );
      showToast(`Bahan "${materialForm.name}" berhasil diperbarui!`);
    } else {
      const newId = `mat-${Date.now()}`;
      const newMat: MaterialOption = {
        id: newId,
        name: materialForm.name!,
        gsm: materialForm.gsm || '160 gsm',
        basePrice: Number(materialForm.basePrice),
        description: materialForm.description || '',
        badge: materialForm.badge || undefined,
      };
      updatedMaterials = [...db.materials, newMat];
      showToast(`Bahan "${materialForm.name}" berhasil ditambahkan!`);
    }

    const newDb = { ...db, materials: updatedMaterials };
    saveProductDatabase(newDb);
    onUpdateDb(newDb);
    setEditingMaterial(null);
    setIsAddingMaterial(false);
    setMaterialForm({ name: '', gsm: '160 gsm', basePrice: 50000, description: '', badge: '' });
  };

  const handleDeleteMaterial = (id: string, name: string) => {
    if (db.materials.length <= 1) {
      alert('Minimal harus ada 1 bahan aktif di database!');
      return;
    }
    if (confirm(`Yakin ingin menghapus bahan "${name}" dari database?`)) {
      const updatedMaterials = db.materials.filter((m) => m.id !== id);
      const newDb = { ...db, materials: updatedMaterials };
      saveProductDatabase(newDb);
      onUpdateDb(newDb);
      showToast(`Bahan "${name}" telah dihapus.`);
    }
  };

  // ==========================================
  // 2. PRINT TECHNIQUE CRUD
  // ==========================================
  const [editingTechnique, setEditingTechnique] = useState<PrintTechnique | null>(null);
  const [isAddingTechnique, setIsAddingTechnique] = useState(false);
  const [techniqueForm, setTechniqueForm] = useState<Partial<PrintTechnique>>({
    name: '',
    baseCost: 15000,
    minQty: 1,
    badge: '',
    description: '',
    bestFor: '',
  });

  const handleSaveTechnique = (e: React.FormEvent) => {
    e.preventDefault();
    if (!techniqueForm.name || techniqueForm.baseCost === undefined) return;

    let updatedTechs: PrintTechnique[];
    if (editingTechnique) {
      updatedTechs = db.techniques.map((t) =>
        t.id === editingTechnique.id
          ? {
              ...t,
              name: techniqueForm.name!,
              baseCost: Number(techniqueForm.baseCost),
              minQty: Number(techniqueForm.minQty) || 1,
              badge: techniqueForm.badge || '',
              description: techniqueForm.description || '',
              bestFor: techniqueForm.bestFor || '',
            }
          : t
      );
      showToast(`Teknik "${techniqueForm.name}" berhasil diperbarui!`);
    } else {
      const newId = `tech-${Date.now()}`;
      const newTech: PrintTechnique = {
        id: newId,
        name: techniqueForm.name!,
        baseCost: Number(techniqueForm.baseCost),
        minQty: Number(techniqueForm.minQty) || 1,
        badge: techniqueForm.badge || '',
        description: techniqueForm.description || '',
        bestFor: techniqueForm.bestFor || '',
      };
      updatedTechs = [...db.techniques, newTech];
      showToast(`Teknik "${techniqueForm.name}" berhasil ditambahkan!`);
    }

    const newDb = { ...db, techniques: updatedTechs };
    saveProductDatabase(newDb);
    onUpdateDb(newDb);
    setEditingTechnique(null);
    setIsAddingTechnique(false);
    setTechniqueForm({ name: '', baseCost: 15000, minQty: 1, badge: '', description: '', bestFor: '' });
  };

  const handleDeleteTechnique = (id: string, name: string) => {
    if (db.techniques.length <= 1) {
      alert('Minimal harus ada 1 teknik sablon di database!');
      return;
    }
    if (confirm(`Yakin ingin menghapus teknik sablon "${name}"?`)) {
      const updated = db.techniques.filter((t) => t.id !== id);
      const newDb = { ...db, techniques: updated };
      saveProductDatabase(newDb);
      onUpdateDb(newDb);
      showToast(`Teknik "${name}" telah dihapus.`);
    }
  };

  // ==========================================
  // 3. PRINT ZONES CRUD
  // ==========================================
  const [editingZone, setEditingZone] = useState<PrintZonePreset | null>(null);
  const [isAddingZone, setIsAddingZone] = useState(false);
  const [zoneViewFilter, setZoneViewFilter] = useState<ViewAngle | 'all'>('all');
  const [zoneForm, setZoneForm] = useState<Partial<PrintZonePreset>>({
    name: '',
    dimensions: '21 x 30 cm',
    cost: 20000,
    view: 'front',
    defaultX: 50,
    defaultY: 46,
    defaultWidth: 28,
    defaultHeight: 34,
    description: '',
  });

  const handleSaveZone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!zoneForm.name || zoneForm.cost === undefined) return;

    let updatedZones: PrintZonePreset[];
    if (editingZone) {
      updatedZones = db.printZones.map((z) =>
        z.id === editingZone.id
          ? {
              ...z,
              name: zoneForm.name!,
              dimensions: zoneForm.dimensions || '20 x 20 cm',
              cost: Number(zoneForm.cost),
              view: zoneForm.view || 'front',
              defaultX: Number(zoneForm.defaultX) || 50,
              defaultY: Number(zoneForm.defaultY) || 50,
              defaultWidth: Number(zoneForm.defaultWidth) || 28,
              defaultHeight: Number(zoneForm.defaultHeight) || 30,
              description: zoneForm.description || '',
            }
          : z
      );
      showToast(`Tarif area "${zoneForm.name}" berhasil diupdate!`);
    } else {
      const newId = `zone-${Date.now()}`;
      const newZone: PrintZonePreset = {
        id: newId,
        name: zoneForm.name!,
        dimensions: zoneForm.dimensions || '20 x 20 cm',
        cost: Number(zoneForm.cost),
        view: zoneForm.view || 'front',
        defaultX: Number(zoneForm.defaultX) || 50,
        defaultY: Number(zoneForm.defaultY) || 50,
        defaultWidth: Number(zoneForm.defaultWidth) || 28,
        defaultHeight: Number(zoneForm.defaultHeight) || 30,
        description: zoneForm.description || '',
      };
      updatedZones = [...db.printZones, newZone];
      showToast(`Area cetak "${zoneForm.name}" berhasil ditambahkan!`);
    }

    const newDb = { ...db, printZones: updatedZones };
    saveProductDatabase(newDb);
    onUpdateDb(newDb);
    setEditingZone(null);
    setIsAddingZone(false);
    setZoneForm({
      name: '',
      dimensions: '21 x 30 cm',
      cost: 20000,
      view: 'front',
      defaultX: 50,
      defaultY: 46,
      defaultWidth: 28,
      defaultHeight: 34,
      description: '',
    });
  };

  const handleDeleteZone = (id: string, name: string) => {
    if (db.printZones.length <= 1) {
      alert('Minimal harus ada 1 area cetak di database!');
      return;
    }
    if (confirm(`Yakin ingin menghapus area "${name}"?`)) {
      const updated = db.printZones.filter((z) => z.id !== id);
      const newDb = { ...db, printZones: updated };
      saveProductDatabase(newDb);
      onUpdateDb(newDb);
      showToast(`Area "${name}" telah dihapus.`);
    }
  };

  // ==========================================
  // 4. COLOR CRUD
  // ==========================================
  const [editingColor, setEditingColor] = useState<ShirtColor | null>(null);
  const [isAddingColor, setIsAddingColor] = useState(false);
  const [colorForm, setColorForm] = useState<Partial<ShirtColor>>({
    name: '',
    hex: '#1e3a8a',
    isDark: true,
  });

  const handleSaveColor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!colorForm.name || !colorForm.hex) return;

    let updatedColors: ShirtColor[];
    if (editingColor) {
      updatedColors = db.colors.map((c) =>
        c.id === editingColor.id
          ? {
              ...c,
              name: colorForm.name!,
              hex: colorForm.hex!,
              isDark: !!colorForm.isDark,
            }
          : c
      );
      showToast(`Warna "${colorForm.name}" berhasil diperbarui!`);
    } else {
      const newId = `color-${Date.now()}`;
      const newCol: ShirtColor = {
        id: newId,
        name: colorForm.name!,
        hex: colorForm.hex!,
        isDark: !!colorForm.isDark,
      };
      updatedColors = [...db.colors, newCol];
      showToast(`Warna "${colorForm.name}" berhasil ditambahkan!`);
    }

    const newDb = { ...db, colors: updatedColors };
    saveProductDatabase(newDb);
    onUpdateDb(newDb);
    setEditingColor(null);
    setIsAddingColor(false);
    setColorForm({ name: '', hex: '#1e3a8a', isDark: true });
  };

  const handleDeleteColor = (id: string, name: string) => {
    if (db.colors.length <= 1) {
      alert('Minimal harus ada 1 warna kaos di database!');
      return;
    }
    if (confirm(`Hapus warna "${name}" dari pilihan kaos?`)) {
      const updated = db.colors.filter((c) => c.id !== id);
      const newDb = { ...db, colors: updated };
      saveProductDatabase(newDb);
      onUpdateDb(newDb);
      showToast(`Warna "${name}" telah dihapus.`);
    }
  };

  // ==========================================
  // 5. DATABASE SETTINGS & BACKUP
  // ==========================================
  const [pinChangeCurrent, setPinChangeCurrent] = useState('');
  const [pinChangeNew, setPinChangeNew] = useState('');
  const [driveScriptUrl, setDriveScriptUrl] = useState(() => getAppsScriptUrl());

  const handleSaveDriveUrl = () => {
    setAppsScriptUrl(driveScriptUrl);
    showToast('URL Google Apps Script berhasil disimpan!');
  };

  const initialSb = getSupabaseConfig();
  const [sbUrl, setSbUrl] = useState(initialSb.url);
  const [sbKey, setSbKey] = useState(initialSb.key);
  const [isSyncingSb, setIsSyncingSb] = useState(false);

  const handleSaveSupabaseConfig = async () => {
    setSupabaseConfig(sbUrl, sbKey);
    setIsSyncingSb(true);
    const ok = await saveCatalogToSupabase(db);
    setIsSyncingSb(false);
    if (ok) {
      showToast('Koneksi Supabase aktif & katalog berhasil disinkronkan ke cloud!');
    } else {
      showToast('Kredensial disimpan! Pastikan tabel di Supabase sudah dibuat.');
    }
  };

  const handleChangePin = (e: React.FormEvent) => {
    e.preventDefault();
    const currentPin = getAdminPin();
    if (pinChangeCurrent.trim() !== currentPin.trim()) {
      alert('PIN lama salah!');
      return;
    }
    if (pinChangeNew.length < 4) {
      alert('PIN baru minimal 4 karakter!');
      return;
    }
    setAdminPin(pinChangeNew.trim());
    setPinChangeCurrent('');
    setPinChangeNew('');
    showToast('PIN Admin berhasil diubah!');
  };

  const handleExportBackup = () => {
    const jsonStr = exportDatabaseToJson(db);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customkaos-db-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    showToast('Backup database JSON berhasil di-download!');
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const importedDb = importDatabaseFromJson(content);
        onUpdateDb(importedDb);
        showToast('Database berhasil di-restore dari file JSON!');
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : 'Gagal import file database.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleResetToDefault = () => {
    if (
      confirm(
        'PERINGATAN: Semua harga, bahan, teknik, dan warna akan dikembalikan ke data default bawaan. Lanjutkan?'
      )
    ) {
      const restored = resetProductDatabase();
      onUpdateDb(restored);
      showToast('Database berhasil di-reset ke data bawaan awal!');
    }
  };

  // =========================================================================
  // SCREEN 1: DEDICATED ADMIN LOGIN PORTAL (if not authenticated)
  // =========================================================================
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 selection:bg-sky-500 selection:text-white">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          {/* Subtle top glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-transparent via-sky-500 to-transparent" />

          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white mx-auto mb-3 shadow-lg shadow-sky-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h1 className="text-lg sm:text-xl font-black text-white tracking-tight">
              CustomKaos <span className="text-sky-400">Admin</span> Portal
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Halaman khusus pengelola untuk mengatur harga & opsi produk
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                PIN Keamanan Admin
              </label>
              <div className="relative">
                <input
                  type="password"
                  autoFocus
                  required
                  value={loginPin}
                  onChange={(e) => {
                    setLoginPin(e.target.value);
                    if (loginError) setLoginError(false);
                  }}
                  placeholder="Ketik 4-digit PIN..."
                  className={`w-full text-center text-xl tracking-widest font-mono py-3 px-4 rounded-xl border bg-slate-800/80 text-white placeholder-slate-500 transition focus:outline-hidden ${
                    loginError
                      ? 'border-rose-500 ring-2 ring-rose-500/30 text-rose-300'
                      : 'border-slate-700 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20'
                  }`}
                />
                <KeyRound className="w-4 h-4 text-slate-500 absolute right-3.5 top-3.5 pointer-events-none" />
              </div>

              {loginError && (
                <p className="text-xs text-rose-400 font-semibold mt-1.5 text-center animate-shake">
                  PIN salah! (PIN default bawaan: <strong className="font-mono">1234</strong>)
                </p>
              )}
            </div>

            <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-750 text-[11px] text-slate-400 text-center">
              💡 PIN default saat ini: <strong className="font-mono text-sky-400">1234</strong>
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-sky-600/20 cursor-pointer"
            >
              Masuk ke Admin Dashboard
            </button>
          </form>

          {/* Footer Navigation */}
          <div className="mt-6 pt-5 border-t border-slate-800 text-center">
            <button
              onClick={onNavigateToStudio}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Website / Studio Kaos</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // SCREEN 2: FULL-PAGE STANDALONE ADMIN DASHBOARD (Authenticated)
  // =========================================================================
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row font-sans selection:bg-sky-500 selection:text-white">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex w-64 bg-slate-900 text-white flex-col justify-between border-r border-slate-800 sticky top-0 h-screen z-30 flex-shrink-0">
        <div>
          {/* Brand */}
          <div className="p-5 border-b border-slate-800 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <div className="font-black text-sm text-white tracking-tight flex items-center gap-1.5">
                <span>CustomKaos</span>
                <span className="text-sky-400">Admin</span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono">PORTAL /adm</p>
            </div>
          </div>

          {/* Navigation Menus */}
          <nav className="p-3 space-y-1.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3 py-1">
              Navigasi Admin
            </div>

            {/* 1. OrderList */}
            <button
              onClick={() => setActiveSection('orders')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeSection === 'orders'
                  ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <ShoppingBag className="w-4 h-4" />
                <span>1. OrderList</span>
              </div>
            </button>

            {/* 2. Reporting */}
            <button
              onClick={() => setActiveSection('reporting')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeSection === 'reporting'
                  ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <BarChart3 className="w-4 h-4" />
                <span>2. Reporting</span>
              </div>
            </button>

            {/* 3. Product Database */}
            <button
              onClick={() => setActiveSection('products')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeSection === 'products'
                  ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Database className="w-4 h-4" />
                <span>3. Product Database</span>
              </div>
            </button>
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-slate-800 space-y-1.5">
          <button
            onClick={onNavigateToStudio}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition"
          >
            <ExternalLink className="w-4 h-4 text-sky-400" />
            <span>Lihat Studio Kaos</span>
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-rose-300 hover:bg-rose-950/40 hover:text-rose-200 transition"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar / Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Topbar */}
      <div className="md:hidden bg-slate-900 text-white p-3 border-b border-slate-800 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-sky-600 flex items-center justify-center text-white font-bold text-xs">
            CK
          </div>
          <span className="font-bold text-sm">CustomKaos Admin</span>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={activeSection}
            onChange={(e) => setActiveSection(e.target.value as AdminSection)}
            className="bg-slate-800 text-white text-xs py-1.5 px-2.5 rounded-lg border border-slate-700 font-semibold"
          >
            <option value="orders">1. OrderList</option>
            <option value="reporting">2. Reporting</option>
            <option value="products">3. Product Database</option>
          </select>
          <button
            onClick={onNavigateToStudio}
            className="p-1.5 bg-slate-800 rounded-lg text-slate-300 text-xs"
            title="Studio"
          >
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content Column */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Header Bar for Desktop */}
        <header className="hidden md:flex bg-white border-b border-slate-200 px-6 py-3.5 items-center justify-between sticky top-0 z-20 shadow-2xs">
          <div className="text-xs font-semibold text-slate-500">
            Admin Panel /{' '}
            <span className="text-slate-900 font-bold">
              {activeSection === 'orders'
                ? '1. Daftar Pesanan Masuk (OrderList)'
                : activeSection === 'reporting'
                ? '2. Laporan Penjualan (Reporting)'
                : '3. Database Produk & Tarif (Product Database)'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-slate-400">PIN Keamanan: Aktif</span>
            <button
              onClick={onNavigateToStudio}
              className="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1 cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Buka Studio Pelanggan</span>
            </button>
          </div>
        </header>

        {/* Content Area */}
        <main className="p-4 sm:p-6 lg:p-8 flex-1 space-y-6">
          {/* SECTION 1: ORDER LIST */}
          {activeSection === 'orders' && <OrderListManager />}

          {/* SECTION 2: REPORTING */}
          {activeSection === 'reporting' && <ReportingManager />}

          {/* SECTION 3: PRODUCT DATABASE */}
          {activeSection === 'products' && (
            <div className="space-y-4">
              {/* Product Database Sub-Navigation Tabs */}
              <div className="bg-white rounded-2xl p-1.5 shadow-sm border border-slate-200 flex items-center gap-1 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setActiveTab('materials')}
            className={`flex items-center gap-2 py-2.5 px-3.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeTab === 'materials'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Layers className="w-4 h-4 text-sky-400" />
            <span>1. Bahan Kaos ({db.materials.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('techniques')}
            className={`flex items-center gap-2 py-2.5 px-3.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeTab === 'techniques'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Printer className="w-4 h-4 text-indigo-400" />
            <span>2. Teknik Sablon ({db.techniques.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('zones')}
            className={`flex items-center gap-2 py-2.5 px-3.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeTab === 'zones'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Maximize2 className="w-4 h-4 text-emerald-400" />
            <span>3. Area & Tarif Cetak ({db.printZones.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('colors')}
            className={`flex items-center gap-2 py-2.5 px-3.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeTab === 'colors'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Palette className="w-4 h-4 text-amber-400" />
            <span>4. Varian Warna ({db.colors.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 py-2.5 px-3.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Database className="w-4 h-4 text-purple-400" />
            <span>Backup & Cloud DB</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200">
          {/* ========================================================= */}
          {/* TAB 1: BAHAN KAOS                                         */}
          {/* ========================================================= */}
          {activeTab === 'materials' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">
                    Katalog Bahan Kain Kaos
                  </h3>
                  <p className="text-xs text-slate-500">
                    Ubah harga dasar kain (base price) atau tambah bahan kain baru
                  </p>
                </div>
                {!isAddingMaterial && !editingMaterial && (
                  <button
                    onClick={() => {
                      setMaterialForm({
                        name: '',
                        gsm: '160 gsm',
                        basePrice: 55000,
                        description: '',
                        badge: '',
                      });
                      setIsAddingMaterial(true);
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Tambah Bahan Baru</span>
                  </button>
                )}
              </div>

              {/* Add / Edit Form */}
              {(isAddingMaterial || editingMaterial) && (
                <form
                  onSubmit={handleSaveMaterial}
                  className="bg-sky-50/40 p-4 sm:p-5 rounded-2xl border border-sky-300 shadow-sm space-y-3 animate-in fade-in duration-150"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-sky-200">
                    <span className="text-xs font-bold text-sky-950">
                      {editingMaterial ? 'Edit Bahan Kaos' : 'Tambah Bahan Kaos Baru'}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingMaterial(null);
                        setIsAddingMaterial(false);
                      }}
                      className="text-slate-400 hover:text-slate-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                        Nama Bahan
                      </label>
                      <input
                        type="text"
                        required
                        value={materialForm.name || ''}
                        onChange={(e) => setMaterialForm({ ...materialForm, name: e.target.value })}
                        placeholder="Contoh: Cotton Combed 28s"
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white focus:border-sky-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                        Harga Dasar (Rp)
                      </label>
                      <input
                        type="number"
                        required
                        min="1000"
                        step="500"
                        value={materialForm.basePrice || ''}
                        onChange={(e) =>
                          setMaterialForm({ ...materialForm, basePrice: parseInt(e.target.value) || 0 })
                        }
                        placeholder="55000"
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white focus:border-sky-500 font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                        Ketebalan / GSM
                      </label>
                      <input
                        type="text"
                        value={materialForm.gsm || ''}
                        onChange={(e) => setMaterialForm({ ...materialForm, gsm: e.target.value })}
                        placeholder="180 - 190 gsm"
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white focus:border-sky-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                        Deskripsi Bahan
                      </label>
                      <input
                        type="text"
                        value={materialForm.description || ''}
                        onChange={(e) =>
                          setMaterialForm({ ...materialForm, description: e.target.value })
                        }
                        placeholder="Kain adem, tidak mudah kusut, cocok untuk sablon DTF..."
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white focus:border-sky-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                        Badge (Opsional)
                      </label>
                      <input
                        type="text"
                        value={materialForm.badge || ''}
                        onChange={(e) => setMaterialForm({ ...materialForm, badge: e.target.value })}
                        placeholder="Best Seller / Premium"
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white focus:border-sky-500"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingMaterial(null);
                        setIsAddingMaterial(false);
                      }}
                      className="px-3.5 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl transition shadow-xs cursor-pointer"
                    >
                      {editingMaterial ? 'Simpan Perubahan' : 'Tambahkan Bahan'}
                    </button>
                  </div>
                </form>
              )}

              {/* Material List Table */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 uppercase text-[10px] tracking-wider font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Nama Bahan</th>
                      <th className="py-3 px-4">GSM</th>
                      <th className="py-3 px-4">Harga Dasar</th>
                      <th className="py-3 px-4 hidden md:table-cell">Deskripsi</th>
                      <th className="py-3 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150">
                    {db.materials.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-4 font-bold text-slate-900">
                          <div className="flex items-center gap-1.5">
                            <span>{m.name}</span>
                            {m.badge && (
                              <span className="text-[9px] bg-sky-100 text-sky-700 px-1.5 py-0.5 rounded font-semibold">
                                {m.badge}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">{m.gsm}</td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          Rp {m.basePrice.toLocaleString('id-ID')}
                        </td>
                        <td className="py-3 px-4 text-slate-500 text-[11px] hidden md:table-cell max-w-xs truncate">
                          {m.description}
                        </td>
                        <td className="py-3 px-4 text-right space-x-1">
                          <button
                            onClick={() => {
                              setEditingMaterial(m);
                              setIsAddingMaterial(false);
                              setMaterialForm({ ...m });
                            }}
                            className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition cursor-pointer"
                            title="Edit Bahan"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteMaterial(m.id, m.name)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title="Hapus Bahan"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: TEKNIK SABLON                                      */}
          {/* ========================================================= */}
          {activeTab === 'techniques' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">
                    Katalog Biaya Teknik Sablon
                  </h3>
                  <p className="text-xs text-slate-500">
                    Atur biaya dasar per teknik sablon dan minimal order (min qty)
                  </p>
                </div>
                {!isAddingTechnique && !editingTechnique && (
                  <button
                    onClick={() => {
                      setTechniqueForm({
                        name: '',
                        baseCost: 20000,
                        minQty: 1,
                        badge: 'Digital',
                        description: '',
                        bestFor: '',
                      });
                      setIsAddingTechnique(true);
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Tambah Teknik Baru</span>
                  </button>
                )}
              </div>

              {/* Form Add/Edit Technique */}
              {(isAddingTechnique || editingTechnique) && (
                <form
                  onSubmit={handleSaveTechnique}
                  className="bg-indigo-50/40 p-4 sm:p-5 rounded-2xl border border-indigo-300 shadow-sm space-y-3 animate-in fade-in duration-150"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-indigo-200">
                    <span className="text-xs font-bold text-indigo-950">
                      {editingTechnique ? 'Edit Teknik Sablon' : 'Tambah Teknik Sablon Baru'}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingTechnique(null);
                        setIsAddingTechnique(false);
                      }}
                      className="text-slate-400 hover:text-slate-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                        Nama Teknik
                      </label>
                      <input
                        type="text"
                        required
                        value={techniqueForm.name || ''}
                        onChange={(e) =>
                          setTechniqueForm({ ...techniqueForm, name: e.target.value })
                        }
                        placeholder="Contoh: Bordir Komputer"
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                        Biaya Dasar Sablon (Rp)
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        step="500"
                        value={techniqueForm.baseCost || ''}
                        onChange={(e) =>
                          setTechniqueForm({
                            ...techniqueForm,
                            baseCost: parseInt(e.target.value) || 0,
                          })
                        }
                        placeholder="20000"
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white focus:border-indigo-500 font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                        Min. Order (Qty)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={techniqueForm.minQty || 1}
                        onChange={(e) =>
                          setTechniqueForm({ ...techniqueForm, minQty: parseInt(e.target.value) || 1 })
                        }
                        placeholder="1"
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white focus:border-indigo-500 font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                        Badge / Label
                      </label>
                      <input
                        type="text"
                        value={techniqueForm.badge || ''}
                        onChange={(e) =>
                          setTechniqueForm({ ...techniqueForm, badge: e.target.value })
                        }
                        placeholder="Best Seller / Presisi"
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white focus:border-indigo-500"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                        Cocok Untuk (Best For)
                      </label>
                      <input
                        type="text"
                        value={techniqueForm.bestFor || ''}
                        onChange={(e) =>
                          setTechniqueForm({ ...techniqueForm, bestFor: e.target.value })
                        }
                        placeholder="Logo dada, tulisan tipografi, nomor punggung..."
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                      Deskripsi Teknik
                    </label>
                    <input
                      type="text"
                      value={techniqueForm.description || ''}
                      onChange={(e) =>
                        setTechniqueForm({ ...techniqueForm, description: e.target.value })
                      }
                      placeholder="Penjelasan kelebihan teknik sablon ini..."
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white focus:border-indigo-500"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingTechnique(null);
                        setIsAddingTechnique(false);
                      }}
                      className="px-3.5 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-xs cursor-pointer"
                    >
                      {editingTechnique ? 'Simpan Perubahan' : 'Tambahkan Teknik'}
                    </button>
                  </div>
                </form>
              )}

              {/* Techniques Table */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 uppercase text-[10px] tracking-wider font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Nama Teknik</th>
                      <th className="py-3 px-4">Biaya Dasar</th>
                      <th className="py-3 px-4">Min Qty</th>
                      <th className="py-3 px-4 hidden md:table-cell">Cocok Untuk</th>
                      <th className="py-3 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150">
                    {db.techniques.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-4 font-bold text-slate-900">
                          <div className="flex items-center gap-1.5">
                            <span>{t.name}</span>
                            {t.badge && (
                              <span className="text-[9px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-semibold">
                                {t.badge}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-indigo-700">
                          Rp {t.baseCost.toLocaleString('id-ID')}
                        </td>
                        <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                          {t.minQty} pcs
                        </td>
                        <td className="py-3 px-4 text-slate-500 text-[11px] hidden md:table-cell max-w-xs truncate">
                          {t.bestFor || t.description}
                        </td>
                        <td className="py-3 px-4 text-right space-x-1">
                          <button
                            onClick={() => {
                              setEditingTechnique(t);
                              setIsAddingTechnique(false);
                              setTechniqueForm({ ...t });
                            }}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                            title="Edit Teknik"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteTechnique(t.id, t.name)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title="Hapus Teknik"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 3: AREA & TARIF CETAK                                 */}
          {/* ========================================================= */}
          {activeTab === 'zones' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">
                    Tarif Sablon Berdasarkan Area & Ukuran
                  </h3>
                  <p className="text-xs text-slate-500">
                    Sesuaikan tarif cetak untuk ukuran A4, A3, Logo Dada, atau buat area sablon kustom
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={zoneViewFilter}
                    onChange={(e) => setZoneViewFilter(e.target.value as ViewAngle | 'all')}
                    className="text-xs py-2 px-3 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="all">Semua Sisi</option>
                    <option value="front">Sisi Depan</option>
                    <option value="back">Sisi Belakang</option>
                    <option value="sleeve-left">Lengan Kiri</option>
                    <option value="sleeve-right">Lengan Kanan</option>
                  </select>

                  {!isAddingZone && !editingZone && (
                    <button
                      onClick={() => {
                        setZoneForm({
                          name: '',
                          dimensions: '21 x 30 cm',
                          cost: 20000,
                          view: 'front',
                          defaultX: 50,
                          defaultY: 46,
                          defaultWidth: 28,
                          defaultHeight: 34,
                          description: '',
                        });
                        setIsAddingZone(true);
                      }}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Tambah Area</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Form Add/Edit Print Zone */}
              {(isAddingZone || editingZone) && (
                <form
                  onSubmit={handleSaveZone}
                  className="bg-emerald-50/40 p-4 sm:p-5 rounded-2xl border border-emerald-300 shadow-sm space-y-3 animate-in fade-in duration-150"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-emerald-200">
                    <span className="text-xs font-bold text-emerald-950">
                      {editingZone ? 'Edit Tarif & Area Cetak' : 'Tambah Area Cetak Baru'}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingZone(null);
                        setIsAddingZone(false);
                      }}
                      className="text-slate-400 hover:text-slate-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div className="sm:col-span-2">
                      <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                        Nama Area
                      </label>
                      <input
                        type="text"
                        required
                        value={zoneForm.name || ''}
                        onChange={(e) => setZoneForm({ ...zoneForm, name: e.target.value })}
                        placeholder="Contoh: A4 Depan Tengah"
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                        Dimensi Fisik
                      </label>
                      <input
                        type="text"
                        value={zoneForm.dimensions || ''}
                        onChange={(e) => setZoneForm({ ...zoneForm, dimensions: e.target.value })}
                        placeholder="21 x 30 cm"
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white focus:border-emerald-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                        Biaya Tambahan (Rp)
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        step="500"
                        value={zoneForm.cost || ''}
                        onChange={(e) =>
                          setZoneForm({ ...zoneForm, cost: parseInt(e.target.value) || 0 })
                        }
                        placeholder="20000"
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white focus:border-emerald-500 font-mono font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                        Sisi Kaos
                      </label>
                      <select
                        value={zoneForm.view || 'front'}
                        onChange={(e) =>
                          setZoneForm({ ...zoneForm, view: e.target.value as ViewAngle })
                        }
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white focus:border-emerald-500"
                      >
                        <option value="front">Tampak Depan (Front)</option>
                        <option value="back">Tampak Belakang (Back)</option>
                        <option value="sleeve-left">Lengan (Sleeve)</option>
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                        Keterangan Area
                      </label>
                      <input
                        type="text"
                        value={zoneForm.description || ''}
                        onChange={(e) =>
                          setZoneForm({ ...zoneForm, description: e.target.value })
                        }
                        placeholder="Standar cetak foto atau ilustrasi tengah dada"
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingZone(null);
                        setIsAddingZone(false);
                      }}
                      className="px-3.5 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition shadow-xs cursor-pointer"
                    >
                      {editingZone ? 'Simpan Tarif' : 'Tambahkan Area'}
                    </button>
                  </div>
                </form>
              )}

              {/* Zones Table */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 uppercase text-[10px] tracking-wider font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Nama Area</th>
                      <th className="py-3 px-4">Sisi</th>
                      <th className="py-3 px-4">Dimensi</th>
                      <th className="py-3 px-4">Tarif Tambahan</th>
                      <th className="py-3 px-4 hidden md:table-cell">Keterangan</th>
                      <th className="py-3 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150">
                    {db.printZones
                      .filter((z) => (zoneViewFilter === 'all' ? true : z.view === zoneViewFilter))
                      .map((z) => (
                        <tr key={z.id} className="hover:bg-slate-50/80 transition">
                          <td className="py-3 px-4 font-bold text-slate-900">{z.name}</td>
                          <td className="py-3 px-4">
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold uppercase">
                              {z.view}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                            {z.dimensions}
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-emerald-700">
                            + Rp {z.cost.toLocaleString('id-ID')}
                          </td>
                          <td className="py-3 px-4 text-slate-500 text-[11px] hidden md:table-cell max-w-xs truncate">
                            {z.description}
                          </td>
                          <td className="py-3 px-4 text-right space-x-1">
                            <button
                              onClick={() => {
                                setEditingZone(z);
                                setIsAddingZone(false);
                                setZoneForm({ ...z });
                              }}
                              className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                              title="Edit Area & Tarif"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteZone(z.id, z.name)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                              title="Hapus Area"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 4: VARIAN WARNA                                       */}
          {/* ========================================================= */}
          {activeTab === 'colors' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">
                    Katalog Varian Warna Kaos
                  </h3>
                  <p className="text-xs text-slate-500">
                    Tambah atau hapus pilihan warna kain yang tersedia di stok toko Anda
                  </p>
                </div>
                {!isAddingColor && !editingColor && (
                  <button
                    onClick={() => {
                      setColorForm({ name: '', hex: '#2563eb', isDark: true });
                      setIsAddingColor(true);
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Tambah Warna Baru</span>
                  </button>
                )}
              </div>

              {/* Form Add/Edit Color */}
              {(isAddingColor || editingColor) && (
                <form
                  onSubmit={handleSaveColor}
                  className="bg-amber-50/40 p-4 sm:p-5 rounded-2xl border border-amber-300 shadow-sm space-y-3 animate-in fade-in duration-150"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-amber-200">
                    <span className="text-xs font-bold text-amber-950">
                      {editingColor ? 'Edit Varian Warna' : 'Tambah Warna Kaos Baru'}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingColor(null);
                        setIsAddingColor(false);
                      }}
                      className="text-slate-400 hover:text-slate-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                        Nama Warna
                      </label>
                      <input
                        type="text"
                        required
                        value={colorForm.name || ''}
                        onChange={(e) => setColorForm({ ...colorForm, name: e.target.value })}
                        placeholder="Contoh: Matcha Green"
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                        Pilih Kode Warna (HEX)
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={colorForm.hex || '#1e3a8a'}
                          onChange={(e) => setColorForm({ ...colorForm, hex: e.target.value })}
                          className="w-10 h-10 p-0.5 rounded-xl border border-slate-300 cursor-pointer"
                        />
                        <input
                          type="text"
                          required
                          value={colorForm.hex || ''}
                          onChange={(e) => setColorForm({ ...colorForm, hex: e.target.value })}
                          placeholder="#1e3a8a"
                          className="flex-1 text-xs p-2.5 rounded-xl border border-slate-300 bg-white font-mono font-bold"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                        Kategori Warna Kain
                      </label>
                      <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer pt-1">
                        <input
                          type="checkbox"
                          checked={colorForm.isDark}
                          onChange={(e) => setColorForm({ ...colorForm, isDark: e.target.checked })}
                          className="w-4 h-4 rounded text-amber-600 accent-amber-600"
                        />
                        <span>Warna Gelap (Dark Shirt)</span>
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingColor(null);
                        setIsAddingColor(false);
                      }}
                      className="px-3.5 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition shadow-xs cursor-pointer"
                    >
                      {editingColor ? 'Simpan Warna' : 'Tambahkan Warna'}
                    </button>
                  </div>
                </form>
              )}

              {/* Color Swatches Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {db.colors.map((c) => (
                  <div
                    key={c.id}
                    className="p-3 bg-white rounded-2xl border border-slate-200 flex items-center justify-between shadow-2xs hover:shadow-xs transition"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-8 h-8 rounded-xl border border-slate-300/80 shadow-inner flex-shrink-0"
                        style={{ backgroundColor: c.hex }}
                      />
                      <div>
                        <div className="text-xs font-bold text-slate-900">{c.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{c.hex}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingColor(c);
                          setIsAddingColor(false);
                          setColorForm({ ...c });
                        }}
                        className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                        title="Edit Warna"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteColor(c.id, c.name)}
                        className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                        title="Hapus Warna"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 5: BACKUP, SECURITY & SUPABASE INTEGRATION            */}
          {/* ========================================================= */}
          {activeTab === 'settings' && (
            <div className="space-y-6 max-w-3xl">
              {/* Backup & Restore Box */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-purple-600" />
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Cadangan Data (Backup & Restore JSON)
                  </h4>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Download seluruh daftar harga, kain, dan opsi saat ini ke file JSON untuk disimpan, atau upload file JSON untuk mengembalikan data kapan saja.
                </p>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    onClick={handleExportBackup}
                    className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Backup Database (JSON)</span>
                  </button>

                  <label className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition border border-slate-300 cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Restore dari File JSON</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportBackup}
                      className="hidden"
                    />
                  </label>

                  <button
                    onClick={handleResetToDefault}
                    className="flex items-center gap-1 px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold transition ml-auto cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset ke Data Awal</span>
                  </button>
                </div>
              </div>

              {/* Security PIN Change */}
              <form
                onSubmit={handleChangePin}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3"
              >
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-slate-700" />
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Keamanan: Ubah PIN Masuk Admin
                  </h4>
                </div>
                <p className="text-xs text-slate-500">
                  PIN saat ini secara default adalah <strong className="font-mono text-slate-800">1234</strong>. Anda dapat menggantinya untuk mengamankan halaman portal admin.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md pt-1">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                      PIN Lama
                    </label>
                    <input
                      type="password"
                      required
                      value={pinChangeCurrent}
                      onChange={(e) => setPinChangeCurrent(e.target.value)}
                      placeholder="PIN saat ini"
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                      PIN Baru (Min. 4 angka)
                    </label>
                    <input
                      type="password"
                      required
                      value={pinChangeNew}
                      onChange={(e) => setPinChangeNew(e.target.value)}
                      placeholder="PIN baru"
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-mono"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  Simpan PIN Baru
                </button>
              </form>

              {/* Google Drive Storage Config (Apps Script) */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-sky-600" />
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Google Drive Storage (Folder Otomatis per Order ID)
                  </h4>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Hubungkan ke Google Drive via Google Apps Script (gratis) agar setiap customer checkout, sistem otomatis membuat folder sesuai Order ID di Google Drive Anda yang berisi mockup, file desain asli, dan spesifikasi pesanan.
                </p>

                <div className="space-y-2 pt-1">
                  <label className="text-[11px] font-semibold text-slate-700 block">
                    Google Apps Script Web App URL
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={driveScriptUrl}
                      onChange={(e) => setDriveScriptUrl(e.target.value)}
                      placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                      className="flex-1 text-xs p-2.5 rounded-xl border border-slate-300 font-mono bg-white focus:outline-none focus:border-sky-500"
                    />
                    <button
                      type="button"
                      onClick={handleSaveDriveUrl}
                      className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                    >
                      Simpan
                    </button>
                  </div>
                  {driveScriptUrl ? (
                    <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Google Drive Storage aktif. Order baru akan otomatis diunggah ke Drive.</span>
                    </p>
                  ) : (
                    <p className="text-[10px] text-slate-400">
                      Opsional. Jika belum diisi, file tetap tersimpan di browser (localStorage) dan bisa diunduh via tombol "Download ZIP".
                    </p>
                  )}
                </div>

                <div className="bg-sky-50/70 p-3.5 rounded-xl border border-sky-200 text-[11px] text-slate-700 space-y-1.5">
                  <div className="font-bold text-sky-950">📋 Langkah Mudah Pasang Google Apps Script:</div>
                  <ol className="list-decimal list-inside space-y-0.5 text-slate-600">
                    <li>Buka <a href="https://script.google.com" target="_blank" rel="noreferrer" className="text-sky-700 underline font-semibold">script.google.com</a> &gt; klik <strong>New project</strong>.</li>
                    <li>Copy seluruh kode dari file <code className="bg-white px-1.5 py-0.5 rounded border border-sky-200 text-[10px] font-mono">google-apps-script/Code.gs</code> di repo ini, lalu paste ke Code.gs.</li>
                    <li>Klik <strong>Deploy &gt; New deployment &gt; Web app</strong>.</li>
                    <li>Set <em>Execute as:</em> <strong>Me</strong> dan <em>Who has access:</em> <strong>Anyone</strong>.</li>
                    <li>Klik <strong>Deploy</strong>, lalu salin URL Web App dan tempel pada form di atas.</li>
                  </ol>
                </div>
              </div>

              {/* Cloud Database (Supabase) Integration */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-emerald-600" />
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Cloud Database Global (Supabase / PostgreSQL)
                    </h4>
                  </div>
                  {isSupabaseConfigured() && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Terhubung ke Cloud</span>
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  Menghubungkan website ke Supabase cloud membuat perubahan harga, bahan, dan pesanan masuk tersinkronisasi secara real-time ke semua perangkat & pengunjung.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                      Project URL
                    </label>
                    <input
                      type="url"
                      value={sbUrl}
                      onChange={(e) => setSbUrl(e.target.value)}
                      placeholder="https://xyzcompany.supabase.co"
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-mono bg-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                      Publishable Key (anon)
                    </label>
                    <input
                      type="password"
                      value={sbKey}
                      onChange={(e) => setSbKey(e.target.value)}
                      placeholder="sb_publishable_..."
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-mono bg-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    disabled={isSyncingSb}
                    onClick={handleSaveSupabaseConfig}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{isSyncingSb ? 'Menyinkronkan...' : 'Simpan & Sinkronkan Sekarang'}</span>
                  </button>
                </div>

                <div className="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-200 text-[11px] text-slate-700 space-y-1">
                  <div className="font-bold text-emerald-950">💡 Catatan Skema Tabel Supabase:</div>
                  <p className="text-slate-600">
                    Pastikan Anda sudah menjalankan script SQL tabel <code className="bg-white px-1.5 py-0.5 rounded border border-emerald-200 font-mono text-[10px]">product_catalog</code> dan <code className="bg-white px-1.5 py-0.5 rounded border border-emerald-200 font-mono text-[10px]">customer_orders</code> di menu <strong>SQL Editor</strong> Supabase.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

              {/* Footer info bar */}
              <div className="bg-white rounded-2xl border border-slate-200 px-5 py-3 flex items-center justify-between text-[11px] text-slate-500 shadow-2xs">
                <div>
                  Terakhir disimpan: <strong className="text-slate-700">{new Date(db.lastUpdated).toLocaleString('id-ID')}</strong>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-600 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Tersinkronisasi Otomatis ke Studio Mockup</span>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Floating Success Toast */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-semibold animate-in slide-in-from-bottom duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}
    </div>
  );
};
