import React, { useState, useEffect } from 'react';
import {
  X,
  Package,
  ShoppingBag,
  LogOut,
  Calendar,
  ExternalLink,
  Shirt,
  Phone,
  Mail,
} from 'lucide-react';
import type { AppUser, CustomerOrder, CartItem } from '../types';
import { getOrdersForUser } from '../services/ordersStorage';
import { getUserSavedDesigns } from '../services/authService';
import { addToCart } from '../services/cartStorage';

interface UserHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: AppUser;
  onLogout: () => void;
  onOpenCart?: () => void;
  onSelectOrderToTrack?: (orderId: string) => void;
}

export const UserHistoryModal: React.FC<UserHistoryModalProps> = ({
  isOpen,
  onClose,
  user,
  onLogout,
  onOpenCart,
  onSelectOrderToTrack,
}) => {
  const [activeTab, setActiveTab] = useState<'orders' | 'designs'>('orders');
  const [userOrders, setUserOrders] = useState<CustomerOrder[]>([]);
  const [savedDesigns, setSavedDesigns] = useState<CartItem[]>([]);

  useEffect(() => {
    if (isOpen && user) {
      setUserOrders(getOrdersForUser(user.id, user.email, user.phone));
      setSavedDesigns(getUserSavedDesigns(user.id));
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Waiting for Payment':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Order masuk DP':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'On Processed':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Ready to send':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'On Sending':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Done':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Cancel':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const handleAddToCart = (item: CartItem) => {
    // Generate fresh unique cart ID so it never conflicts with items already in cart
    const cartItem: CartItem = {
      ...item,
      id: 'ITEM-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7).toUpperCase(),
      createdAt: new Date().toISOString(),
    };
    addToCart(cartItem);
    if (onOpenCart) {
      onClose();
      onOpenCart();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-4 sm:p-6 border border-slate-200 space-y-4 max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-150">
        {/* Header & User Info */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white flex items-center justify-center font-bold text-base shadow-sm">
              {(user.fullName || user.email).charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                <span>{user.fullName || 'Pelanggan'}</span>
                <span className="text-[10px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200">
                  Member
                </span>
              </h3>
              <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-0.5">
                <span className="flex items-center gap-1">
                  <Mail className="w-3 h-3 text-slate-400" />
                  <span>{user.email}</span>
                </span>
                {user.phone && (
                  <span className="flex items-center gap-1 font-mono">
                    <Phone className="w-3 h-3 text-slate-400" />
                    <span>{user.phone}</span>
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                onLogout();
                onClose();
              }}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
              title="Keluar dari Akun"
            >
              <LogOut className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600 flex-shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className={`flex-1 py-2 rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'orders' ? 'bg-white text-slate-900 shadow-2xs' : 'hover:text-slate-900'
            }`}
          >
            <Package className="w-3.5 h-3.5 text-sky-600" />
            <span>Riwayat Pesanan ({userOrders.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('designs')}
            className={`flex-1 py-2 rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'designs' ? 'bg-white text-slate-900 shadow-2xs' : 'hover:text-slate-900'
            }`}
          >
            <Shirt className="w-3.5 h-3.5 text-indigo-600" />
            <span>Desain Tersimpan ({savedDesigns.length})</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-3">
          {activeTab === 'orders' ? (
            userOrders.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <Package className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-800">Belum Ada Riwayat Pesanan</h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Pesanan yang Anda buat saat login akan otomatis tersimpan di sini.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {userOrders.map((order) => (
                  <div
                    key={order.id}
                    className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-slate-300 transition shadow-2xs space-y-2.5 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-slate-900 text-xs">
                          {order.id}
                        </span>
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(order.createdAt).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusBadge(
                          order.status
                        )}`}
                      >
                        {order.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-600 text-[11px] pt-1 border-t border-slate-200/60">
                      <div>
                        <span>{order.colorName}</span> • <span>{order.quantity} pcs</span>
                      </div>
                      <div className="font-mono font-bold text-slate-900 text-xs sm:text-sm">
                        Rp {order.grandTotal.toLocaleString('id-ID')}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-slate-500 font-medium">
                        {order.paymentType === 'dp_50' ? 'Uang Muka (DP 50%)' : 'Bayar Lunas 100%'}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          if (onSelectOrderToTrack) {
                            onSelectOrderToTrack(order.id);
                          } else {
                            window.location.hash = `/cekorderan?id=${order.id}`;
                          }
                          onClose();
                        }}
                        className="flex items-center gap-1 text-[11px] font-bold text-sky-600 hover:text-sky-700 transition cursor-pointer"
                      >
                        <span>Lacak Pesanan Ini</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : savedDesigns.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Shirt className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">Belum Ada Desain Tersimpan</h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Desain yang Anda masukkan ke keranjang belanja saat login akan otomatis tersimpan di sini.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {savedDesigns.map((design, idx) => (
                <div
                  key={design.id || idx}
                  className="p-3 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    {design.mockupPreview ? (
                      <img
                        src={design.mockupPreview}
                        alt="Kaos"
                        className="w-12 h-14 object-cover rounded-xl border border-slate-200 bg-white shadow-2xs"
                      />
                    ) : (
                      <div className="w-12 h-14 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-300">
                        <Shirt className="w-5 h-5" />
                      </div>
                    )}
                    <div>
                      <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full border border-slate-300 inline-block"
                          style={{ backgroundColor: design.colorHex }}
                        />
                        <span>{design.colorName}</span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {design.materialName} • {design.techniqueName}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Ukuran: {design.size} ({design.quantity} pcs)
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleAddToCart(design)}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] transition flex items-center gap-1 cursor-pointer shadow-2xs"
                    >
                      <ShoppingBag className="w-3 h-3" />
                      <span>Ke Keranjang</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span className="text-[11px]">Akun ID: <code className="font-mono">{user.id}</code></span>
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-4 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
