import { useState } from 'react';
import type {
  CustomTShirtState,
  NeckType,
  SleeveType,
  MaterialOption,
  ShirtColor,
  PrintTechnique,
  PlacedDesign,
  ViewAngle,
} from './types';
import {
  SHIRT_COLORS,
  MATERIALS,
  PRINT_TECHNIQUES,
  PRINT_ZONE_PRESETS,
  SAMPLE_ARTWORKS,
} from './data/mockData';
import { Navbar } from './components/Navbar';
import { TShirtCanvas } from './components/TShirtCanvas';
import { ViewAngleSwitcher } from './components/ViewAngleSwitcher';
import { DesignUploadPanel } from './components/DesignUploadPanel';
import { ConfiguratorSidebar } from './components/ConfiguratorSidebar';
import { PriceSummaryBar } from './components/PriceSummaryBar';
import { Image, Settings, CheckCircle2, Sparkles, ChevronDown } from 'lucide-react';

export function App() {
  const defaultFrontSample = SAMPLE_ARTWORKS[0];
  const defaultBlob = new Blob([defaultFrontSample.svg], { type: 'image/svg+xml;charset=utf-8' });
  const defaultSampleUrl = URL.createObjectURL(defaultBlob);

  const initialDesign: PlacedDesign = {
    imageUrl: defaultSampleUrl,
    fileName: `${defaultFrontSample.name}.svg`,
    zonePreset: 'front-a4',
    x: 50,
    y: 46,
    scale: 1,
    rotation: 0,
    aspectRatio: 1,
  };

  const [state, setState] = useState<CustomTShirtState>({
    neckType: 'round',
    sleeveType: 'short',
    color: SHIRT_COLORS[0], // Jet Black
    material: MATERIALS[0], // Combed 30s
    technique: PRINT_TECHNIQUES[0], // DTF
    activeView: 'front',
    designs: {
      front: initialDesign,
    },
    size: 'L',
    quantity: 12,
  });

  const [activeTab, setActiveTab] = useState<'design' | 'config'>('design');
  const [showGuides, setShowGuides] = useState<boolean>(false); // By default false (mati)
  const [downloadSuccessToast, setDownloadSuccessToast] = useState(false);

  // Mobile collapsible sections
  const [mobileOpenSection, setMobileOpenSection] = useState<'design' | 'config' | null>(null);

  const toggleMobileSection = (section: 'design' | 'config') => {
    setMobileOpenSection((prev) => (prev === section ? null : section));
  };

  // Handlers
  const handleUpdateDesign = (design: PlacedDesign | null) => {
    setState((prev) => {
      const updatedDesigns = { ...prev.designs };
      if (design) {
        updatedDesigns[prev.activeView] = design;
      } else {
        delete updatedDesigns[prev.activeView];
      }
      return { ...prev, designs: updatedDesigns };
    });
  };

  const handleReset = () => {
    setState({
      neckType: 'round',
      sleeveType: 'short',
      color: SHIRT_COLORS[0],
      material: MATERIALS[0],
      technique: PRINT_TECHNIQUES[0],
      activeView: 'front',
      designs: {},
      size: 'L',
      quantity: 1,
    });
  };

  // High Resolution Mockup Exporter with "CustomKaosWeb" Watermark & Exact Aspect Ratio
  const handleExportMockup = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 1500; // Exact 4:5 aspect ratio matching preview canvas
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Studio Background with soft radial gradient
    const grad = ctx.createRadialGradient(
      canvas.width / 2,
      canvas.height * 0.4,
      100,
      canvas.width / 2,
      canvas.height * 0.45,
      canvas.height * 0.8
    );
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(1, '#f1f5f9');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const baseUrl = import.meta.env.BASE_URL;
    const getPhotoPath = () => {
      if (state.activeView === 'front') {
        return state.neckType === 'round'
          ? `${baseUrl}mockups/tshirt-front-round-real.png`
          : `${baseUrl}mockups/tshirt-front-vneck-real.png`;
      }
      if (state.activeView === 'back') {
        return `${baseUrl}mockups/tshirt-back-real.png`;
      }
      if (state.activeView === 'sleeve-left') {
        return `${baseUrl}mockups/tshirt-sleeve-left-real.png`;
      }
      return `${baseUrl}mockups/tshirt-sleeve-right-real.png`;
    };

    const photoImg = new window.Image();
    photoImg.crossOrigin = 'anonymous';
    photoImg.onload = () => {
      // 92% inner container matching TShirtCanvas.tsx
      const containerW = canvas.width * 0.92;
      const containerH = canvas.height * 0.92;
      const containerX = (canvas.width - containerW) / 2;
      const containerY = (canvas.height - containerH) / 2;

      // Fit photo with object-contain inside 92% container (avoids stretching the t-shirt)
      const photoNatW = photoImg.naturalWidth || 1000;
      const photoNatH = photoImg.naturalHeight || 1200;
      const photoAspect = photoNatW / photoNatH;
      const containerAspect = containerW / containerH;

      let pW = containerW;
      let pH = containerH;
      if (photoAspect > containerAspect) {
        pH = containerW / photoAspect;
      } else {
        pW = containerH * photoAspect;
      }
      const pX = containerX + (containerW - pW) / 2;
      const pY = containerY + (containerH - pH) / 2;

      // Offscreen canvas for color silhouette masking
      const offCanvas = document.createElement('canvas');
      offCanvas.width = canvas.width;
      offCanvas.height = canvas.height;
      const offCtx = offCanvas.getContext('2d');
      if (!offCtx) return;

      // Draw solid color
      offCtx.fillStyle = state.color.hex;
      offCtx.fillRect(0, 0, offCanvas.width, offCanvas.height);

      // Mask with photo silhouette
      offCtx.globalCompositeOperation = 'destination-in';
      offCtx.drawImage(photoImg, pX, pY, pW, pH);

      // Draw masked color onto main canvas
      ctx.drawImage(offCanvas, 0, 0);

      // Helper to draw shading, watermark, and download
      const drawShadingAndExport = () => {
        // Multiply real photographic shading & folds ON TOP of artwork
        ctx.globalCompositeOperation = 'multiply';
        ctx.globalAlpha =
          activeDesign?.wrinkleIntensity !== undefined ? activeDesign.wrinkleIntensity : 0.92;
        ctx.drawImage(photoImg, pX, pY, pW, pH);

        // Screen highlight for fabric sheen
        ctx.globalCompositeOperation = 'screen';
        ctx.globalAlpha = state.color.isDark ? 0.30 : 0.14;
        ctx.drawImage(photoImg, pX, pY, pW, pH);

        // Reset blend mode
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1.0;

        // ============================================
        // WATERMARK: "CustomKaosWeb" (Besar & Tebal)
        // ============================================
        // 1. Center Diagonal Watermark (Extra Large & Bold)
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2 + 50);
        ctx.rotate((-28 * Math.PI) / 180);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = '900 130px Impact, "Arial Black", system-ui, -apple-system, sans-serif';

        // Outer contour stroke for extra thickness & visibility across any shirt color
        ctx.lineWidth = 10;
        ctx.strokeStyle = state.color.isDark
          ? 'rgba(0, 0, 0, 0.40)'
          : 'rgba(255, 255, 255, 0.65)';
        ctx.strokeText('CustomKaosWeb', 0, 0);

        // Core fill (solid & prominent)
        ctx.fillStyle = state.color.isDark
          ? 'rgba(255, 255, 255, 0.42)'
          : 'rgba(15, 23, 42, 0.36)';
        ctx.fillText('CustomKaosWeb', 0, 0);
        ctx.restore();

        // 2. Top-Right Watermark Stamp
        ctx.save();
        ctx.font = '900 28px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = 'rgba(71, 85, 105, 0.75)';
        ctx.textAlign = 'right';
        ctx.fillText('CustomKaosWeb', canvas.width - 60, 75);
        ctx.restore();

        // 3. Bottom Information Bar
        ctx.save();
        ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = '#64748b';
        ctx.textAlign = 'left';
        ctx.fillText(
          `CustomKaosWeb • ${state.color.name} (${state.neckType === 'round' ? 'Round Neck' : 'V-Neck'}, ${state.sleeveType === 'short' ? 'Short Sleeve' : 'Long Sleeve'})`,
          60,
          canvas.height - 45
        );
        ctx.restore();

        triggerDownload(canvas);
      };

      const activeDesign = state.designs[state.activeView];
      if (activeDesign) {
        const designImg = new window.Image();
        designImg.crossOrigin = 'anonymous';
        designImg.onload = () => {
          const activePreset =
            PRINT_ZONE_PRESETS.find((p) => p.id === activeDesign.zonePreset) ||
            PRINT_ZONE_PRESETS[0];
          const presetX =
            state.activeView === 'sleeve-right'
              ? 100 - activePreset.defaultX
              : activePreset.defaultX;

          const boxW = containerW * (activePreset.defaultWidth / 100);
          const boxH = containerH * (activePreset.defaultHeight / 100);
          const boxCenterX = containerX + containerW * (presetX / 100);
          const boxCenterY = containerY + containerH * (activePreset.defaultY / 100);
          const boxLeft = boxCenterX - boxW / 2;
          const boxTop = boxCenterY - boxH / 2;

          // Object-contain calculation to strictly preserve design's natural aspect ratio
          const imgNatW = designImg.naturalWidth || 1;
          const imgNatH = designImg.naturalHeight || 1;
          const imgAspect = imgNatW / imgNatH;
          const boxAspect = boxW / boxH;

          let baseW: number;
          let baseH: number;
          if (imgAspect > boxAspect) {
            baseW = boxW;
            baseH = boxW / imgAspect;
          } else {
            baseH = boxH;
            baseW = boxH * imgAspect;
          }

          const scale = activeDesign.scale || 1;
          const dw = baseW * scale;
          const dh = baseH * scale;

          ctx.save();
          // Strictly clip to the print zone boundary (overflow: hidden)!
          ctx.beginPath();
          ctx.rect(boxLeft, boxTop, boxW, boxH);
          ctx.clip();

          const offsetXPx = boxW * ((activeDesign.offsetX || 0) / 100);
          const offsetYPx = boxH * ((activeDesign.offsetY || 0) / 100);
          const cx = boxCenterX + offsetXPx;
          const cy = boxCenterY + offsetYPx;

          ctx.translate(cx, cy);
          ctx.rotate(((activeDesign.rotation || 0) * Math.PI) / 180);

          // Support corner radius if specified
          if (activeDesign.cornerRadius && activeDesign.cornerRadius > 0 && typeof ctx.roundRect === 'function') {
            ctx.beginPath();
            ctx.roundRect(-dw / 2, -dh / 2, dw, dh, activeDesign.cornerRadius * (dw / baseW));
            ctx.clip();
          }

          ctx.drawImage(designImg, -dw / 2, -dh / 2, dw, dh);
          ctx.restore();

          drawShadingAndExport();
        };

        // If image is an external http URL, wrap through weserv proxy to guarantee CORS for export
        let srcToLoad = activeDesign.imageUrl;
        if (srcToLoad.startsWith('http') && !srcToLoad.includes('images.weserv.nl')) {
          srcToLoad = `https://images.weserv.nl/?url=${encodeURIComponent(srcToLoad)}`;
        }
        designImg.src = srcToLoad;
      } else {
        drawShadingAndExport();
      }
    };
    photoImg.src = getPhotoPath();
  };

  const triggerDownload = (canvas: HTMLCanvasElement) => {
    const pngUrl = canvas.toDataURL('image/png');
    const downloadLink = document.createElement('a');
    downloadLink.download = `mockup-kaos-${state.activeView}-${state.color.name.toLowerCase().replace(/\s+/g, '-')}.png`;
    downloadLink.href = pngUrl;
    downloadLink.click();

    setDownloadSuccessToast(true);
    setTimeout(() => setDownloadSuccessToast(false), 3000);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans pb-28">
      {/* Top Navbar */}
      <Navbar onReset={handleReset} />

      {/* Main Studio Area */}
      <main className="max-w-7xl mx-auto w-full px-3 sm:px-4 lg:px-6 py-3 sm:py-6 flex-1 flex flex-col">
        {/* Notice Banner */}
        <div className="mb-3 sm:mb-4 bg-gradient-to-r from-sky-500/10 via-indigo-500/10 to-transparent p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border border-sky-200/60 flex items-center justify-between text-xs text-slate-700">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
            <span className="font-semibold text-slate-900 text-[11px] sm:text-xs">
              Studio Foto Kaos Asli
            </span>
            <span className="hidden sm:inline text-[11px] text-slate-600">
              Tekstur katun, kerutan lipatan 3D, dan bayangan kain nyata otomatis menyesuaikan warna kain.
            </span>
          </div>
          <div className="hidden md:flex items-center gap-3 text-slate-500 text-[11px]">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              Teknik: <strong className="text-slate-800">{state.technique.name}</strong>
            </span>
            <span>•</span>
            <span>Bahan: <strong className="text-slate-800">{state.material.name}</strong></span>
          </div>
        </div>

        {/* Studio Workspace Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-start flex-1">
          {/* LEFT: Interactive Mockup Canvas (7 cols on lg) */}
          <div className="lg:col-span-7 flex flex-col items-center gap-3 sm:gap-4">
            {/* View angle selector */}
            <ViewAngleSwitcher
              activeView={state.activeView}
              onSelectView={(v: ViewAngle) => setState((prev) => ({ ...prev, activeView: v }))}
              designs={state.designs}
            />

            {/* The Canvas */}
            <TShirtCanvas
              state={state}
              onUpdateDesign={handleUpdateDesign}
              showGuides={showGuides}
              setShowGuides={setShowGuides}
            />
          </div>

          {/* RIGHT: Controls & Customization Sidebar (5 cols on lg) */}
          {/* Desktop: Tabbed panel / Mobile: Collapsible accordion sections */}
          <div className="lg:col-span-5 flex flex-col gap-3 lg:gap-0">
            {/* ===== DESKTOP SIDEBAR (hidden on mobile) ===== */}
            <div className="hidden lg:flex flex-col bg-white rounded-3xl p-5 shadow-sm border border-slate-200">
              {/* Sidebar Navigation Tabs */}
              <div className="flex items-center p-1 bg-slate-100 rounded-2xl mb-5">
                <button
                  onClick={() => setActiveTab('design')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'design'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Image className="w-4 h-4 text-sky-600" />
                  <span>Upload & Sablon</span>
                </button>

                <button
                  onClick={() => setActiveTab('config')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'config'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Settings className="w-4 h-4 text-indigo-600" />
                  <span>Spesifikasi Kaos</span>
                </button>
              </div>

              {/* Tab Contents */}
              <div className="max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
                {activeTab === 'design' ? (
                  <DesignUploadPanel
                    state={state}
                    onUpdateDesign={handleUpdateDesign}
                  />
                ) : (
                  <ConfiguratorSidebar
                    state={state}
                    onChangeNeck={(neck: NeckType) => setState((prev) => ({ ...prev, neckType: neck }))}
                    onChangeSleeve={(sleeve: SleeveType) => setState((prev) => ({ ...prev, sleeveType: sleeve }))}
                    onChangeColor={(color: ShirtColor) => setState((prev) => ({ ...prev, color }))}
                    onChangeMaterial={(mat: MaterialOption) => setState((prev) => ({ ...prev, material: mat }))}
                    onChangeTechnique={(tech: PrintTechnique) => setState((prev) => ({ ...prev, technique: tech }))}
                    onChangeSize={(size: CustomTShirtState['size']) => setState((prev) => ({ ...prev, size }))}
                  />
                )}
              </div>
            </div>

            {/* ===== MOBILE ACCORDION SECTIONS (hidden on desktop) ===== */}
            {/* Upload & Sablon Collapsible */}
            <div className="lg:hidden bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <button
                onClick={() => toggleMobileSection('design')}
                className="w-full flex items-center justify-between px-4 py-3 text-left"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-sky-100 flex items-center justify-center">
                    <Image className="w-4 h-4 text-sky-600" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900">Upload & Sablon</div>
                    <div className="text-[11px] text-slate-500">Upload gambar, atur zoom & posisi</div>
                  </div>
                </div>
                <ChevronDown
                  className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${
                    mobileOpenSection === 'design' ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {mobileOpenSection === 'design' && (
                <div className="px-4 pb-4 border-t border-slate-100">
                  <div className="pt-3">
                    <DesignUploadPanel
                      state={state}
                      onUpdateDesign={handleUpdateDesign}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Spesifikasi Kaos Collapsible */}
            <div className="lg:hidden bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <button
                onClick={() => toggleMobileSection('config')}
                className="w-full flex items-center justify-between px-4 py-3 text-left"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                    <Settings className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900">Spesifikasi Kaos</div>
                    <div className="text-[11px] text-slate-500">Kerah, lengan, warna, bahan, teknik</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                    {state.color.name}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${
                      mobileOpenSection === 'config' ? 'rotate-180' : ''
                    }`}
                  />
                </div>
              </button>
              {mobileOpenSection === 'config' && (
                <div className="px-4 pb-4 border-t border-slate-100">
                  <div className="pt-3">
                    <ConfiguratorSidebar
                      state={state}
                      onChangeNeck={(neck: NeckType) => setState((prev) => ({ ...prev, neckType: neck }))}
                      onChangeSleeve={(sleeve: SleeveType) => setState((prev) => ({ ...prev, sleeveType: sleeve }))}
                      onChangeColor={(color: ShirtColor) => setState((prev) => ({ ...prev, color }))}
                      onChangeMaterial={(mat: MaterialOption) => setState((prev) => ({ ...prev, material: mat }))}
                      onChangeTechnique={(tech: PrintTechnique) => setState((prev) => ({ ...prev, technique: tech }))}
                      onChangeSize={(size: CustomTShirtState['size']) => setState((prev) => ({ ...prev, size }))}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Sticky Bottom Pricing & Action Bar */}
      <PriceSummaryBar
        state={state}
        onUpdateQuantity={(qty: number) => setState((prev) => ({ ...prev, quantity: qty }))}
        onExportMockup={handleExportMockup}
      />

      {/* Success Notification Toast */}
      {downloadSuccessToast && (
        <div className="fixed bottom-24 right-4 sm:right-6 z-50 bg-slate-900 text-white px-3 sm:px-4 py-2.5 sm:py-3 rounded-2xl shadow-xl flex items-center gap-2 text-[11px] sm:text-xs font-semibold animate-in slide-in-from-bottom duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Mockup berhasil didownload dengan watermark!</span>
        </div>
      )}
    </div>
  );
}

export default App;
