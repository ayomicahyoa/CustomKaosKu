import { useState, useEffect } from 'react';
import type {
  CustomTShirtState,
  NeckType,
  SleeveType,
  MaterialOption,
  ShirtColor,
  PrintTechnique,
  PlacedDesign,
  ViewAngle,
  ShirtSize,
} from './types';
import { SAMPLE_ARTWORKS } from './data/mockData';
import {
  loadProductDatabase,
  syncCatalogFromCloud,
  type ProductDatabaseState,
} from './services/pricingStorage';
import { Navbar } from './components/Navbar';
import { TShirtCanvas } from './components/TShirtCanvas';
import { ViewAngleSwitcher } from './components/ViewAngleSwitcher';
import { ProductTypeDropdown } from './components/ProductTypeDropdown';
import { PRODUCT_TYPES } from './data/mockData';
import { DesignUploadPanel } from './components/DesignUploadPanel';
import { ConfiguratorSidebar } from './components/ConfiguratorSidebar';
import { Jersey3DViewer } from './components/Jersey3DViewer';
import { JerseyConfigSidebar } from './components/JerseyConfigSidebar';
import type { JerseyCustomization } from './types';
import { PriceSummaryBar } from './components/PriceSummaryBar';
import { AdminDashboard } from './components/AdminDashboard';
import { OrderTrackingPage } from './components/OrderTrackingPage';
import { CartModal } from './components/CartModal';
import { UserAuthModal } from './components/UserAuthModal';
import { UserHistoryModal } from './components/UserHistoryModal';
import { subscribeToAuth, signOutUser } from './services/authService';
import type { AppUser } from './types';
import {
  Image,
  Settings,
  CheckCircle2,
  ChevronDown,
} from 'lucide-react';

export type AppRoute = 'studio' | 'admin' | 'tracking';

const getInitialRoute = (): AppRoute => {
  if (typeof window === 'undefined') return 'studio';
  const path = window.location.pathname.toLowerCase();
  const hash = window.location.hash.toLowerCase();
  const search = window.location.search.toLowerCase();
  if (
    path.endsWith('/adm') ||
    path.endsWith('/adm/') ||
    hash.includes('adm') ||
    search.includes('page=adm')
  ) {
    return 'admin';
  }
  if (
    path.includes('cekorderan') ||
    hash.includes('cekorderan') ||
    search.includes('page=cekorderan') ||
    search.includes('page=tracking')
  ) {
    return 'tracking';
  }
  return 'studio';
};

const DEFAULT_JERSEY_CONFIG: JerseyCustomization = {
  templateId: 'design-01',
  templateTextureUrl: '/mockups/templates/design-01_full.png?v=natural_sleeve_v7',
  pattern: 'stripes',
  primaryColor: '#1e3a8a',
  secondaryColor: '#ffffff',
  accentColor: '#f59e0b',
  collarColor: '#1a1a1a',
  partColors: {
    frontBody: '#1e3a8a',
    backBody: '#1e3a8a',
    leftSleeve: '#1e3a8a',
    rightSleeve: '#1e3a8a',
    collar: '#1a1a1a',
  },
  activePart: 'all',
  showPlayerName: true,
  playerName: 'PERALTA',
  playerNamePos: { x: 75.0, y: 16.5, scale: 1 },
  showPlayerNumber: true,
  playerNumber: '10',
  playerNumberPos: { x: 75.0, y: 29.5, scale: 1 },
  fontFamily: 'Impact',
  numberColor: '#111827',
  numberStrokeColor: '#ffffff',
  customElements: [
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
  ],
  roster: [
    { id: 'p-1', name: 'PERALTA', number: '10', size: 'L' },
    { id: 'p-2', name: 'STRIKER', number: '9', size: 'M' },
    { id: 'p-3', name: 'PLAYMAKER', number: '7', size: 'L' },
  ],
};

export function App() {
  // Load dynamic product pricing & catalog database from localStorage (or defaults)
  const [db, setDb] = useState<ProductDatabaseState>(() => loadProductDatabase());

  const defaultFrontSample = SAMPLE_ARTWORKS[0];
  const defaultBlob = new Blob([defaultFrontSample.svg], { type: 'image/svg+xml;charset=utf-8' });
  const defaultSampleUrl = URL.createObjectURL(defaultBlob);

  const initialDesign: PlacedDesign = {
    imageUrl: defaultSampleUrl,
    fileName: `${defaultFrontSample.name}.svg`,
    zonePreset: db.printZones[0]?.id || 'front-a4',
    x: 50,
    y: 46,
    scale: 1,
    rotation: 0,
    aspectRatio: 1,
  };

  const [state, setState] = useState<CustomTShirtState>({
    productType: 'tshirt-round',
    neckType: 'round',
    sleeveType: 'short',
    color: db.colors[0], // First color from DB
    material: db.materials[0], // First material from DB
    technique: db.techniques[0], // First technique from DB
    activeView: 'front',
    designs: {
      front: initialDesign,
    },
    size: 'L',
    sizeBreakdown: { S: 2, M: 4, L: 4, XL: 2, XXL: 0, '3XL': 0 },
    quantity: 12,
    jerseyConfig: DEFAULT_JERSEY_CONFIG,
  });

  const [activeTab, setActiveTab] = useState<'design' | 'config'>('config');
  const [showGuides, setShowGuides] = useState<boolean>(false); // By default false (mati)
  const [downloadSuccessToast, setDownloadSuccessToast] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isUserHistoryOpen, setIsUserHistoryOpen] = useState(false);

  useEffect(() => {
    const unsub = subscribeToAuth((user) => {
      setCurrentUser(user);
    });
    return unsub;
  }, []);

  // Standalone Route Navigation: studio vs admin vs tracking
  const [currentRoute, setCurrentRoute] = useState<AppRoute>(getInitialRoute);

  useEffect(() => {
    const handleRouteChange = () => {
      setCurrentRoute(getInitialRoute());
    };
    window.addEventListener('popstate', handleRouteChange);
    window.addEventListener('hashchange', handleRouteChange);
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
      window.removeEventListener('hashchange', handleRouteChange);
    };
  }, []);

  const navigateTo = (route: AppRoute) => {
    if (route === 'admin') {
      window.location.hash = '/adm';
    } else if (route === 'tracking') {
      window.location.hash = '/cekorderan';
    } else {
      window.location.hash = '';
      if (
        window.location.pathname.endsWith('/adm') ||
        window.location.pathname.endsWith('/adm/') ||
        window.location.pathname.includes('cekorderan')
      ) {
        window.history.pushState(
          null,
          '',
          window.location.pathname.replace(/\/adm\/?$/, '').replace(/\/cekorderan\/?$/, '') || '/'
        );
      }
    }
    setCurrentRoute(route);
  };

  // Mobile collapsible sections
  const [mobileOpenSection, setMobileOpenSection] = useState<'design' | 'config' | null>(null);

  const toggleMobileSection = (section: 'design' | 'config') => {
    setMobileOpenSection((prev) => (prev === section ? null : section));
  };

  // Synchronize state when admin updates product catalog
  const handleUpdateDb = (newDb: ProductDatabaseState) => {
    setDb(newDb);
    setState((prev) => {
      const matchingMat =
        newDb.materials.find((m) => m.id === prev.material.id) || newDb.materials[0];
      const matchingTech =
        newDb.techniques.find((t) => t.id === prev.technique.id) || newDb.techniques[0];
      const matchingColor =
        newDb.colors.find((c) => c.id === prev.color.id) || newDb.colors[0];

      return {
        ...prev,
        material: matchingMat,
        technique: matchingTech,
        color: matchingColor,
      };
    });
  };

  // Background sync catalog from Supabase cloud on mount
  useEffect(() => {
    syncCatalogFromCloud().then((cloudDb) => {
      if (cloudDb) {
        handleUpdateDb(cloudDb);
      }
    });
  }, []);

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
      productType: 'tshirt-round',
      neckType: 'round',
      sleeveType: 'short',
      color: db.colors[0],
      material: db.materials[0],
      technique: db.techniques[0],
      activeView: 'front',
      designs: {},
      size: 'L',
      sizeBreakdown: { S: 0, M: 0, L: 1, XL: 0, XXL: 0, '3XL': 0 },
      quantity: 1,
    });
  };

  const handleUpdateSizeBreakdown = (newBreakdown: Record<ShirtSize, number>) => {
    const total = Object.values(newBreakdown).reduce((acc, v) => acc + v, 0);
    setState((prev) => ({
      ...prev,
      sizeBreakdown: newBreakdown,
      quantity: Math.max(1, total),
    }));
  };

  const handleSelectProductType = (productTypeId: string) => {
    const pt = PRODUCT_TYPES.find((p) => p.id === productTypeId) || PRODUCT_TYPES[0];
    setState((prev) => ({
      ...prev,
      productType: pt.id,
      neckType: pt.neckType,
      sleeveType: pt.id === 'hoodie-basic' ? 'long' : (pt.supportsLongSleeve === false ? 'short' : prev.sleeveType),
      jerseyConfig: prev.jerseyConfig || DEFAULT_JERSEY_CONFIG,
    }));
  };

  const handleUpdateQuantityFromBar = (qty: number) => {
    setState((prev) => {
      const safeQty = Math.max(1, qty);
      const activeSize: ShirtSize = prev.size || 'L';
      const currentBreakdown = { ...(prev.sizeBreakdown || { S: 0, M: 0, L: 0, XL: 0, XXL: 0, '3XL': 0 }) };
      const currentTotal = Object.values(currentBreakdown).reduce((acc, v) => acc + v, 0);
      const diff = safeQty - currentTotal;
      currentBreakdown[activeSize] = Math.max(0, (currentBreakdown[activeSize] || 0) + diff);
      return {
        ...prev,
        quantity: safeQty,
        sizeBreakdown: currentBreakdown,
      };
    });
  };

  // High Resolution Mockup Exporter with "Custom Apparel Bandung.id" Watermark & Exact Aspect Ratio
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
      // 0. Basic Hoodie Pullover
      if (state.productType === 'hoodie-basic') {
        if (state.activeView === 'front') return `${baseUrl}mockups/hoodie-front.png`;
        if (state.activeView === 'back') return `${baseUrl}mockups/hoodie-back.png`;
        if (state.activeView === 'sleeve-left') return `${baseUrl}mockups/hoodie-left.png`;
        return `${baseUrl}mockups/hoodie-right.png`;
      }

      // 1. T-Shirt Boxy Oversized
      if (state.productType === 'tshirt-boxy') {
        if (state.activeView === 'front') return `${baseUrl}mockups/tshirt-boxy-front.png`;
        if (state.activeView === 'back') return `${baseUrl}mockups/tshirt-boxy-back.png`;
        if (state.activeView === 'sleeve-left') return `${baseUrl}mockups/tshirt-boxy-left.png`;
        return `${baseUrl}mockups/tshirt-boxy-right.png`;
      }

      // 2. Long Sleeve Models
      if (state.sleeveType === 'long') {
        if (state.activeView === 'front') {
          return state.neckType === 'v-neck'
            ? `${baseUrl}mockups/tshirt-vneck-longsleeve-front.png`
            : `${baseUrl}mockups/tshirt-longsleeve-front.png`;
        }
        if (state.activeView === 'back') return `${baseUrl}mockups/tshirt-longsleeve-back.png`;
        if (state.activeView === 'sleeve-left') return `${baseUrl}mockups/tshirt-longsleeve-left.png`;
        return `${baseUrl}mockups/tshirt-longsleeve-right.png`;
      }

      // 3. Short Sleeve Standard (Round & V-Neck)
      if (state.activeView === 'front') {
        return state.neckType === 'v-neck'
          ? `${baseUrl}mockups/tshirt-vneck-front.png`
          : `${baseUrl}mockups/tshirt-front-round-real.png`;
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
        // WATERMARK: "Custom Apparel Bandung.id" (Besar & Tebal)
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
        ctx.strokeText('Custom Apparel Bandung.id', 0, 0);

        // Core fill (solid & prominent)
        ctx.fillStyle = state.color.isDark
          ? 'rgba(255, 255, 255, 0.42)'
          : 'rgba(15, 23, 42, 0.36)';
        ctx.fillText('Custom Apparel Bandung.id', 0, 0);
        ctx.restore();

        // 2. Top-Right Watermark Stamp
        ctx.save();
        ctx.font = '900 28px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = 'rgba(71, 85, 105, 0.75)';
        ctx.textAlign = 'right';
        ctx.fillText('CustomApparel', canvas.width - 60, 75);
        ctx.restore();

        // 3. Bottom Information Bar
        ctx.save();
        ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = '#64748b';
        ctx.textAlign = 'left';
        ctx.fillText(
          `Custom Apparel Bandung.id • ${state.color.name} (${state.neckType === 'round' ? 'Round Neck' : 'V-Neck'}, ${state.sleeveType === 'short' ? 'Short Sleeve' : 'Long Sleeve'})`,
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
          // Dynamic print zone from database
          const activePreset =
            db.printZones.find((p) => p.id === activeDesign.zonePreset) ||
            db.printZones[0];
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

  // Capture mockup preview for a specific view angle (no watermark, 600x750)
  const captureViewMockup = (view: ViewAngle): Promise<string> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      canvas.width = 600;
      canvas.height = 750;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('No canvas context')); return; }

      const grad = ctx.createRadialGradient(300, 300, 50, 300, 337, 600);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(1, '#f1f5f9');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 600, 750);

      const baseUrl = import.meta.env.BASE_URL;
      const getPath = () => {
        // 0. Basic Hoodie Pullover
        if (state.productType === 'hoodie-basic') {
          if (view === 'front') return `${baseUrl}mockups/hoodie-front.png`;
          if (view === 'back') return `${baseUrl}mockups/hoodie-back.png`;
          if (view === 'sleeve-left') return `${baseUrl}mockups/hoodie-left.png`;
          return `${baseUrl}mockups/hoodie-right.png`;
        }

        // 1. T-Shirt Boxy Oversized
        if (state.productType === 'tshirt-boxy') {
          if (view === 'front') return `${baseUrl}mockups/tshirt-boxy-front.png`;
          if (view === 'back') return `${baseUrl}mockups/tshirt-boxy-back.png`;
          if (view === 'sleeve-left') return `${baseUrl}mockups/tshirt-boxy-left.png`;
          return `${baseUrl}mockups/tshirt-boxy-right.png`;
        }

        // 2. Long Sleeve Models
        if (state.sleeveType === 'long') {
          if (view === 'front') {
            return state.neckType === 'v-neck'
              ? `${baseUrl}mockups/tshirt-vneck-longsleeve-front.png`
              : `${baseUrl}mockups/tshirt-longsleeve-front.png`;
          }
          if (view === 'back') return `${baseUrl}mockups/tshirt-longsleeve-back.png`;
          if (view === 'sleeve-left') return `${baseUrl}mockups/tshirt-longsleeve-left.png`;
          return `${baseUrl}mockups/tshirt-longsleeve-right.png`;
        }

        // 3. Short Sleeve Standard (Round & V-Neck)
        if (view === 'front')
          return state.neckType === 'v-neck'
            ? `${baseUrl}mockups/tshirt-vneck-front.png`
            : `${baseUrl}mockups/tshirt-front-round-real.png`;
        if (view === 'back') return `${baseUrl}mockups/tshirt-back-real.png`;
        if (view === 'sleeve-left') return `${baseUrl}mockups/tshirt-sleeve-left-real.png`;
        return `${baseUrl}mockups/tshirt-sleeve-right-real.png`;
      };

      const photoImg = new window.Image();
      photoImg.crossOrigin = 'anonymous';
      photoImg.onload = () => {
        const cW = canvas.width * 0.92, cH = canvas.height * 0.92;
        const cX = (canvas.width - cW) / 2, cY = (canvas.height - cH) / 2;
        const pNW = photoImg.naturalWidth || 1000, pNH = photoImg.naturalHeight || 1200;
        const pA = pNW / pNH, cA = cW / cH;
        let pW = cW, pH = cH;
        if (pA > cA) pH = cW / pA; else pW = cH * pA;
        const pX = cX + (cW - pW) / 2, pY = cY + (cH - pH) / 2;

        const off = document.createElement('canvas');
        off.width = canvas.width; off.height = canvas.height;
        const oCtx = off.getContext('2d');
        if (!oCtx) { reject(new Error('No offscreen ctx')); return; }
        oCtx.fillStyle = state.color.hex;
        oCtx.fillRect(0, 0, off.width, off.height);
        oCtx.globalCompositeOperation = 'destination-in';
        oCtx.drawImage(photoImg, pX, pY, pW, pH);
        ctx.drawImage(off, 0, 0);

        const finalize = () => {
          const ad = state.designs[view];
          ctx.globalCompositeOperation = 'multiply';
          ctx.globalAlpha = ad?.wrinkleIntensity ?? 0.92;
          ctx.drawImage(photoImg, pX, pY, pW, pH);
          ctx.globalCompositeOperation = 'screen';
          ctx.globalAlpha = state.color.isDark ? 0.30 : 0.14;
          ctx.drawImage(photoImg, pX, pY, pW, pH);
          ctx.globalCompositeOperation = 'source-over';
          ctx.globalAlpha = 1.0;
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        };

        const activeDesign = state.designs[view];
        if (activeDesign) {
          const dImg = new window.Image();
          dImg.crossOrigin = 'anonymous';
          dImg.onload = () => {
            const ap = db.printZones.find(p => p.id === activeDesign.zonePreset) || db.printZones[0];
            const prX = view === 'sleeve-right' ? 100 - ap.defaultX : ap.defaultX;
            const bW = cW * (ap.defaultWidth / 100), bH = cH * (ap.defaultHeight / 100);
            const bCX = cX + cW * (prX / 100), bCY = cY + cH * (ap.defaultY / 100);
            const bL = bCX - bW / 2, bT = bCY - bH / 2;
            const iNW = dImg.naturalWidth || 1, iNH = dImg.naturalHeight || 1;
            const iA = iNW / iNH, bA = bW / bH;
            let baseW: number, baseH: number;
            if (iA > bA) { baseW = bW; baseH = bW / iA; } else { baseH = bH; baseW = bH * iA; }
            const sc = activeDesign.scale || 1;
            const dw = baseW * sc, dh = baseH * sc;
            ctx.save();
            ctx.beginPath(); ctx.rect(bL, bT, bW, bH); ctx.clip();
            const oXPx = bW * ((activeDesign.offsetX || 0) / 100);
            const oYPx = bH * ((activeDesign.offsetY || 0) / 100);
            ctx.translate(bCX + oXPx, bCY + oYPx);
            ctx.rotate(((activeDesign.rotation || 0) * Math.PI) / 180);
            if (activeDesign.cornerRadius && activeDesign.cornerRadius > 0 && typeof ctx.roundRect === 'function') {
              ctx.beginPath(); ctx.roundRect(-dw / 2, -dh / 2, dw, dh, activeDesign.cornerRadius * (dw / baseW)); ctx.clip();
            }
            ctx.drawImage(dImg, -dw / 2, -dh / 2, dw, dh);
            ctx.restore();
            finalize();
          };
          dImg.onerror = () => finalize();
          let src = activeDesign.imageUrl;
          if (src.startsWith('http') && !src.includes('images.weserv.nl'))
            src = `https://images.weserv.nl/?url=${encodeURIComponent(src)}`;
          dImg.src = src;
        } else {
          finalize();
        }
      };
      photoImg.onerror = () => reject(new Error('Failed to load t-shirt photo'));
      photoImg.src = getPath();
    });
  };

  // Capture mockup previews for all 4 angles (front, back, sleeve-left, sleeve-right)
  const handleCaptureAllMockups = async (): Promise<{ primary: string; all: Record<ViewAngle, string> }> => {
    const views: ViewAngle[] = ['front', 'back', 'sleeve-left', 'sleeve-right'];
    const all = {} as Record<ViewAngle, string>;
    for (const v of views) {
      try {
        all[v] = await captureViewMockup(v);
      } catch (err) {
        console.warn(`Failed to capture mockup for view ${v}:`, err);
      }
    }
    const primary = all.front || all[state.activeView] || Object.values(all)[0] || '';
    return { primary, all };
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

  // If URL route is Admin (/adm or #/adm)
  if (currentRoute === 'admin') {
    return (
      <AdminDashboard
        db={db}
        onUpdateDb={handleUpdateDb}
        onNavigateToStudio={() => navigateTo('studio')}
      />
    );
  }

  // If URL route is Customer Order Tracking (#/cekorderan or /cekorderan)
  if (currentRoute === 'tracking') {
    return (
      <OrderTrackingPage
        onNavigateToStudio={() => navigateTo('studio')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans pb-28">
      {/* Top Navbar */}
      <Navbar
        onReset={handleReset}
        onNavigateToTracking={() => navigateTo('tracking')}
        onOpenCart={() => setIsCartOpen(true)}
        user={currentUser}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenUserHistory={() => setIsUserHistoryOpen(true)}
      />

      {/* Main Studio Area */}
      <main className="max-w-7xl mx-auto w-full px-3 sm:px-4 lg:px-6 py-3 sm:py-6 flex-1 flex flex-col">
        {/* Studio Workspace Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-start flex-1">
          {/* LEFT: Interactive Mockup Canvas (7 cols on lg) */}
          <div className="lg:col-span-7 flex flex-col items-center gap-3 sm:gap-4">
            {/* Product Type Dropdown (Right where user circled!) */}
            <ProductTypeDropdown
              productTypes={PRODUCT_TYPES}
              activeProductTypeId={state.productType || 'tshirt-round'}
              onSelectProductType={handleSelectProductType}
            />

            {state.productType === 'jersey-fullprint' ? (
              <div className="w-full flex-1 flex flex-col">
                <Jersey3DViewer
                  jerseyConfig={state.jerseyConfig || DEFAULT_JERSEY_CONFIG}
                  onChangeJerseyConfig={(cfg) =>
                    setState((prev) => ({ ...prev, jerseyConfig: cfg }))
                  }
                />
              </div>
            ) : (
              <>
                {/* View angle selector */}
                <ViewAngleSwitcher
                  activeView={state.activeView}
                  onSelectView={(v: ViewAngle) => setState((prev) => ({ ...prev, activeView: v }))}
                  designs={state.designs}
                  sleeveType={state.sleeveType}
                />

                {/* The Canvas with dynamic printZones */}
                <TShirtCanvas
                  state={state}
                  printZones={db.printZones}
                  onUpdateDesign={handleUpdateDesign}
                  showGuides={showGuides}
                  setShowGuides={setShowGuides}
                />
              </>
            )}
          </div>

          {/* RIGHT: Controls & Customization Sidebar (5 cols on lg) */}
          <div className="lg:col-span-5 flex flex-col gap-3 lg:gap-0">
            {/* ===== DESKTOP SIDEBAR (hidden on mobile) ===== */}
            <div className="hidden lg:flex flex-col bg-white rounded-3xl p-5 shadow-sm border border-slate-200">
              {state.productType === 'jersey-fullprint' ? (
                <div className="max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
                  <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
                    <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-xs">
                      3D
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Custom Jersey Full Print</h3>
                      <p className="text-[11px] text-slate-500">Motif sublimasi, nama punggung & nomor tim</p>
                    </div>
                  </div>
                  <JerseyConfigSidebar
                    jerseyConfig={state.jerseyConfig || DEFAULT_JERSEY_CONFIG}
                    onChangeJerseyConfig={(cfg) =>
                      setState((prev) => ({ ...prev, jerseyConfig: cfg }))
                    }
                    quantity={state.quantity}
                    onChangeQuantity={handleUpdateQuantityFromBar}
                    sizeBreakdown={state.sizeBreakdown}
                    onChangeSizeBreakdown={handleUpdateSizeBreakdown}
                  />
                </div>
              ) : (
                <>
                  {/* Sidebar Navigation Tabs */}
                  <div className="flex items-center p-1 bg-slate-100 rounded-2xl mb-5">
                    <button
                      onClick={() => setActiveTab('config')}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'config'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-500 hover:text-slate-800'
                        }`}
                    >
                      <Settings className="w-4 h-4 text-indigo-600" />
                      <span>Spesifikasi Kaos</span>
                    </button>

                    <button
                      onClick={() => setActiveTab('design')}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'design'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-500 hover:text-slate-800'
                        }`}
                    >
                      <Image className="w-4 h-4 text-sky-600" />
                      <span>Upload & Sablon</span>
                    </button>
                  </div>

                  {/* Tab Contents */}
                  <div className="max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
                    {activeTab === 'config' ? (
                      <ConfiguratorSidebar
                        state={state}
                        materials={db.materials}
                        techniques={db.techniques}
                        colors={db.colors}
                        productTypes={PRODUCT_TYPES}
                        onChangeProductType={handleSelectProductType}
                        onChangeNeck={(neck: NeckType) => setState((prev) => ({ ...prev, neckType: neck }))}
                        onChangeSleeve={(sleeve: SleeveType) => setState((prev) => ({ ...prev, sleeveType: sleeve }))}
                        onChangeColor={(color: ShirtColor) => setState((prev) => ({ ...prev, color }))}
                        onChangeMaterial={(mat: MaterialOption) => setState((prev) => ({ ...prev, material: mat }))}
                        onChangeTechnique={(tech: PrintTechnique) => setState((prev) => ({ ...prev, technique: tech }))}
                        onChangeSize={(size: ShirtSize) => setState((prev) => ({ ...prev, size }))}
                        onChangeSizeBreakdown={handleUpdateSizeBreakdown}
                      />
                    ) : (
                      <DesignUploadPanel
                        state={state}
                        printZones={db.printZones}
                        onUpdateDesign={handleUpdateDesign}
                      />
                    )}
                  </div>
                </>
              )}
            </div>

            {/* ===== MOBILE ACCORDION SECTIONS (hidden on desktop) ===== */}
            {/* Spesifikasi Kaos Collapsible (Prioritas Pertama) */}
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
                    className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${mobileOpenSection === 'config' ? 'rotate-180' : ''
                      }`}
                  />
                </div>
              </button>
              {mobileOpenSection === 'config' && (
                <div className="px-4 pb-4 border-t border-slate-100">
                  <div className="pt-3">
                    {state.productType === 'jersey-fullprint' ? (
                      <JerseyConfigSidebar
                        jerseyConfig={state.jerseyConfig || DEFAULT_JERSEY_CONFIG}
                        onChangeJerseyConfig={(cfg) =>
                          setState((prev) => ({ ...prev, jerseyConfig: cfg }))
                        }
                        quantity={state.quantity}
                        onChangeQuantity={handleUpdateQuantityFromBar}
                        sizeBreakdown={state.sizeBreakdown}
                        onChangeSizeBreakdown={handleUpdateSizeBreakdown}
                      />
                    ) : (
                      <ConfiguratorSidebar
                        state={state}
                        materials={db.materials}
                        techniques={db.techniques}
                        colors={db.colors}
                        productTypes={PRODUCT_TYPES}
                        onChangeProductType={handleSelectProductType}
                        onChangeNeck={(neck: NeckType) => setState((prev) => ({ ...prev, neckType: neck }))}
                        onChangeSleeve={(sleeve: SleeveType) => setState((prev) => ({ ...prev, sleeveType: sleeve }))}
                        onChangeColor={(color: ShirtColor) => setState((prev) => ({ ...prev, color }))}
                        onChangeMaterial={(mat: MaterialOption) => setState((prev) => ({ ...prev, material: mat }))}
                        onChangeTechnique={(tech: PrintTechnique) => setState((prev) => ({ ...prev, technique: tech }))}
                        onChangeSize={(size: ShirtSize) => setState((prev) => ({ ...prev, size }))}
                        onChangeSizeBreakdown={handleUpdateSizeBreakdown}
                      />
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Upload & Sablon Collapsible (Prioritas Kedua) */}
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
                    <div className="text-[11px] text-slate-500">Upload gambar, buat AI, atur zoom</div>
                  </div>
                </div>
                <ChevronDown
                  className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${mobileOpenSection === 'design' ? 'rotate-180' : ''
                    }`}
                />
              </button>
              {mobileOpenSection === 'design' && (
                <div className="px-4 pb-4 border-t border-slate-100">
                  <div className="pt-3">
                    <DesignUploadPanel
                      state={state}
                      printZones={db.printZones}
                      onUpdateDesign={handleUpdateDesign}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Sticky Bottom Pricing & Action Bar with dynamic printZones */}
      <PriceSummaryBar
        state={state}
        printZones={db.printZones}
        onUpdateQuantity={handleUpdateQuantityFromBar}
        onExportMockup={handleExportMockup}
        onCaptureAllMockups={handleCaptureAllMockups}
        onOpenCart={() => setIsCartOpen(true)}
        onStartNewDesign={handleReset}
      />

      {/* Cart Modal */}
      <CartModal
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onStartNewDesign={handleReset}
        user={currentUser}
        onOpenAuth={() => setIsAuthModalOpen(true)}
      />

      {/* User Login / Register Modal */}
      <UserAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={(u) => {
          setCurrentUser(u);
          setIsAuthModalOpen(false);
        }}
      />

      {/* User Order History & Saved Designs Modal */}
      {currentUser && (
        <UserHistoryModal
          isOpen={isUserHistoryOpen}
          onClose={() => setIsUserHistoryOpen(false)}
          user={currentUser}
          onLogout={signOutUser}
          onOpenCart={() => setIsCartOpen(true)}
          onSelectOrderToTrack={(orderId) => {
            window.location.hash = `/cekorderan?id=${orderId}`;
            navigateTo('tracking');
          }}
        />
      )}

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
