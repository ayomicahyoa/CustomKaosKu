import React, { useState, useEffect } from 'react';
import {
  Tag,
  Plus,
  Trash2,
  Percent,
  Banknote,
  Search,
  Sparkles,
} from 'lucide-react';
import {
  getCoupons,
  addCoupon,
  deleteCoupon,
  toggleCouponActive,
  type Coupon,
} from '../../services/couponStorage';

export const CouponManager: React.FC = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // New Coupon Form State
  const [newCode, setNewCode] = useState('');
  const [newType, setNewType] = useState<'percent' | 'fixed'>('percent');
  const [newAmount, setNewAmount] = useState<number>(10);
  const [newMinOrder, setNewMinOrder] = useState<number>(0);
  const [newDesc, setNewDesc] = useState('');

  const refreshList = () => {
    setCoupons(getCoupons());
  };

  useEffect(() => {
    refreshList();
    const handleUpdate = () => refreshList();
    window.addEventListener('coupons-updated', handleUpdate);
    return () => window.removeEventListener('coupons-updated', handleUpdate);
  }, []);

  const handleCreateCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim()) {
      alert('Masukkan kode kupon.');
      return;
    }
    if (newAmount <= 0) {
      alert('Nilai potongan harus lebih dari 0.');
      return;
    }

    addCoupon({
      code: newCode.trim().toUpperCase(),
      discountType: newType,
      amount: newAmount,
      minOrderAmount: newMinOrder || 0,
      isActive: true,
      description: newDesc.trim() || (newType === 'percent' ? `Diskon ${newAmount}%` : `Potongan Rp ${newAmount.toLocaleString('id-ID')}`),
    });

    // Reset Form
    setNewCode('');
    setNewAmount(10);
    setNewMinOrder(0);
    setNewDesc('');
    setIsAdding(false);
    refreshList();
  };

  const handleDelete = (id: string, code: string) => {
    if (window.confirm(`Yakin ingin menghapus kupon "${code}"?`)) {
      deleteCoupon(id);
      refreshList();
    }
  };

  const handleToggle = (id: string) => {
    toggleCouponActive(id);
    refreshList();
  };

  const filteredCoupons = coupons.filter(
    (c) =>
      c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeCount = coupons.filter((c) => c.isActive).length;

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Manajemen Kupon & Promo Diskon
              </h2>
              <p className="text-xs text-slate-500">
                Atur kode promo yang bisa digunakan pelanggan saat checkout
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl px-3 py-1.5 text-xs text-slate-600 font-semibold">
            <span>Total: <strong>{coupons.length}</strong></span>
            <span className="mx-2">•</span>
            <span className="text-emerald-700 font-bold">Aktif: {activeCount}</span>
          </div>

          <button
            type="button"
            onClick={() => setIsAdding(!isAdding)}
            className="py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer ml-auto sm:ml-0"
          >
            <Plus className="w-4 h-4" />
            <span>{isAdding ? 'Tutup Form' : 'Tambah Kupon Baru'}</span>
          </button>
        </div>
      </div>

      {/* Form Tambah Kupon Baru */}
      {isAdding && (
        <form
          onSubmit={handleCreateCoupon}
          className="bg-white rounded-3xl p-6 border-2 border-amber-300 shadow-md space-y-4 animate-in slide-in-from-top-2 duration-200"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Formulir Buat Kupon Diskon Baru</span>
            </div>
            <span className="text-[11px] text-slate-400">Kode akan otomatis tersimpan</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {/* Kode Kupon */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Kode Kupon (Voucher) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={newCode}
                onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                placeholder="Contoh: LEBARAN10"
                className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-mono font-bold uppercase focus:ring-2 focus:ring-sky-500"
              />
            </div>

            {/* Tipe Diskon */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Tipe Potongan Harga <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setNewType('percent');
                    if (newAmount > 100) setNewAmount(10);
                  }}
                  className={`p-2 rounded-xl border text-center font-bold flex items-center justify-center gap-1 transition ${
                    newType === 'percent'
                      ? 'border-sky-500 bg-sky-50 text-sky-800 ring-1 ring-sky-500'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Percent className="w-3.5 h-3.5" />
                  <span>Persen (%)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setNewType('fixed');
                    if (newAmount < 1000) setNewAmount(50000);
                  }}
                  className={`p-2 rounded-xl border text-center font-bold flex items-center justify-center gap-1 transition ${
                    newType === 'fixed'
                      ? 'border-sky-500 bg-sky-50 text-sky-800 ring-1 ring-sky-500'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Banknote className="w-3.5 h-3.5" />
                  <span>Rupiah (Rp)</span>
                </button>
              </div>
            </div>

            {/* Besaran Nilai Potongan */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Besaran Potongan {newType === 'percent' ? '(%)' : '(Rp)'} <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                required
                min="1"
                max={newType === 'percent' ? 90 : 10000000}
                value={newAmount}
                onChange={(e) => setNewAmount(parseFloat(e.target.value) || 0)}
                placeholder={newType === 'percent' ? '10' : '50000'}
                className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-mono font-bold focus:ring-2 focus:ring-sky-500"
              />
            </div>

            {/* Minimal Belanja */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Minimal Belanja (Rp) <span className="text-slate-400 font-normal">(0 = Tanpa syarat)</span>
              </label>
              <input
                type="number"
                min="0"
                step="10000"
                value={newMinOrder}
                onChange={(e) => setNewMinOrder(parseFloat(e.target.value) || 0)}
                placeholder="0"
                className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-mono focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          {/* Deskripsi Promo */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Keterangan / Deskripsi Kupon
            </label>
            <input
              type="text"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Contoh: Diskon 10% Spesial Event Ramadhan & Idul Fitri"
              className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-xs focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="py-2 px-4 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold"
            >
              Batal
            </button>
            <button
              type="submit"
              className="py-2 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition"
            >
              Simpan & Aktifkan Kupon
            </button>
          </div>
        </form>
      )}

      {/* Search & Filter */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari kode kupon..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono uppercase placeholder:normal-case placeholder:font-sans focus:outline-none focus:border-slate-900"
          />
        </div>
        <span className="text-xs text-slate-400">
          Menampilkan {filteredCoupons.length} dari {coupons.length} kupon
        </span>
      </div>

      {/* Grid List of Coupons */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCoupons.map((coupon) => (
          <div
            key={coupon.id}
            className={`p-4 rounded-2xl border transition shadow-xs flex flex-col justify-between gap-3 ${
              coupon.isActive
                ? 'bg-white border-slate-200/90'
                : 'bg-slate-50 border-slate-200 opacity-60'
            }`}
          >
            <div>
              {/* Card Header: Code & Active Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-sm text-slate-900 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                    {coupon.code}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      coupon.isActive
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {coupon.isActive ? 'Aktif' : 'Non-Aktif'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggle(coupon.id)}
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-xl transition cursor-pointer ${
                    coupon.isActive
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      : 'bg-emerald-600 text-white hover:bg-emerald-700'
                  }`}
                  title={coupon.isActive ? 'Nonaktifkan kupon ini' : 'Aktifkan kupon ini'}
                >
                  {coupon.isActive ? 'Matikan' : 'Aktifkan'}
                </button>
              </div>

              {/* Potongan Info */}
              <div className="mt-3">
                <div className="text-lg font-black text-sky-600">
                  {coupon.discountType === 'percent'
                    ? `Diskon ${coupon.amount}%`
                    : `Potongan Rp ${coupon.amount.toLocaleString('id-ID')}`}
                </div>
                <p className="text-xs text-slate-600 mt-0.5 font-medium">
                  {coupon.description}
                </p>
              </div>
            </div>

            {/* Card Footer: Min Order & Delete */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span>
                {coupon.minOrderAmount && coupon.minOrderAmount > 0
                  ? `Min. Order Rp ${coupon.minOrderAmount.toLocaleString('id-ID')}`
                  : 'Tanpa Minimal Belanja'}
              </span>

              <button
                type="button"
                onClick={() => handleDelete(coupon.id, coupon.code)}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                title="Hapus kupon"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredCoupons.length === 0 && (
        <div className="bg-white rounded-3xl p-12 text-center text-slate-400 border border-slate-200">
          <Tag className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm font-semibold">Tidak ada kupon diskon yang sesuai</p>
        </div>
      )}
    </div>
  );
};
