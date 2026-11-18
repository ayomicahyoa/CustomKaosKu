import React, { useState, useEffect } from 'react';
import {
  Search,
  ArrowLeft,
  Package,
  Clock,
  Truck,
  AlertCircle,
  Copy,
  Check,
  MessageSquare,
  Calendar,
  Layers,
  Info,
  MapPin,
  Eye,
} from 'lucide-react';
import type { CustomerOrder, OrderStatus, ViewAngle } from '../types';
import { getOrderById, loadOrders, syncOrdersFromCloud } from '../services/ordersStorage';

interface OrderTrackingPageProps {
  initialOrderId?: string;
  onNavigateToStudio: () => void;
}

const STATUS_PROGRESS_ORDER: OrderStatus[] = [
  'Waiting for Payment',
  'Order masuk DP',
  'On Processed',
  'Ready to send',
  'On Sending',
  'Done',
];

const getUrlOrderId = (): string => {
  if (typeof window === 'undefined') return '';
  const combined = window.location.hash + window.location.search;
  const match = combined.match(/[?&]id=([a-zA-Z0-9\-_]+)/i);
  return match ? match[1] : '';
};

export const OrderTrackingPage: React.FC<OrderTrackingPageProps> = ({
  initialOrderId = '',
  onNavigateToStudio,
}) => {
  const targetId = initialOrderId || getUrlOrderId();
  const [searchInput, setSearchInput] = useState(targetId);
  const [foundOrder, setFoundOrder] = useState<CustomerOrder | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [copiedResi, setCopiedResi] = useState(false);
  const [recentOrders, setRecentOrders] = useState<CustomerOrder[]>([]);
  const [activeAngle, setActiveAngle] = useState<ViewAngle>('front');

  useEffect(() => {
    const all = loadOrders();
    setRecentOrders(all.slice(0, 4));

    // Also background sync from Supabase
    syncOrdersFromCloud().then((cloudOrders) => {
      if (cloudOrders && cloudOrders.length > 0) {
        setRecentOrders(cloudOrders.slice(0, 4));
        const currentTarget = initialOrderId || getUrlOrderId();
        if (currentTarget) {
          const matched = cloudOrders.find(
            (o) => o.id.toLowerCase().replace(/[^a-z0-9]/g, '') === currentTarget.toLowerCase().replace(/[^a-z0-9]/g, '')
          );
          if (matched) {
            setFoundOrder(matched);
            setHasSearched(true);
          }
        }
      }
    });

    const activeId = initialOrderId || getUrlOrderId();
    if (activeId) {
      setSearchInput(activeId);
      const order = getOrderById(activeId);
      if (order) {
        setFoundOrder(order);
        setHasSearched(true);
      }
    }
  }, [initialOrderId]);

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchInput.trim()) return;

    const res = getOrderById(searchInput);
    setFoundOrder(res);
    setHasSearched(true);
  };

  const handleQuickSelect = (id: string) => {
    setSearchInput(id);
    const res = getOrderById(id);
    setFoundOrder(res);
    setHasSearched(true);
  };

  const handleCopyResi = (resi: string) => {
    navigator.clipboard.writeText(resi);
    setCopiedResi(true);
    setTimeout(() => setCopiedResi(false), 2000);
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'Waiting for Payment':
        return {
          bg: 'bg-amber-100 text-amber-800 border-amber-200',
          dot: 'bg-amber-500',
          label: 'Menunggu Pembayaran / DP',
          desc: 'Pesanan telah dicatat. Silakan konfirmasi pembayaran DP ke WhatsApp admin.',
        };
      case 'Order masuk DP':
        return {
          bg: 'bg-sky-100 text-sky-800 border-sky-200',
          dot: 'bg-sky-500',
          label: 'DP Diterima (Antrian Produksi)',
          desc: 'DP berhasil diverifikasi. Pesanan sedang dijadwalkan masuk meja sablon.',
        };
      case 'On Processed':
        return {
          bg: 'bg-indigo-100 text-indigo-800 border-indigo-200',
          dot: 'bg-indigo-500',
          label: 'Sedang Diproduksi & Sablon',
          desc: 'Kaos sedang dalam proses cutting, sablon cetak, dan quality heat press.',
        };
      case 'Ready to send':
        return {
          bg: 'bg-teal-100 text-teal-800 border-teal-200',
          dot: 'bg-teal-500',
          label: 'Selesai Produksi (Siap Kirim)',
          desc: 'Produksi rampung dan telah lolos QC. Menunggu penjemputan oleh kurir.',
        };
      case 'On Sending':
        return {
          bg: 'bg-orange-100 text-orange-800 border-orange-200',
          dot: 'bg-orange-500',
          label: 'Dalam Pengiriman Kurir',
          desc: 'Paket sudah diserahkan ke jasa ekspedisi dan sedang menuju alamat Anda.',
        };
      case 'Done':
        return {
          bg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          dot: 'bg-emerald-500',
          label: 'Pesanan Selesai Diterima',
          desc: 'Paket telah sampai dan pesanan dinyatakan tuntas. Terima kasih!',
        };
      case 'Cancel':
        return {
          bg: 'bg-rose-100 text-rose-800 border-rose-200',
          dot: 'bg-rose-500',
          label: 'Pesanan Dibatalkan',
          desc: 'Pesanan ini telah dibatalkan.',
        };
    }
  };

  const getStepProgressIndex = (status: OrderStatus): number => {
    if (status === 'Cancel') return -1;
    return STATUS_PROGRESS_ORDER.indexOf(status);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans pb-16">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={onNavigateToStudio}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-sky-600 transition py-1.5 px-2.5 rounded-xl hover:bg-slate-100"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Studio Kaos</span>
          </button>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-500 hidden sm:inline">
              Portal Pelacakan Pesanan
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-3xl mx-auto w-full px-4 pt-6 space-y-6 flex-1">
        {/* Hero Title & Search Form */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-5 text-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white mx-auto shadow-md shadow-sky-500/20">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Cek Status Pesanan Kaos
            </h1>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Pantau progres produksi dan nomor resi pengiriman kaos custom Anda secara real-time.
            </p>
          </div>

          {/* Search Box */}
          <form onSubmit={handleSearch} className="max-w-md mx-auto relative flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Masukkan Kode Order (e.g. CK-882910)..."
                className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 text-xs sm:text-sm font-mono transition bg-slate-50/50 uppercase placeholder:normal-case placeholder:font-sans"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
            </div>
            <button
              type="submit"
              className="py-3 px-5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs sm:text-sm font-bold transition shadow-sm flex items-center gap-1.5"
            >
              <span>Lacak</span>
            </button>
          </form>

          {/* Quick Click Samples */}
          {recentOrders.length > 0 && (
            <div className="pt-2 text-center">
              <span className="text-[11px] text-slate-400 block mb-1.5">
                Coba klik contoh kode order aktif:
              </span>
              <div className="flex flex-wrap items-center justify-center gap-1.5">
                {recentOrders.map((o) => (
                  <button
                    key={o.id}
                    onClick={() => handleQuickSelect(o.id)}
                    className="text-[10px] font-mono px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-sky-100 hover:text-sky-700 text-slate-600 transition border border-slate-200/60"
                  >
                    {o.id} ({o.status.split(' ')[0]})
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Search Result */}
        {hasSearched && foundOrder && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
            {/* Status Card */}
            {(() => {
              const badge = getStatusBadge(foundOrder.status);
              const stepIndex = getStepProgressIndex(foundOrder.status);
              return (
                <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-6">
                  {/* Status Banner */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-slate-400">
                          Kode Order:
                        </span>
                        <span className="text-sm font-mono font-extrabold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-lg">
                          {foundOrder.id}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        Dipesan pada:{' '}
                        {new Date(foundOrder.createdAt).toLocaleDateString('id-ID', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>

                    <div
                      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold ${badge.bg}`}
                    >
                      <span className={`w-2 h-2 rounded-full ${badge.dot} animate-pulse`} />
                      <span>{badge.label}</span>
                    </div>
                  </div>

                  {/* WhatsApp Confirmation Banner */}
                  {foundOrder.status === 'Waiting for Payment' && (
                    <div className="p-3.5 sm:p-4 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-transparent border border-emerald-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-emerald-950 shadow-2xs">
                      <div className="flex items-center gap-3 w-full sm:w-auto">
                        <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                          <MessageSquare className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-bold text-xs sm:text-sm">Konfirmasi Pesanan ke WhatsApp Vendor</div>
                          <p className="text-[11px] text-emerald-700">Kirim format rincian order ke WhatsApp admin untuk verifikasi pembayaran & DP.</p>
                        </div>
                      </div>
                      <a
                        href={`https://wa.me/62895356338321?text=${encodeURIComponent(
                          `Saya mau konfirmasi order -> ini kode order yang sudah saya buat ${foundOrder.id}, ditunggu konfirmasinya ya\n\n• Nama: ${foundOrder.customerName || 'Pelanggan'}\n• Total: Rp ${foundOrder.grandTotal.toLocaleString('id-ID')}\n• Ukuran: ${foundOrder.size}`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full sm:w-auto py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition whitespace-nowrap flex items-center justify-center gap-1.5"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span>Kirim Chat ke WhatsApp</span>
                      </a>
                    </div>
                  )}

                  {/* Tracking Stepper (if not canceled) */}
                  {foundOrder.status !== 'Cancel' ? (
                    <div className="py-2">
                      <div className="text-[11px] font-bold text-slate-700 mb-3 flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-sky-500" />
                        <span>Timeline Progres Produksi</span>
                      </div>

                      {/* Stepper Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                        {[
                          { title: '1. Order Masuk', desc: 'Menunggu DP' },
                          { title: '2. DP Diterima', desc: 'Jadwal Produksi' },
                          { title: '3. Di Sablon', desc: 'Sedang Dicetak' },
                          { title: '4. Selesai QC', desc: 'Siap Kirim' },
                          { title: '5. Dikirim', desc: 'Dalam Kurir' },
                          { title: '6. Selesai', desc: 'Telah Diterima' },
                        ].map((step, idx) => {
                          const isDone = idx < stepIndex;
                          const isCurrent = idx === stepIndex;

                          return (
                            <div
                              key={idx}
                              className={`p-2.5 rounded-2xl border text-center transition flex flex-col items-center justify-center gap-1 ${
                                isCurrent
                                  ? 'bg-sky-50 border-sky-300 ring-2 ring-sky-400/20 text-sky-900 shadow-xs'
                                  : isDone
                                  ? 'bg-emerald-50/60 border-emerald-200 text-emerald-800'
                                  : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'
                              }`}
                            >
                              <div
                                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                  isCurrent
                                    ? 'bg-sky-600 text-white'
                                    : isDone
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-slate-200 text-slate-500'
                                }`}
                              >
                                {isDone ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : idx + 1}
                              </div>
                              <div className="text-[10px] font-bold leading-tight mt-0.5">
                                {step.title}
                              </div>
                              <div className="text-[9px] opacity-75">{step.desc}</div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="mt-4 p-3 bg-slate-50 rounded-2xl text-[11px] text-slate-600 border border-slate-150 flex items-start gap-2">
                        <Info className="w-4 h-4 text-sky-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-slate-800 font-semibold">Status Terkini: </strong>
                          {badge.desc}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-rose-50 rounded-2xl border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
                      <div>
                        <strong>Pesanan Dibatalkan: </strong>
                        {foundOrder.adminNotes || 'Hubungi admin via WhatsApp untuk informasi lebih lanjut.'}
                      </div>
                    </div>
                  )}

                  {/* Resi Box if available */}
                  {foundOrder.trackingNumber && (
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-orange-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center">
                          <Truck className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-[10px] font-bold text-orange-900 uppercase tracking-wider">
                            Nomor Resi Ekspedisi ({foundOrder.courier || 'Kurir Reguler'})
                          </div>
                          <div className="text-sm sm:text-base font-mono font-black text-slate-900 tracking-wider">
                            {foundOrder.trackingNumber}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleCopyResi(foundOrder.trackingNumber!)}
                        className="py-1.5 px-3 rounded-xl bg-white border border-orange-300 text-orange-900 hover:bg-orange-100 text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs"
                      >
                        {copiedResi ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedResi ? 'Resi Tersalin!' : 'Salin Resi'}</span>
                      </button>
                    </div>
                  )}

                  {/* Mockup Preview Image (Multi-Angle or Single) */}
                  {(foundOrder.mockupPreview || foundOrder.mockupPreviews) && (() => {
                    const hasMultiAngles =
                      foundOrder.mockupPreviews &&
                      Object.keys(foundOrder.mockupPreviews).length > 1;

                    const currentImage = hasMultiAngles
                      ? foundOrder.mockupPreviews?.[activeAngle] || foundOrder.mockupPreview
                      : foundOrder.mockupPreview || (foundOrder.mockupPreviews && Object.values(foundOrder.mockupPreviews)[0]);

                    return (
                      <div className="space-y-3 pt-1">
                        <div className="flex items-center justify-between">
                          <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                            <Eye className="w-4 h-4 text-indigo-500" />
                            <span>
                              {hasMultiAngles
                                ? 'Preview Desain Kaos Anda (Multi-Sudut)'
                                : 'Preview Desain Kaos Anda'}
                            </span>
                          </div>

                          {/* Angle Switcher Tabs (Only if order has multi angles) */}
                          {hasMultiAngles && (
                            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-[10px] font-bold">
                              {[
                                { id: 'front' as ViewAngle, label: 'Depan' },
                                { id: 'back' as ViewAngle, label: 'Belakang' },
                                { id: 'sleeve-left' as ViewAngle, label: 'Lengan Kiri' },
                                { id: 'sleeve-right' as ViewAngle, label: 'Lengan Kanan' },
                              ].map((tab) => {
                                const exists = !!foundOrder.mockupPreviews?.[tab.id];
                                return (
                                  <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setActiveAngle(tab.id)}
                                    className={`px-2.5 py-1 rounded-lg transition ${
                                      activeAngle === tab.id
                                        ? 'bg-white text-slate-900 shadow-2xs'
                                        : 'text-slate-500 hover:text-slate-800'
                                    } ${!exists ? 'opacity-50' : ''}`}
                                  >
                                    {tab.label}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        <div className="bg-slate-50 rounded-2xl border border-slate-150 p-4 flex justify-center">
                          {currentImage ? (
                            <img
                              src={currentImage}
                              alt={`Preview Mockup Kaos (${hasMultiAngles ? activeAngle : 'Utama'})`}
                              className="max-h-72 rounded-xl shadow-md border border-slate-200 object-contain"
                            />
                          ) : (
                            <div className="py-12 text-center text-xs text-slate-400">
                              Preview tidak tersedia untuk sudut ini.
                            </div>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 text-center italic">
                          * Preview ini adalah simulasi digital foto asli{hasMultiAngles ? ` (${activeAngle})` : ''}. Hasil produksi dapat sedikit berbeda tergantung bahan kain dan teknik sablon.
                        </p>
                      </div>
                    );
                  })()}

                  {/* Order Specs Breakdown */}
                  <div className="space-y-3 pt-2">
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-slate-500" />
                      <span>Rincian Spesifikasi Kaos</span>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-2xl space-y-2 text-xs text-slate-700 border border-slate-150">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
                        <span className="text-slate-500">Model & Warna:</span>
                        <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                          <span
                            className="w-3 h-3 rounded-full border border-slate-300"
                            style={{ backgroundColor: foundOrder.colorHex }}
                          />
                          {foundOrder.colorName} ({foundOrder.neckType === 'round' ? 'O-Neck' : 'V-Neck'}, {foundOrder.sleeveType === 'short' ? 'Pendek' : 'Panjang'})
                        </span>
                      </div>

                      <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
                        <span className="text-slate-500">Bahan Kain:</span>
                        <span className="font-semibold text-slate-900">
                          {foundOrder.materialName} {foundOrder.materialGsm && `(${foundOrder.materialGsm})`}
                        </span>
                      </div>

                      <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
                        <span className="text-slate-500">Rincian Ukuran & Jumlah:</span>
                        <span className="font-semibold text-slate-900 text-right max-w-[220px]">
                          {foundOrder.size.startsWith('Size ') ? foundOrder.size : `Size ${foundOrder.size}`}
                        </span>
                      </div>

                      <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
                        <span className="text-slate-500">Teknik Sablon:</span>
                        <span className="font-semibold text-slate-900">
                          {foundOrder.techniqueName}
                        </span>
                      </div>

                      {foundOrder.printBreakdown && foundOrder.printBreakdown.length > 0 && (
                        <div className="pt-1 space-y-1">
                          <div className="text-[11px] font-bold text-slate-500">Area Cetak:</div>
                          {foundOrder.printBreakdown.map((p, i) => (
                            <div key={i} className="flex justify-between text-[11px] text-slate-600 pl-2">
                              <span>• {p.placement}: {p.name}</span>
                              <span className="font-mono">Rp {p.cost.toLocaleString('id-ID')}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="pt-2 flex justify-between items-center text-sm font-bold border-t border-slate-200">
                        <span className="text-slate-800">Total Tagihan ({foundOrder.quantity} pcs):</span>
                        <span className="text-base text-sky-700 font-mono">
                          Rp {foundOrder.grandTotal.toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Customer & Shipping Destination */}
                  {(foundOrder.customerName || foundOrder.shippingAddress || foundOrder.customerNotes) && (
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150 space-y-2 text-xs">
                      <div className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                        <MapPin className="w-4 h-4 text-emerald-500" />
                        <span>Data Pengiriman & Pemesan</span>
                      </div>
                      {foundOrder.customerName && (
                        <div className="flex justify-between text-slate-700">
                          <span className="text-slate-500">Penerima:</span>
                          <span className="font-semibold">{foundOrder.customerName} {foundOrder.customerPhone && `(${foundOrder.customerPhone})`}</span>
                        </div>
                      )}
                      {foundOrder.shippingCity && (
                        <div className="flex justify-between text-slate-700">
                          <span className="text-slate-500">Kota / Wilayah:</span>
                          <span className="font-semibold">{foundOrder.shippingCity}</span>
                        </div>
                      )}
                      {foundOrder.shippingAddress && (
                        <div className="text-slate-600 text-[11px] pt-1 border-t border-slate-200/60 leading-relaxed">
                          <strong className="text-slate-700 block text-[10px] uppercase font-bold">Alamat Lengkap:</strong>
                          {foundOrder.shippingAddress}
                        </div>
                      )}
                      {foundOrder.customerNotes && (
                        <div className="mt-1 p-2 rounded-xl bg-amber-50 border border-amber-200/60 text-amber-900 text-[11px] italic">
                          <strong>Catatan Anda: </strong>"{foundOrder.customerNotes}"
                        </div>
                      )}
                    </div>
                  )}

                  {/* Follow up via WhatsApp */}
                  <div className="pt-2">
                    <a
                      href={`https://wa.me/62895356338321?text=${encodeURIComponent(
                        `Halo Admin CustomKaos, saya mau menanyakan pesanan saya dengan kode ${foundOrder.id}. Mohon info update statusnya ya, terima kasih!`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>Chat Admin via WhatsApp Terkait Order Ini</span>
                    </a>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Not Found State */}
        {hasSearched && !foundOrder && (
          <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Kode Order "{searchInput}" Tidak Ditemukan
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                Pastikan Anda memasukkan kode order yang sesuai (misal: <strong>CK-882910</strong>).
                Jika Anda baru saja memesan atau ingin bantuan pengecekan, Anda bisa langsung menghubungi admin kami.
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
              <a
                href={`https://wa.me/62895356338321?text=${encodeURIComponent(
                  `Halo Admin CustomKaos, saya mencari pesanan dengan kode "${searchInput}", namun statusnya tidak ditemukan di website. Mohon bantuannya untuk pengecekan ya, terima kasih!`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Chat Admin via WhatsApp</span>
              </a>

              <button
                type="button"
                onClick={onNavigateToStudio}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold transition cursor-pointer"
              >
                <span>Kembali ke Studio</span>
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
