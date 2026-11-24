import React, { useState, useEffect } from 'react';
import type { CartItem, CustomerOrder, AppUser } from '../types';
import {
  loadCart,
  removeFromCart,
  updateCartItemQty,
  saveCart,
} from '../services/cartStorage';
import { saveUserDesigns } from '../services/authService';
import { addOrder } from '../services/ordersStorage';
import { getBankAccounts } from '../services/bankConfig';
import { printInvoiceDocument } from '../services/invoiceGenerator';
import { validateCoupon } from '../services/couponStorage';
import {
  ShoppingBag,
  Trash2,
  X,
  Plus,
  Minus,
  CreditCard,
  Copy,
  Check,
  MessageSquare,
  User,
  MapPin,
  FileEdit,
  Shirt,
  Printer,
  Tag,
} from 'lucide-react';

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartNewDesign?: () => void;
  user?: AppUser | null;
  onOpenAuth?: () => void;
}

export const CartModal: React.FC<CartModalProps> = ({
  isOpen,
  onClose,
  onStartNewDesign,
  user,
  onOpenAuth,
}) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [paymentType, setPaymentType] = useState<'dp_50' | 'full'>('dp_50');
  const [customerName, setCustomerName] = useState(() => user?.fullName || '');
  const [customerPhone, setCustomerPhone] = useState(() => user?.phone || '');
  const [shippingCity, setShippingCity] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');
  const [copiedAccount, setCopiedAccount] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderCode] = useState(() => 'CK' + Math.random().toString(36).substring(2, 8).toUpperCase());

  // Voucher / Promo State
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountType: 'percent' | 'fixed';
    amount: number;
    description: string;
  } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);

  const bankAccounts = getBankAccounts();
  const targetWhatsAppNumber = '62895356338321';

  const refreshCart = () => {
    const items = loadCart();
    setCartItems(items);
  };

  useEffect(() => {
    const items = loadCart();
    setCartItems(items);
    // Centang semua item secara default saat modal dibuka
    setSelectedItemIds(items.map((i) => i.id));
    if (user) {
      if (!customerName && user.fullName) setCustomerName(user.fullName);
      if (!customerPhone && user.phone) setCustomerPhone(user.phone);
      if (items.length > 0) {
        saveUserDesigns(user.id, items);
      }
    }
  }, [isOpen, user]);

  useEffect(() => {
    const handleCartUpdate = () => {
      const items = loadCart();
      setCartItems(items);
      setSelectedItemIds((prev) => {
        // Pertahankan item yang masih ada di cart, dan tambahkan item baru jika ada
        const validExisting = prev.filter((id) => items.some((i) => i.id === id));
        const newItems = items.filter((i) => !prev.includes(i.id)).map((i) => i.id);
        return [...validExisting, ...newItems];
      });
    };
    window.addEventListener('cart-updated', handleCartUpdate);
    return () => window.removeEventListener('cart-updated', handleCartUpdate);
  }, []);

  // Hanya hitung item yang dicentang/dipilih
  const selectedItems = cartItems.filter((item) => selectedItemIds.includes(item.id));
  const totalQuantity = selectedItems.reduce((sum, item) => sum + item.quantity, 0);
  const rawSubtotal = selectedItems.reduce((sum, item) => sum + item.subtotal, 0);

  // Consolidated bulk discount across total pieces
  let bulkDiscountPercent = 0;
  if (totalQuantity >= 100) {
    bulkDiscountPercent = 25;
  } else if (totalQuantity >= 50) {
    bulkDiscountPercent = 18;
  } else if (totalQuantity >= 12) {
    bulkDiscountPercent = 10;
  }

  // Voucher calculation
  let couponDiscountAmount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discountType === 'percent') {
      couponDiscountAmount = Math.round((rawSubtotal * appliedCoupon.amount) / 100);
    } else {
      couponDiscountAmount = Math.min(rawSubtotal, appliedCoupon.amount);
    }
  }

  // If items already have discount applied, we take the rawSubtotal as current total
  const grandTotal = Math.max(0, rawSubtotal - couponDiscountAmount);

  // DP hanya berlaku untuk produk >= 12 pcs
  const isDpAllowed = totalQuantity >= 12;

  useEffect(() => {
    if (!isDpAllowed && paymentType === 'dp_50') {
      setPaymentType('full');
    }
  }, [isDpAllowed, paymentType]);

  const dpAmount = isDpAllowed && paymentType === 'dp_50' ? Math.round(grandTotal * 0.5) : grandTotal;
  const remainingAmount = isDpAllowed && paymentType === 'dp_50' ? grandTotal - dpAmount : 0;

  if (!isOpen) return null;

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError(null);
    const result = validateCoupon(couponCode, rawSubtotal);
    if (result.valid && result.coupon) {
      setAppliedCoupon({
        code: result.coupon.code,
        discountType: result.coupon.discountType,
        amount: result.coupon.amount,
        description: result.coupon.description,
      });
      setCouponCode('');
    } else {
      setCouponError(result.error || 'Kode kupon tidak valid.');
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponError(null);
  };

  // Cetak & Unduh Lembar Invoice Resmi (PDF Printable)
  const handlePrintInvoice = () => {
    printInvoiceDocument({
      orderCode,
      customerName,
      customerPhone,
      shippingCity,
      shippingAddress,
      items: selectedItems,
      rawSubtotal,
      couponDiscountAmount,
      couponCode: appliedCoupon?.code,
      grandTotal,
      paymentType,
      dpAmount,
      remainingAmount,
    });
  };

  const toggleSelectItem = (id: string) => {
    setSelectedItemIds((prev) =>
      prev.includes(id) ? prev.filter((itemI) => itemI !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedItemIds.length === cartItems.length) {
      setSelectedItemIds([]);
    } else {
      setSelectedItemIds(cartItems.map((i) => i.id));
    }
  };

  const handleCopyAccount = (accNo: string) => {
    navigator.clipboard.writeText(accNo);
    setCopiedAccount(accNo);
    setTimeout(() => setCopiedAccount(null), 2500);
  };

  const handleRemove = (id: string) => {
    removeFromCart(id);
    setSelectedItemIds((prev) => prev.filter((itemI) => itemI !== id));
    refreshCart();
  };

  const handleQtyChange = (id: string, delta: number) => {
    const item = cartItems.find((i) => i.id === id);
    if (!item) return;
    const newQty = Math.max(1, item.quantity + delta);
    updateCartItemQty(id, newQty);
    refreshCart();
  };

  const generateCartWAMessage = () => {
    let itemsText = '';
    selectedItems.forEach((item, index) => {
      const rosterText =
        item.jerseyConfig?.roster && item.jerseyConfig.roster.length > 0
          ? `\n• Roster Tim (${item.jerseyConfig.roster.length} pcs):\n  ${item.jerseyConfig.roster
              .map((p, i) => `${i + 1}. ${p.name} #${p.number} (${p.size})`)
              .join('\n  ')}`
          : item.jerseyConfig
          ? `\n• Jersey 3D: #${item.jerseyConfig.playerNumber} ${item.jerseyConfig.playerName}`
          : '';

      itemsText += `
📦 *ITEM #${index + 1} (${item.quantity} pcs)*
• Model: ${item.productTypeName || (item.neckType === 'round' ? 'O-Neck' : 'V-Neck')} (${item.sleeveType === 'short' ? 'Lengan Pendek' : 'Lengan Panjang'})
• Warna: ${item.colorName}
• Bahan: ${item.materialName} ${item.materialGsm ? `(${item.materialGsm})` : ''}
• Ukuran: ${item.size}
• Teknik Sablon: ${item.techniqueName}
• Area Sablon: ${
        item.printBreakdown && item.printBreakdown.length > 0
          ? item.printBreakdown.map((p) => `${p.placement}: ${p.name}`).join(', ')
          : 'Polos'
      }${rosterText}
• Subtotal: Rp ${item.subtotal.toLocaleString('id-ID')}
---------------------------------------`;
    });

    const text = `Saya mau order ${selectedItems.length} jenis desain kaos (Total ${totalQuantity} pcs) -> ini kode order yang sudah saya buat ${orderCode}, ditunggu konfirmasinya ya

---------------------------------------
👤 *DATA PEMESAN & PENGIRIMAN*
• Nama: ${customerName || 'Pelanggan'}
• No. WhatsApp: ${customerPhone || '-'}
• Kota: ${shippingCity || '-'}
• Alamat Lengkap: ${shippingAddress || '-'}
${customerNotes ? `• Catatan Khusus: ${customerNotes}\n` : ''}---------------------------------------
📋 *RINCIAN ITEM PESANAN YANG DIPILIH (${selectedItems.length} DESAIN)*${itemsText}
💳 *SKEMA PEMBAYARAN & TAGIHAN*
• Subtotal Pesanan (${totalQuantity} pcs): Rp ${rawSubtotal.toLocaleString('id-ID')}
${couponDiscountAmount > 0 ? `• Diskon Voucher (${appliedCoupon?.code}): -Rp ${couponDiscountAmount.toLocaleString('id-ID')}\n• Total Akhir: Rp ${grandTotal.toLocaleString('id-ID')}\n` : ''}• Skema Pembayaran: ${paymentType === 'dp_50' ? 'Uang Muka (DP 50%)' : 'Lunas 100%'}
• Tagihan Awal (${paymentType === 'dp_50' ? 'DP' : 'Lunas'}): Rp ${dpAmount.toLocaleString('id-ID')}
${paymentType === 'dp_50' ? `• Sisa Pelunasan (Dibayar Saat Siap Kirim): Rp ${remainingAmount.toLocaleString('id-ID')}\n` : ''}• Rekening Transfer: ${bankAccounts[0]?.bankName || 'BCA'} ${bankAccounts[0]?.accountNumber || '-'} a.n ${bankAccounts[0]?.holderName || 'Vendor'}
---------------------------------------`;

    return encodeURIComponent(text);
  };

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedItems.length === 0) {
      alert('Pilih minimal satu desain kaos yang ingin di-checkout.');
      return;
    }
    if (!customerName.trim() || !customerPhone.trim() || !shippingAddress.trim()) {
      alert('Mohon lengkapi Nama, No. WhatsApp, dan Alamat Pengiriman.');
      return;
    }

    setIsSubmitting(true);
    const waWindow = window.open('about:blank', '_blank');

    try {
      // Create consolidated order for selected items
      const firstItem = selectedItems[0];
      const consolidatedOrder: CustomerOrder = {
        id: orderCode,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'Waiting for Payment',
        customerName: customerName || 'Pelanggan WhatsApp',
        customerPhone: customerPhone || undefined,
        shippingCity: shippingCity || undefined,
        shippingAddress: shippingAddress || undefined,
        customerNotes: customerNotes || undefined,
        neckType: firstItem.neckType,
        sleeveType: firstItem.sleeveType,
        colorName: `${selectedItems.length} Desain (${firstItem.colorName}, dll)`,
        colorHex: firstItem.colorHex,
        materialName: firstItem.materialName,
        materialGsm: firstItem.materialGsm,
        techniqueName: firstItem.techniqueName,
        size: `${totalQuantity} pcs (${selectedItems.length} Model Kaos)`,
        quantity: totalQuantity,
        printBreakdown: firstItem.printBreakdown,
        unitPrice: Math.round(grandTotal / (totalQuantity || 1)),
        discountPercent: bulkDiscountPercent,
        grandTotal: grandTotal,
        paymentType,
        dpAmount,
        remainingAmount,
        userId: user?.id,
        userEmail: user?.email,
        items: selectedItems,
        mockupPreview: firstItem.mockupPreview,
        mockupPreviews: firstItem.mockupPreviews,
      };

      addOrder(consolidatedOrder);

      // Simpan item yang tidak dicentang tetap ada di keranjang
      const remainingCart = cartItems.filter((i) => !selectedItemIds.includes(i.id));
      saveCart(remainingCart);
      refreshCart();

      // Open WhatsApp
      const waText = generateCartWAMessage();
      const waUrl = `https://wa.me/${targetWhatsAppNumber}?text=${waText}`;

      if (waWindow && !waWindow.closed) {
        waWindow.location.href = waUrl;
      } else {
        window.open(waUrl, '_blank');
      }

      onClose();
      setTimeout(() => {
        window.location.hash = `/cekorderan?id=${orderCode}`;
      }, 200);
    } catch (err) {
      if (waWindow && !waWindow.closed) waWindow.close();
      console.error('Checkout cart error:', err);
      alert('Gagal memproses pesanan. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-4 sm:p-6 border border-slate-200 space-y-4 max-h-[92vh] flex flex-col animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center shadow-2xs">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Keranjang Belanja Kaos</span>
                <span className="text-[11px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200">
                  {selectedItems.length} Dipilih / {cartItems.length} Desain ({totalQuantity} pcs)
                </span>
              </h3>
              <p className="text-[11px] text-slate-500">
                Pesan beberapa desain & warna kaos sekaligus dalam satu checkout
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        {cartItems.length === 0 ? (
          <div className="py-12 text-center space-y-3 flex-1 flex flex-col items-center justify-center">
            <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <ShoppingBag className="w-7 h-7" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800">Keranjang Masih Kosong</h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
                Anda belum menambahkan kaos ke keranjang. Buat desain pertama Anda di studio sekarang!
              </p>
            </div>
            <button
              onClick={onClose}
              className="mt-2 py-2.5 px-5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Shirt className="w-4 h-4" />
              <span>Mulai Desain Kaos di Studio</span>
            </button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {/* Account Storage Banner */}
            {user ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-3 py-2 flex items-center justify-between text-xs">
                <span className="text-emerald-800 flex items-center gap-1.5 font-medium">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>
                    Desain otomatis tersimpan di akun: <strong>{user.fullName || user.email}</strong>
                  </span>
                </span>
              </div>
            ) : (
              onOpenAuth && (
                <div className="bg-sky-50 border border-sky-200 rounded-2xl p-2.5 sm:p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-sky-600 flex-shrink-0" />
                    <span className="text-slate-700">
                      Simpan desain di keranjang ini agar tidak hilang saat ganti perangkat.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={onOpenAuth}
                    className="px-3 py-1 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-[11px] whitespace-nowrap cursor-pointer transition shadow-2xs self-start sm:self-auto"
                  >
                    Masuk / Buat Akun
                  </button>
                </div>
              )
            )}

            {/* Action Bar Above Items */}
            <div className="flex items-center justify-between text-xs pt-1 pb-0.5">
              <label className="flex items-center gap-2 font-bold text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={cartItems.length > 0 && selectedItemIds.length === cartItems.length}
                  onChange={handleSelectAll}
                  className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 border-slate-300 cursor-pointer accent-sky-600"
                />
                <span>Pilih Semua ({selectedItemIds.length}/{cartItems.length})</span>
              </label>
              {onStartNewDesign && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onStartNewDesign();
                  }}
                  className="flex items-center gap-1 text-[11px] font-bold text-sky-600 hover:text-sky-700 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Tambah Desain Kaos Baru Lagi</span>
                </button>
              )}
            </div>

            {/* Cart Items List */}
            <div className="space-y-2.5">
              {cartItems.map((item, idx) => {
                const isSelected = selectedItemIds.includes(item.id);
                return (
                  <div
                    key={item.id}
                    className={`p-3 sm:p-3.5 rounded-2xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                      isSelected
                        ? 'bg-slate-50 border-slate-200 shadow-2xs'
                        : 'bg-white border-dashed border-slate-200 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Checkbox Centang */}
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectItem(item.id)}
                        className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 border-slate-300 cursor-pointer flex-shrink-0 accent-sky-600"
                        title={isSelected ? 'Hilangkan centang untuk simpan saja' : 'Centang untuk ikut di-checkout'}
                      />

                      {/* Mockup Thumbnail */}
                      {item.mockupPreview ? (
                        <img
                          src={item.mockupPreview}
                          alt="Kaos"
                          className="w-14 h-16 object-cover rounded-xl border border-slate-200 shadow-2xs bg-white flex-shrink-0"
                        />
                      ) : (
                        <div className="w-14 h-16 rounded-xl border border-slate-200 bg-white flex items-center justify-center flex-shrink-0 text-slate-300">
                          <Shirt className="w-6 h-6" />
                        </div>
                      )}

                      {/* Specs Details */}
                      <div className="space-y-0.5">
                        <div className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5 flex-wrap">
                          <span>Desain #{idx + 1}:</span>
                          <span
                            className="w-2.5 h-2.5 rounded-full border border-slate-300 inline-block"
                            style={{ backgroundColor: item.colorHex }}
                          />
                          <span>{item.colorName}</span>
                          <span className="text-[10px] text-slate-400 font-normal">
                            ({item.productTypeName || (item.neckType === 'round' ? 'O-Neck' : 'V-Neck')}, {item.sleeveType === 'short' ? 'Pendek' : 'Panjang'})
                          </span>
                          {!isSelected && (
                            <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                              Disimpan (Belum Checkout)
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-600">
                          {item.materialName} • {item.techniqueName}
                        </div>
                        <div className="text-[11px] font-semibold text-slate-700">
                          {item.size}
                        </div>
                        {item.jerseyConfig && (
                          <div className="space-y-1">
                            <div className="text-[10px] font-bold text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded inline-block">
                              Jersey 3D: #{item.jerseyConfig.playerNumber} {item.jerseyConfig.playerName}
                            </div>
                            {item.jerseyConfig.roster && item.jerseyConfig.roster.length > 1 && (
                              <details className="text-[10px] text-slate-600 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
                                <summary className="font-bold cursor-pointer text-sky-700 hover:text-sky-800">
                                  Lihat Roster Tim ({item.jerseyConfig.roster.length} Pemain)
                                </summary>
                                <div className="mt-1 max-h-24 overflow-y-auto space-y-0.5 divide-y divide-slate-100 pr-1">
                                  {item.jerseyConfig.roster.map((p, pIdx) => (
                                    <div
                                      key={p.id}
                                      className="pt-0.5 flex items-center justify-between font-mono text-[9px]"
                                    >
                                      <span>
                                        #{pIdx + 1} {p.name} (#{p.number})
                                      </span>
                                      <span className="font-bold text-slate-800">{p.size}</span>
                                    </div>
                                  ))}
                                </div>
                              </details>
                            )}
                          </div>
                        )}
                        {item.printBreakdown && item.printBreakdown.length > 0 && (
                          <div className="text-[10px] text-slate-500 truncate max-w-xs">
                            Area: {item.printBreakdown.map((p) => `${p.placement}`).join(', ')}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Qty & Price & Delete */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200">
                      {/* Quantity Selector */}
                      <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-xl border border-slate-200 shadow-2xs">
                        <button
                          type="button"
                          onClick={() => handleQtyChange(item.id, -1)}
                          className="w-5 h-5 rounded flex items-center justify-center text-slate-500 hover:bg-slate-100 cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-bold font-mono px-1.5 text-xs text-slate-900">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleQtyChange(item.id, 1)}
                          className="w-5 h-5 rounded flex items-center justify-center text-slate-500 hover:bg-slate-100 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Subtotal */}
                      <div className="text-right font-mono font-bold text-slate-900 text-xs sm:text-sm">
                        Rp {item.subtotal.toLocaleString('id-ID')}
                      </div>

                      {/* Delete Item */}
                      <button
                        type="button"
                        onClick={() => handleRemove(item.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                        title="Hapus item ini dari keranjang"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Total Strip */}
            <div className="bg-slate-900 text-white p-3.5 rounded-2xl flex items-center justify-between shadow-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-300 block">
                  Total Checkout ({selectedItems.length} dari {cartItems.length} Desain Dipilih)
                </span>
                <span className="text-xs text-slate-300">
                  Total kuantiti checkout: <strong>{totalQuantity} pcs</strong>
                  {couponDiscountAmount > 0 && (
                    <span className="ml-2 text-emerald-400 font-bold">
                      (Kupon {appliedCoupon?.code}: -Rp {couponDiscountAmount.toLocaleString('id-ID')})
                    </span>
                  )}
                </span>
              </div>
              <div className="text-right">
                {couponDiscountAmount > 0 && (
                  <span className="text-[11px] line-through text-slate-400 block font-mono">
                    Rp {rawSubtotal.toLocaleString('id-ID')}
                  </span>
                )}
                <span className="text-lg font-mono font-black text-sky-400">
                  Rp {grandTotal.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            {/* Voucher / Kupon Promo Box */}
            <div className="p-3 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-transparent border border-amber-200/80 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                <span className="flex items-center gap-1.5 text-amber-700">
                  <Tag className="w-3.5 h-3.5" />
                  <span>Kupon / Voucher Promo</span>
                </span>
                {appliedCoupon && (
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                    Kupon Aktif ✓
                  </span>
                )}
              </div>

              {!appliedCoupon ? (
                <div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="Masukkan kode voucher atau kupon..."
                      className="flex-1 p-2 bg-white rounded-xl border border-slate-300 text-xs font-mono font-bold uppercase focus:outline-none focus:border-amber-500"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      className="py-2 px-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      Gunakan
                    </button>
                  </div>
                  {couponError && (
                    <div className="text-[10px] text-rose-600 mt-1 font-medium">{couponError}</div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-emerald-200 text-xs">
                  <div>
                    <div className="font-bold text-emerald-800 font-mono flex items-center gap-1">
                      <span>{appliedCoupon.code}</span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.2 rounded font-sans">
                        Berhasil Digunakan
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600">{appliedCoupon.description}</div>
                    <div className="text-[11px] font-bold text-emerald-700 mt-0.5">
                      Potongan Hemat: Rp {couponDiscountAmount.toLocaleString('id-ID')}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    className="text-xs text-rose-600 hover:underline font-bold px-2 py-1 cursor-pointer"
                  >
                    Hapus Kupon
                  </button>
                </div>
              )}
            </div>

            {/* Form Checkout Section */}
            <form onSubmit={handleCheckout} className="space-y-4 text-xs pt-1">
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
              <div className="space-y-3">
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
              <div className="space-y-3">
                <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-sky-600" />
                    <span>Teknis Pembayaran (Transfer Bank Manual)</span>
                  </span>
                </div>

                {/* Selection Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
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
                        <span
                          className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                            !isDpAllowed
                              ? 'border-slate-300 bg-slate-200'
                              : paymentType === 'dp_50'
                              ? 'border-sky-600 bg-sky-600 text-white'
                              : 'border-slate-300'
                          }`}
                        >
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
                        ? 'Bayar 50% sekarang untuk produksi. Pelunasan saat seluruh pesanan selesai QC & siap kirim.'
                        : 'DP 50% hanya berlaku untuk pemesanan minimal 12 pcs. Pesanan di bawah 12 pcs wajib bayar lunas.'}
                    </div>
                    <div className="pt-1.5 border-t border-slate-200/60 flex items-baseline justify-between">
                      <span className="text-[10px] text-slate-500 font-semibold">Bayar Sekarang:</span>
                      <span className="font-mono font-bold text-sky-700 text-xs sm:text-sm">
                        {isDpAllowed ? `Rp ${dpAmount.toLocaleString('id-ID')}` : '-'}
                      </span>
                    </div>
                  </div>

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
                        <span
                          className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                            paymentType === 'full' ? 'border-sky-600 bg-sky-600 text-white' : 'border-slate-300'
                          }`}
                        >
                          {paymentType === 'full' && <span className="w-1.5 h-1.5 bg-white rounded-full" />}
                        </span>
                        <span>Bayar Lunas 100%</span>
                      </span>
                      <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                        Lunas di Awal
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 leading-tight">
                      Paket langsung dikirim kurir tanpa menunggu proses pelunasan di akhir.
                    </div>
                    <div className="pt-1.5 border-t border-slate-200/60 flex items-baseline justify-between">
                      <span className="text-[10px] text-slate-500 font-semibold">Bayar Sekarang:</span>
                      <span className="font-mono font-bold text-slate-900 text-xs sm:text-sm">
                        Rp {grandTotal.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bank Details */}
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
                          <div className="text-[10px] text-slate-500 mt-0.5">a.n {b.holderName}</div>
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
                </div>
              </div>

              {/* Catatan Tambahan */}
              <div className="space-y-2">
                <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                  <FileEdit className="w-3.5 h-3.5 text-amber-500" />
                  <span>Catatan Khusus Pesanan (Opsional)</span>
                </div>
                <textarea
                  rows={2}
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  placeholder="Contoh: Packing rapi per model kaos, sablon jangan buram, mohon selesai sebelum tgl 20..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white focus:outline-none focus:border-slate-900 transition resize-none"
                />
              </div>

              {/* Footer Buttons */}
              <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={handlePrintInvoice}
                  disabled={selectedItems.length === 0}
                  className="w-full sm:w-auto py-2.5 px-3.5 rounded-xl border border-sky-300 text-sky-700 bg-sky-50/70 hover:bg-sky-100 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                  title="Cetak invoice resmi atau simpan sebagai PDF"
                >
                  <Printer className="w-4 h-4 text-sky-600" />
                  <span>Cetak Invoice (PDF)</span>
                </button>

                <div className="flex items-center gap-2 w-full sm:flex-1">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition cursor-pointer"
                  >
                    Tutup Keranjang
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || selectedItems.length === 0}
                    className="flex-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>
                      {selectedItems.length === 0
                        ? 'Pilih Minimal 1 Desain Kaos'
                        : `Kirim ke WA (${totalQuantity} pcs)`}
                    </span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
