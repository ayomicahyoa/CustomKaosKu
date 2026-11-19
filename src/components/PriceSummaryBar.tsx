import React, { useState, useEffect } from 'react';
import type { CustomTShirtState, PrintZonePreset, ViewAngle, CartItem } from '../types';
import { PRINT_ZONE_PRESETS } from '../data/mockData';
import { addOrder } from '../services/ordersStorage';
import { addToCart } from '../services/cartStorage';
import { getCurrentUser } from '../services/authService';
import { imageUrlToDataUrl } from '../services/imageUtils';
import { uploadOrderToDrive, isDriveConfigured } from '../services/driveUploader';
import { getBankAccounts } from '../services/bankConfig';
import {
  Download,
  Share2,
  FileText,
  Minus,
  Plus,
  CheckCircle,
  X,
  MessageSquare,
  User,
  MapPin,
  FileEdit,
  CheckCircle2,
  ExternalLink,
  Loader2,
  CreditCard,
  Copy,
  Check,
  ShoppingBag,
} from 'lucide-react';

interface PriceSummaryBarProps {
  state: CustomTShirtState;
  printZones?: PrintZonePreset[];
  onUpdateQuantity: (qty: number) => void;
  onExportMockup: () => void;
  onCaptureAllMockups: () => Promise<{ primary: string; all: Record<ViewAngle, string> }>;
  onOpenCart?: () => void;
  onStartNewDesign?: () => void;
}

export const PriceSummaryBar: React.FC<PriceSummaryBarProps> = ({
  state,
  printZones = PRINT_ZONE_PRESETS,
  onUpdateQuantity,
  onExportMockup,
  onCaptureAllMockups,
  onOpenCart,
  onStartNewDesign,
}) => {
  const [showSpecModal, setShowSpecModal] = useState(false);
  const [copiedWA, setCopiedWA] = useState(false);
  const [orderCode] = useState(() => 'CK' + Math.random().toString(36).substring(2, 8).toUpperCase());

  // Customer Checkout & Shipping Info State
  const [showOrderModal, setShowOrderModal] = useState(false);
  const currentUser = getCurrentUser();
  const [customerName, setCustomerName] = useState(() => currentUser?.fullName || '');
  const [customerPhone, setCustomerPhone] = useState(() => currentUser?.phone || '');
  const [shippingCity, setShippingCity] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');
  const [paymentType, setPaymentType] = useState<'dp_50' | 'full'>('dp_50');
  const [copiedAccount, setCopiedAccount] = useState<string | null>(null);
  const [orderSubmitted, setOrderSubmitted] = useState(false);
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [showAddedToCartModal, setShowAddedToCartModal] = useState(false);

  const targetWhatsAppNumber = '62895356338321';
  const bankAccounts = getBankAccounts();

  const handleCopyAccount = (accNo: string) => {
    navigator.clipboard.writeText(accNo);
    setCopiedAccount(accNo);
    setTimeout(() => setCopiedAccount(null), 2500);
  };

  // Cost calculation
  const sleeveExtra = state.sleeveType === 'long' ? 10000 : 0;
  const baseShirtCost = state.material.basePrice + sleeveExtra;

  // Print costs per zone
  let printCostTotal = 0;
  const activePrintBreakdown: { name: string; cost: number; placement: string }[] = [];

  Object.entries(state.designs).forEach(([view, design]) => {
    if (design) {
      const preset = printZones.find((p) => p.id === design.zonePreset);
      const zoneCost = preset ? preset.cost : 15000;
      const techBase = state.technique.baseCost;
      const combinedZoneCost = zoneCost + techBase;
      printCostTotal += combinedZoneCost;

      activePrintBreakdown.push({
        name: preset?.name || 'Area Sablon',
        placement: view.toUpperCase(),
        cost: combinedZoneCost,
      });
    }
  });

  const unitPriceBeforeDiscount = baseShirtCost + printCostTotal;

  // Tiered bulk discount
  let discountPercent = 0;
  if (state.quantity >= 100) {
    discountPercent = 25;
  } else if (state.quantity >= 50) {
    discountPercent = 18;
  } else if (state.quantity >= 12) {
    discountPercent = 10;
  }

  const discountAmount = Math.round((unitPriceBeforeDiscount * discountPercent) / 100);
  const finalUnitPrice = unitPriceBeforeDiscount - discountAmount;
  const grandTotal = finalUnitPrice * state.quantity;

  // DP hanya berlaku untuk produk >= 12 pcs
  const isDpAllowed = state.quantity >= 12;

  useEffect(() => {
    if (!isDpAllowed && paymentType === 'dp_50') {
      setPaymentType('full');
    }
  }, [isDpAllowed, paymentType]);

  // Payment breakdown amounts
  const dpAmount = isDpAllowed && paymentType === 'dp_50' ? Math.round(grandTotal * 0.5) : grandTotal;
  const remainingAmount = isDpAllowed && paymentType === 'dp_50' ? grandTotal - dpAmount : 0;

  const getSizeSummaryText = () => {
    if (!state.sizeBreakdown) return `Size ${state.size} (${state.quantity} pcs)`;
    const entries = Object.entries(state.sizeBreakdown).filter(([, q]) => Number(q) > 0);
    if (entries.length === 0) return `Size ${state.size} (${state.quantity} pcs)`;
    if (entries.length === 1) return `Size ${entries[0][0]} (${entries[0][1]} pcs)`;
    return entries.map(([s, q]) => `${s}: ${q}`).join(', ') + ` (Total ${state.quantity} pcs)`;
  };

  // Generate WhatsApp order message with Customer Info & Payment Details
  const generateWAMessage = (
    name = customerName,
    phone = customerPhone,
    city = shippingCity,
    address = shippingAddress,
    notes = customerNotes
  ) => {
    const text = `Saya mau order -> ini kode order yang sudah saya buat ${orderCode}, ditunggu konfirmasinya ya

---------------------------------------
👤 *DATA PEMESAN & PENGIRIMAN*
• Nama Pemesan: ${name || 'Pelanggan'}
• No. WhatsApp: ${phone || '-'}
• Kota / Wilayah: ${city || '-'}
• Alamat Lengkap: ${address || '-'}
${notes ? `• Catatan Khusus: ${notes}\n` : ''}---------------------------------------
📋 *DETAIL KAOS (${orderCode})*
• Model: ${state.neckType === 'round' ? 'Round Neck (O-Neck)' : 'V-Neck'} (${state.sleeveType === 'short' ? 'Lengan Pendek' : 'Lengan Panjang'})
• Warna: ${state.color.name}
• Bahan: ${state.material.name} (${state.material.gsm})
• Rincian Ukuran: ${getSizeSummaryText()}
• Teknik Sablon: ${state.technique.name}
${
  activePrintBreakdown.length > 0
    ? activePrintBreakdown
        .map((p) => `• Sisi ${p.placement}: ${p.name}`)
        .join('\n')
    : '• Polos'
}
---------------------------------------
💳 *SKEMA PEMBAYARAN & TAGIHAN*
• Total Pesanan: Rp ${grandTotal.toLocaleString('id-ID')}
• Skema Pembayaran: ${paymentType === 'dp_50' ? 'Uang Muka (DP 50%)' : 'Lunas 100%'}
• Tagihan Saat Ini (DP): Rp ${dpAmount.toLocaleString('id-ID')}
${paymentType === 'dp_50' ? `• Sisa Pelunasan (Dibayar Saat Siap Kirim): Rp ${remainingAmount.toLocaleString('id-ID')}\n` : ''}• Rekening Transfer: ${bankAccounts[0]?.bankName || 'BCA'} ${bankAccounts[0]?.accountNumber || '-'} a.n ${bankAccounts[0]?.holderName || 'Vendor'}
---------------------------------------`;
    return encodeURIComponent(text);
  };

  const recordOrderSimple = () => {
    addOrder({
      id: orderCode,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'Waiting for Payment',
      customerName: customerName || 'Pelanggan WhatsApp',
      customerPhone: customerPhone || undefined,
      shippingCity: shippingCity || undefined,
      shippingAddress: shippingAddress || undefined,
      customerNotes: customerNotes || undefined,
      neckType: state.neckType,
      sleeveType: state.sleeveType,
      colorName: state.color.name,
      colorHex: state.color.hex,
      materialName: state.material.name,
      materialGsm: state.material.gsm,
      techniqueName: state.technique.name,
      size: getSizeSummaryText(),
      sizeBreakdown: state.sizeBreakdown,
      quantity: state.quantity,
      printBreakdown: activePrintBreakdown,
      unitPrice: finalUnitPrice,
      discountPercent: discountPercent,
      grandTotal: grandTotal,
      paymentType,
      dpAmount,
      remainingAmount,
      userId: currentUser?.id,
      userEmail: currentUser?.email,
    });
  };

  const generateOrderDetailsText = () => {
    return `DETAIL PESANAN CUSTOM APPAREL BANDUNG.ID
=====================================
Kode Order: ${orderCode}
Tanggal: ${new Date().toLocaleString('id-ID')}

DATA PEMESAN:
- Nama: ${customerName || 'Pelanggan'}
- No. WhatsApp: ${customerPhone || '-'}
- Kota: ${shippingCity || '-'}
- Alamat: ${shippingAddress || '-'}
- Catatan: ${customerNotes || '-'}

SPESIFIKASI KAOS:
- Model: ${state.neckType === 'round' ? 'Round Neck' : 'V-Neck'} (${state.sleeveType === 'short' ? 'Lengan Pendek' : 'Lengan Panjang'})
- Warna: ${state.color.name} (${state.color.hex})
- Bahan: ${state.material.name} (${state.material.gsm})
- Ukuran: ${getSizeSummaryText()}
- Jumlah: ${state.quantity} pcs
- Teknik Sablon: ${state.technique.name}

AREA CETAK:
${activePrintBreakdown.length > 0 ? activePrintBreakdown.map(p => `- ${p.placement}: ${p.name} (Rp ${p.cost.toLocaleString('id-ID')})`).join('\n') : '- Polos (tanpa sablon)'}

RINCIAN BIAYA & PEMBAYARAN:
- Harga Satuan: Rp ${finalUnitPrice.toLocaleString('id-ID')}
- Diskon: ${discountPercent}%
- Grand Total: Rp ${grandTotal.toLocaleString('id-ID')}
- Skema Pembayaran: ${paymentType === 'dp_50' ? 'Uang Muka (DP 50% Mulai Produksi)' : 'Lunas 100%'}
- Tagihan Awal (DP): Rp ${dpAmount.toLocaleString('id-ID')}
- Sisa Pelunasan: Rp ${remainingAmount.toLocaleString('id-ID')} (Ditagihkan saat selesai QC & siap kirim)
- Rekening Transfer: ${bankAccounts.map((b) => `${b.bankName} ${b.accountNumber} (${b.holderName})`).join(' | ')}
=====================================`;
  };

  const handleAddToCart = async () => {
    setIsAddingToCart(true);
    try {
      let mockupPreview: string | undefined;
      let mockupPreviews: Partial<Record<ViewAngle, string>> | undefined;
      try {
        const captured = await onCaptureAllMockups();
        mockupPreview = captured.primary;
        mockupPreviews = captured.all;
      } catch (err) {
        console.warn('Gagal capture mockup untuk keranjang:', err);
      }

      const item: CartItem = {
        id: 'ITEM-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
        createdAt: new Date().toISOString(),
        neckType: state.neckType,
        sleeveType: state.sleeveType,
        colorName: state.color.name,
        colorHex: state.color.hex,
        materialName: state.material.name,
        materialGsm: state.material.gsm,
        techniqueName: state.technique.name,
        size: getSizeSummaryText(),
        sizeBreakdown: state.sizeBreakdown,
        quantity: state.quantity,
        printBreakdown: activePrintBreakdown,
        unitPrice: finalUnitPrice,
        discountPercent: discountPercent,
        subtotal: grandTotal,
        mockupPreview,
        mockupPreviews,
        designs: state.designs,
      };

      addToCart(item);
      setShowAddedToCartModal(true);
    } catch (err) {
      console.error('Error adding to cart:', err);
      alert('Gagal menambahkan ke keranjang. Silakan coba lagi.');
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleSubmitOrderForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim() || !shippingAddress.trim()) {
      alert('Mohon lengkapi Nama, No. WhatsApp, dan Alamat Pengiriman.');
      return;
    }

    // Pre-open window immediately during user click event to bypass browser popup blockers!
    const waWindow = window.open('about:blank', '_blank');

    setIsProcessingOrder(true);
    setUploadStatus('Membuat preview mockup semua sisi...');

    try {
      // 1. Capture mockup previews for all sides (front, back, sleeve-left, sleeve-right)
      let mockupPreview: string | undefined;
      let mockupPreviews: Partial<Record<ViewAngle, string>> | undefined;
      try {
        const captured = await onCaptureAllMockups();
        mockupPreview = captured.primary;
        mockupPreviews = captured.all;
      } catch (err) {
        console.warn('Gagal capture mockup previews:', err);
      }

      // 2. Capture design files as base64
      setUploadStatus('Memproses file desain...');
      const designFilesList: { fileName: string; dataUrl: string; view: ViewAngle }[] = [];
      for (const [view, design] of Object.entries(state.designs)) {
        if (design) {
          try {
            const dataUrl = await imageUrlToDataUrl(design.imageUrl);
            designFilesList.push({ fileName: design.fileName, dataUrl, view: view as ViewAngle });
          } catch (err) {
            console.warn(`Gagal convert design ${view}:`, err);
          }
        }
      }

      // 3. Upload to Google Drive (if configured)
      let driveFolderUrl: string | undefined;
      if (isDriveConfigured()) {
        setUploadStatus('Mengupload ke Google Drive...');
        const result = await uploadOrderToDrive({
          orderId: orderCode,
          orderDetails: generateOrderDetailsText(),
          mockupPreview,
          mockupPreviews: mockupPreviews
            ? Object.entries(mockupPreviews).map(([v, dataUrl]) => ({ view: v, dataUrl: dataUrl! }))
            : undefined,
          designFiles: designFilesList,
        });
        if (result.success && result.folderUrl) {
          driveFolderUrl = result.folderUrl;
        } else {
          console.warn('Drive upload warning:', result.error);
        }
      }

      // 4. Record order to localStorage (with images + drive link + payment breakdown)
      addOrder({
        id: orderCode,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'Waiting for Payment',
        customerName: customerName || 'Pelanggan WhatsApp',
        customerPhone: customerPhone || undefined,
        shippingCity: shippingCity || undefined,
        shippingAddress: shippingAddress || undefined,
        customerNotes: customerNotes || undefined,
        neckType: state.neckType,
        sleeveType: state.sleeveType,
        colorName: state.color.name,
        colorHex: state.color.hex,
        materialName: state.material.name,
        materialGsm: state.material.gsm,
        techniqueName: state.technique.name,
        size: getSizeSummaryText(),
        sizeBreakdown: state.sizeBreakdown,
        quantity: state.quantity,
        printBreakdown: activePrintBreakdown,
        unitPrice: finalUnitPrice,
        discountPercent: discountPercent,
        grandTotal: grandTotal,
        paymentType,
        dpAmount,
        remainingAmount,
        userId: currentUser?.id,
        userEmail: currentUser?.email,
        mockupPreview,
        mockupPreviews,
        designFiles: designFilesList,
        driveFolderUrl,
      });

      // 5. Navigate the pre-opened tab to WhatsApp
      const waText = generateWAMessage(customerName, customerPhone, shippingCity, shippingAddress, customerNotes);
      const waUrl = `https://wa.me/${targetWhatsAppNumber}?text=${waText}`;

      if (waWindow && !waWindow.closed) {
        waWindow.location.href = waUrl;
      } else {
        // Fallback
        window.open(waUrl, '_blank');
      }

      setOrderSubmitted(true);
      setShowOrderModal(false);

      // 6. Smooth redirect to tracking page with order ID
      setTimeout(() => {
        window.location.hash = `/cekorderan?id=${orderCode}`;
      }, 200);
    } catch (err) {
      if (waWindow && !waWindow.closed) {
        waWindow.close();
      }
      console.error('Order processing error:', err);
      alert('Terjadi error saat memproses pesanan. Silakan coba lagi.');
    } finally {
      setIsProcessingOrder(false);
      setUploadStatus('');
    }
  };

  const handleCopySpecs = () => {
    recordOrderSimple();
    const rawText = decodeURIComponent(generateWAMessage());
    navigator.clipboard.writeText(rawText);
    setCopiedWA(true);
    setTimeout(() => setCopiedWA(false), 2500);
  };

  return (
    <>
      {/* Sticky Bottom Bar */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-3 sm:px-4 py-2.5 sm:py-3 shadow-lg">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2 sm:gap-3">
          {/* Price Overview */}
          <div className="flex items-center gap-3 sm:gap-6 w-full md:w-auto justify-between md:justify-start">
            <div>
              <div className="text-[9px] sm:text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                Est. Harga / Pcs
              </div>
              <div className="flex items-baseline gap-1.5 sm:gap-2">
                <span className="text-lg sm:text-xl md:text-2xl font-black text-slate-900">
                  Rp {finalUnitPrice.toLocaleString('id-ID')}
                </span>
                {discountPercent > 0 && (
                  <>
                    <span className="text-[10px] sm:text-xs text-slate-400 line-through hidden sm:inline">
                      Rp {unitPriceBeforeDiscount.toLocaleString('id-ID')}
                    </span>
                    <span className="text-[9px] sm:text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1 sm:px-1.5 py-0.5 rounded-full">
                      -{discountPercent}%
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-100 px-2 sm:px-2.5 py-1.5 rounded-xl border border-slate-200">
              <span className="text-[10px] sm:text-xs font-semibold text-slate-600 mr-0.5 sm:mr-1">Qty:</span>
              <button
                onClick={() => onUpdateQuantity(Math.max(1, state.quantity - 1))}
                className="w-6 h-6 rounded-lg bg-white shadow-xs flex items-center justify-center text-slate-600 hover:bg-slate-200 transition"
              >
                <Minus className="w-3 h-3" />
              </button>
              <input
                type="number"
                min="1"
                value={state.quantity}
                onChange={(e) => onUpdateQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-10 sm:w-12 text-center text-xs font-bold bg-transparent border-none focus:outline-hidden"
              />
              <button
                onClick={() => onUpdateQuantity(state.quantity + 1)}
                className="w-6 h-6 rounded-lg bg-white shadow-xs flex items-center justify-center text-slate-600 hover:bg-slate-200 transition"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>

            {/* Total */}
            <div className="hidden lg:block border-l border-slate-200 pl-4">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                Total ({state.quantity} pcs)
              </div>
              <div className="text-base font-bold text-sky-700 font-mono">
                Rp {grandTotal.toLocaleString('id-ID')}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2 w-full md:w-auto">
            {/* View Specs */}
            <button
              onClick={() => setShowSpecModal(true)}
              className="flex-1 md:flex-initial flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-2 sm:py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-[11px] sm:text-xs font-semibold transition"
            >
              <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500" />
              <span className="hidden sm:inline">Rincian</span>
              <span className="sm:hidden">Detail</span>
            </button>

            {/* Download Mockup */}
            <button
              onClick={onExportMockup}
              className="flex-1 md:flex-initial flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-2 sm:py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-[11px] sm:text-xs font-semibold transition"
            >
              <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500" />
              <span className="hidden sm:inline">Download</span>
              <span className="sm:hidden">Save</span>
            </button>

            {/* Add to Cart Button */}
            <button
              onClick={handleAddToCart}
              disabled={isAddingToCart}
              className="flex-1 md:flex-initial flex items-center justify-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-2 sm:py-2.5 rounded-xl border border-sky-300 bg-sky-50 hover:bg-sky-100 text-sky-800 text-[11px] sm:text-xs font-bold transition cursor-pointer shadow-2xs disabled:opacity-50"
              title="Simpan desain ini ke keranjang belanja"
            >
              {isAddingToCart ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-600" />
              ) : (
                <ShoppingBag className="w-3.5 h-3.5 text-sky-600" />
              )}
              <span>+ Keranjang</span>
            </button>

            {/* Order Now Button with Customer Info Modal */}
            <button
              onClick={() => {
                setOrderSubmitted(false);
                setShowOrderModal(true);
              }}
              className="flex-1 md:flex-initial flex items-center justify-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] sm:text-xs font-bold shadow-md shadow-emerald-600/20 transition cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Order Now</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Production Specs Breakdown Modal */}
      {showSpecModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 border border-slate-150 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Rincian Spesifikasi & Biaya Produksi
                </h3>
                <span className="text-[11px] font-mono text-slate-500">
                  Kode Order: <strong className="text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200">{orderCode}</strong>
                </span>
              </div>
              <button
                onClick={() => setShowSpecModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-4 text-xs">
              {/* Kaos & Bahan */}
              <div className="bg-slate-50 p-3.5 rounded-2xl space-y-1.5">
                <div className="font-bold text-slate-800 text-[13px]">Spesifikasi Kaos</div>
                <div className="flex justify-between text-slate-600">
                  <span>Kain: {state.material.name}</span>
                  <span className="font-mono font-semibold">
                    Rp {state.material.basePrice.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>
                    Kerah: {state.neckType === 'round' ? 'Round Neck' : 'V-Neck'} • Lengan:{' '}
                    {state.sleeveType === 'short' ? 'Pendek' : 'Panjang'}
                  </span>
                  <span className="font-mono">{sleeveExtra > 0 ? `+Rp ${sleeveExtra.toLocaleString('id-ID')}` : 'Rp 0'}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Warna: {state.color.name}</span>
                  <span className="font-mono text-slate-800 font-semibold">{getSizeSummaryText()}</span>
                </div>
              </div>

              {/* Sablon Breakdown */}
              <div className="bg-slate-50 p-3.5 rounded-2xl space-y-1.5">
                <div className="font-bold text-slate-800 text-[13px] flex items-center justify-between">
                  <span>Teknik: {state.technique.name}</span>
                  <span className="text-[10px] text-sky-700 bg-sky-100 px-2 py-0.5 rounded-full">
                    {state.technique.badge}
                  </span>
                </div>

                {activePrintBreakdown.length > 0 ? (
                  activePrintBreakdown.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-slate-600">
                      <span>
                        • Area {item.placement}: {item.name}
                      </span>
                      <span className="font-mono font-semibold">
                        Rp {item.cost.toLocaleString('id-ID')}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-slate-400 italic">Belum ada area sablon yang diisi gambar.</div>
                )}
              </div>

              {/* Kalkulasi Total */}
              <div className="border-t border-slate-200 pt-3 space-y-1.5">
                <div className="flex justify-between text-slate-600">
                  <span>Harga Satuan (sebelum diskon):</span>
                  <span className="font-mono">Rp {unitPriceBeforeDiscount.toLocaleString('id-ID')}</span>
                </div>
                {discountPercent > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Diskon Qty ({discountPercent}%):</span>
                    <span className="font-mono">-Rp {discountAmount.toLocaleString('id-ID')}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-900 font-bold text-sm pt-1 border-t border-slate-100">
                  <span>Harga Satuan Netto:</span>
                  <span className="font-mono">Rp {finalUnitPrice.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-sky-700 font-bold text-base pt-1">
                  <span>Grand Total ({state.quantity} pcs):</span>
                  <span className="font-mono">Rp {grandTotal.toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={handleCopySpecs}
                className="flex-1 py-2.5 px-3 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs flex items-center justify-center gap-1.5 transition"
              >
                {copiedWA ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
                <span>{copiedWA ? 'Teks Berhasil Disalin!' : 'Copy Spek untuk Chat Vendor'}</span>
              </button>
              <button
                onClick={() => setShowSpecModal(false)}
                className="py-2.5 px-4 rounded-xl bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Checkout & Shipping Address Modal */}
      {showOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-5 sm:p-6 border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Checkout Custom Apparel Bandung.id</span>
                <h3 className="text-base font-bold text-slate-900">
                  Data Pemesan & Pengiriman
                </h3>
              </div>
              <button
                onClick={() => setShowOrderModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {!orderSubmitted ? (
              <form onSubmit={handleSubmitOrderForm} className="space-y-4 text-xs">
                {/* Order Summary Strip */}
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-150 space-y-1.5 text-slate-700">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] font-bold text-slate-500">
                      KODE: <strong className="text-sky-700 font-mono">{orderCode}</strong>
                    </span>
                    <span className="font-mono font-bold text-sky-700 text-sm">
                      Rp {grandTotal.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-600 flex items-center gap-1.5 flex-wrap">
                    <span
                      className="w-2.5 h-2.5 rounded-full border border-slate-300"
                      style={{ backgroundColor: state.color.hex }}
                    />
                    <span>{state.color.name}</span>
                    <span>•</span>
                    <span>{state.material.name}</span>
                    <span>•</span>
                    <span>{getSizeSummaryText()}</span>
                  </div>
                </div>

                {/* Data Pemesan */}
                <div className="space-y-3">
                  <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-sky-500" />
                    <span>Identitas Pemesan</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">
                        Nama Lengkap / Instansi <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Contoh: Budi Santoso / PT. ABC"
                        className="w-full p-2.5 rounded-xl border border-slate-300 bg-white focus:outline-none focus:border-slate-900 transition"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">
                        Nomor WhatsApp / HP <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="tel"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        required
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value.replace(/[^0-9]/g, ''))}
                        placeholder="Contoh: 081234567890"
                        className="w-full p-2.5 rounded-xl border border-slate-300 bg-white focus:outline-none focus:border-slate-900 transition font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Alamat Pengiriman */}
                <div className="space-y-3 pt-1">
                  <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Alamat Pengiriman</span>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      Kota / Kabupaten & Provinsi <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={shippingCity}
                      onChange={(e) => setShippingCity(e.target.value)}
                      placeholder="Contoh: Kota Bandung, Jawa Barat"
                      className="w-full p-2.5 rounded-xl border border-slate-300 bg-white focus:outline-none focus:border-slate-900 transition"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      Alamat Lengkap (Jalan, RT/RW, Kelurahan, Kecamatan, Kodepos) <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={shippingAddress}
                      onChange={(e) => setShippingAddress(e.target.value)}
                      placeholder="Contoh: Jl. Riau No. 45, RT 02/RW 04, Citarum, Kec. Bandung Wetan, 40115"
                      className="w-full p-2.5 rounded-xl border border-slate-300 bg-white focus:outline-none focus:border-slate-900 transition resize-none"
                    />
                  </div>
                </div>

                {/* Skema Pembayaran (DP 50% vs Lunas) */}
                <div className="space-y-3 pt-1">
                  <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wider flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-sky-600" />
                      <span>Teknis Pembayaran (Transfer Bank Manual)</span>
                    </span>
                  </div>

                  {/* Payment Type Selection Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* Option 1: DP 50% */}
                    <div
                      onClick={() => {
                        if (isDpAllowed) setPaymentType('dp_50');
                      }}
                      className={`p-3 rounded-2xl border-2 transition flex flex-col justify-between gap-1.5 ${
                        !isDpAllowed
                          ? 'opacity-50 border-slate-200 bg-slate-50 cursor-not-allowed'
                          : paymentType === 'dp_50'
                          ? 'border-sky-600 bg-sky-50/60 shadow-xs ring-2 ring-sky-500/20 cursor-pointer'
                          : 'border-slate-200 bg-white hover:border-slate-300 cursor-pointer'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                            !isDpAllowed
                              ? 'border-slate-300 bg-slate-200'
                              : paymentType === 'dp_50'
                              ? 'border-sky-600 bg-sky-600 text-white'
                              : 'border-slate-300'
                          }`}>
                            {isDpAllowed && paymentType === 'dp_50' && <span className="w-1.5 h-1.5 bg-white rounded-full" />}
                          </span>
                          <span>Uang Muka (DP 50%)</span>
                        </span>
                        {isDpAllowed ? (
                          <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded">
                            Rekomendasi
                          </span>
                        ) : (
                          <span className="text-[9px] bg-slate-200 text-slate-600 font-bold px-1.5 py-0.5 rounded">
                            Min. 12 pcs
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 leading-tight">
                        {isDpAllowed
                          ? 'Bayar 50% sekarang untuk masuk meja sablon. Pelunasan sisa saat kaos siap kirim.'
                          : 'DP 50% hanya berlaku untuk pemesanan minimal 12 pcs. Pesanan di bawah 12 pcs wajib bayar lunas.'}
                      </div>
                      <div className="pt-1.5 border-t border-slate-200/60 flex items-baseline justify-between">
                        <span className="text-[10px] text-slate-500 font-semibold">Bayar Sekarang:</span>
                        <span className="font-mono font-bold text-sky-700 text-xs sm:text-sm">
                          {isDpAllowed ? `Rp ${Math.round(grandTotal * 0.5).toLocaleString('id-ID')}` : '-'}
                        </span>
                      </div>
                    </div>

                    {/* Option 2: Full Payment */}
                    <div
                      onClick={() => setPaymentType('full')}
                      className={`p-3 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between gap-1.5 ${
                        paymentType === 'full'
                          ? 'border-sky-600 bg-sky-50/60 shadow-xs ring-2 ring-sky-500/20'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${paymentType === 'full' ? 'border-sky-600 bg-sky-600 text-white' : 'border-slate-300'}`}>
                            {paymentType === 'full' && <span className="w-1.5 h-1.5 bg-white rounded-full" />}
                          </span>
                          <span>Bayar Lunas 100%</span>
                        </span>
                        <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                          Lunas di Awal
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 leading-tight">
                        Bayar penuh di awal agar paket langsung dikirim kurir begitu beres QC tanpa tunggu pelunasan.
                      </div>
                      <div className="pt-1.5 border-t border-slate-200/60 flex items-baseline justify-between">
                        <span className="text-[10px] text-slate-500 font-semibold">Bayar Sekarang:</span>
                        <span className="font-mono font-bold text-slate-900 text-xs sm:text-sm">
                          Rp {grandTotal.toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Bank Transfer Details with One-Click Copy */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                      Rekening Tujuan Transfer Vendor:
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {bankAccounts.map((b) => (
                        <div
                          key={b.bankName}
                          className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center justify-between gap-2 shadow-2xs"
                        >
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-xs text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-100">
                                {b.bankName}
                              </span>
                              <span className="text-xs font-mono font-bold text-slate-900">
                                {b.accountNumber}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-500 mt-0.5">
                              a.n {b.holderName}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCopyAccount(b.accountNumber)}
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition flex-shrink-0 cursor-pointer"
                            title="Salin Nomor Rekening"
                          >
                            {copiedAccount === b.accountNumber ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                    <p className="text-[10px] text-slate-500 italic">
                      * Silakan transfer nominal <strong>{paymentType === 'dp_50' ? `DP Rp ${Math.round(grandTotal * 0.5).toLocaleString('id-ID')}` : `Lunas Rp ${grandTotal.toLocaleString('id-ID')}`}</strong> ke rekening resmi di atas. Bukti transfer dapat dilampirkan langsung saat WhatsApp terbuka.
                    </p>
                  </div>
                </div>

                {/* Catatan Tambahan */}
                <div className="space-y-2 pt-1">
                  <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                    <FileEdit className="w-3.5 h-3.5 text-amber-500" />
                    <span>Catatan Khusus Sablon / Produksi (Opsional)</span>
                  </div>
                  <textarea
                    rows={2}
                    value={customerNotes}
                    onChange={(e) => setCustomerNotes(e.target.value)}
                    placeholder="Contoh: Mohon warna sablon presisi seperti mockup, packing plastik opp per pcs, deadline tgl 25..."
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white focus:outline-none focus:border-slate-900 transition resize-none"
                  />
                </div>

                {/* Submit to WA */}
                <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowOrderModal(false)}
                    disabled={isProcessingOrder}
                    className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition disabled:opacity-50"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isProcessingOrder}
                    className={`flex-2 py-3 px-4 rounded-xl text-white font-bold transition shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 ${
                      isProcessingOrder
                        ? 'bg-slate-400 cursor-not-allowed'
                        : 'bg-emerald-600 hover:bg-emerald-700 cursor-pointer'
                    }`}
                  >
                    {isProcessingOrder ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>{uploadStatus || 'Memproses...'}</span>
                      </>
                    ) : (
                      <>
                        <MessageSquare className="w-4 h-4" />
                        <span>Kirim Pesanan ke WhatsApp</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              /* Success / Next Step Screen */
              <div className="py-4 text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900">
                    Pesanan Berhasil Dicatat!
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    Data order telah tersimpan di sistem antrian kami dan jendela WhatsApp telah dibuka untuk konfirmasi ke vendor.
                  </p>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 max-w-xs mx-auto text-center">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Kode Pelacakan Order</div>
                  <div className="text-lg font-mono font-extrabold text-sky-700 tracking-wider mt-0.5">
                    {orderCode}
                  </div>
                </div>

                <div className="pt-2 flex flex-col gap-2">
                  <button
                    onClick={() => {
                      setShowOrderModal(false);
                      window.location.hash = '/cekorderan';
                    }}
                    className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-xs"
                  >
                    <ExternalLink className="w-4 h-4 text-sky-400" />
                    <span>Lacak Status Pesanan Ini Sekarang</span>
                  </button>
                  <button
                    onClick={() => setShowOrderModal(false)}
                    className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition"
                  >
                    Tutup & Lanjut Desain
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Added to Cart Success Notification Modal */}
      {showAddedToCartModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-5 sm:p-6 border border-slate-200 text-center space-y-4 animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900">
                Kaos Berhasil Masuk Keranjang!
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Desain ({state.color.name}, {state.quantity} pcs) telah tersimpan di keranjang belanja Anda.
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowAddedToCartModal(false);
                  if (onOpenCart) onOpenCart();
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4 text-sky-400" />
                <span>Lihat Keranjang & Checkout</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowAddedToCartModal(false);
                  if (onStartNewDesign) onStartNewDesign();
                }}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Plus className="w-4 h-4 text-slate-400" />
                <span>+ Buat Desain Kaos Baru Lainnya</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
