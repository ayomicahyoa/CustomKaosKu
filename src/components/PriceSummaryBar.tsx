import React, { useState } from 'react';
import type { CustomTShirtState } from '../types';
import { PRINT_ZONE_PRESETS } from '../data/mockData';
import {
  Download,
  Share2,
  FileText,
  Minus,
  Plus,
  CheckCircle,
  X,
  MessageSquare,
} from 'lucide-react';

interface PriceSummaryBarProps {
  state: CustomTShirtState;
  onUpdateQuantity: (qty: number) => void;
  onExportMockup: () => void;
}

export const PriceSummaryBar: React.FC<PriceSummaryBarProps> = ({
  state,
  onUpdateQuantity,
  onExportMockup,
}) => {
  const [showSpecModal, setShowSpecModal] = useState(false);
  const [copiedWA, setCopiedWA] = useState(false);
  const [orderCode] = useState(() => 'CK' + Math.random().toString(36).substring(2, 8).toUpperCase());

  const targetWhatsAppNumber = '62895356338321';

  // Cost calculation
  const sleeveExtra = state.sleeveType === 'long' ? 10000 : 0;
  const baseShirtCost = state.material.basePrice + sleeveExtra;

  // Print costs per zone
  let printCostTotal = 0;
  const activePrintBreakdown: { name: string; cost: number; placement: string }[] = [];

  Object.entries(state.designs).forEach(([view, design]) => {
    if (design) {
      const preset = PRINT_ZONE_PRESETS.find((p) => p.id === design.zonePreset);
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

  // Generate WhatsApp order message
  const generateWAMessage = () => {
    const text = `Saya mau order -> ini kode order yang sudah saya buat ${orderCode}, ditunggu konfirmasinya ya

---------------------------------------
📋 *DETAIL ORDER (${orderCode})*
• Model: ${state.neckType === 'round' ? 'Round Neck (O-Neck)' : 'V-Neck'} (${state.sleeveType === 'short' ? 'Lengan Pendek' : 'Lengan Panjang'})
• Warna: ${state.color.name}
• Bahan: ${state.material.name} (${state.material.gsm})
• Ukuran: ${state.size} | Qty: ${state.quantity} pcs
• Teknik Sablon: ${state.technique.name}
${
  activePrintBreakdown.length > 0
    ? activePrintBreakdown
        .map((p) => `• Sisi ${p.placement}: ${p.name}`)
        .join('\n')
    : '• Polos'
}
• Estimasi Total: Rp ${grandTotal.toLocaleString('id-ID')}
---------------------------------------`;
    return encodeURIComponent(text);
  };

  const handleCopySpecs = () => {
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

            {/* WhatsApp Order */}
            <a
              href={`https://wa.me/${targetWhatsAppNumber}?text=${generateWAMessage()}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 md:flex-initial flex items-center justify-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] sm:text-xs font-bold shadow-md shadow-emerald-600/20 transition cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Order via WhatsApp</span>
              <span className="sm:hidden">WhatsApp</span>
            </a>
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
                  <span className="font-mono">Size: {state.size}</span>
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
    </>
  );
};
