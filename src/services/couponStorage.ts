/**
 * Coupon & Discount Storage Service
 * Custom Apparel Bandung.id
 */

export interface Coupon {
  id: string;
  code: string;
  discountType: 'percent' | 'fixed'; // 'percent' = % potongan, 'fixed' = nominal Rp
  amount: number; // misal 10 untuk 10%, atau 50000 untuk Rp 50.000
  minOrderAmount?: number; // minimal subtotal belanja (opsional)
  isActive: boolean;
  description: string;
  createdAt: string;
}

const STORAGE_KEY = 'cab_coupons_data';

const DEFAULT_COUPONS: Coupon[] = [
  {
    id: 'coupon-1',
    code: 'CABBARU',
    discountType: 'percent',
    amount: 10,
    minOrderAmount: 0,
    isActive: true,
    description: 'Diskon 10% Spesial Pelanggan Baru',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'coupon-2',
    code: 'DISKON50K',
    discountType: 'fixed',
    amount: 50000,
    minOrderAmount: 500000,
    isActive: true,
    description: 'Potongan Langsung Rp 50.000 (Min. Belanja Rp 500.000)',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'coupon-3',
    code: 'KOMUNITAS',
    discountType: 'percent',
    amount: 15,
    minOrderAmount: 1000000,
    isActive: true,
    description: 'Diskon 15% Spesial Pesanan Komunitas & Panitia',
    createdAt: new Date().toISOString(),
  },
];

export const getCoupons = (): Coupon[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_COUPONS));
      return DEFAULT_COUPONS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_COUPONS;
  }
};

export const saveCoupons = (coupons: Coupon[]): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(coupons));
  window.dispatchEvent(new Event('coupons-updated'));
};

export const addCoupon = (coupon: Omit<Coupon, 'id' | 'createdAt'>): Coupon => {
  const coupons = getCoupons();
  const newCoupon: Coupon = {
    ...coupon,
    id: 'coupon-' + Date.now().toString(36),
    code: coupon.code.trim().toUpperCase(),
    createdAt: new Date().toISOString(),
  };
  coupons.push(newCoupon);
  saveCoupons(coupons);
  return newCoupon;
};

export const updateCoupon = (id: string, updates: Partial<Coupon>): void => {
  const coupons = getCoupons();
  const idx = coupons.findIndex((c) => c.id === id);
  if (idx !== -1) {
    coupons[idx] = { ...coupons[idx], ...updates };
    if (updates.code) coupons[idx].code = updates.code.trim().toUpperCase();
    saveCoupons(coupons);
  }
};

export const deleteCoupon = (id: string): void => {
  const coupons = getCoupons().filter((c) => c.id !== id);
  saveCoupons(coupons);
};

export const toggleCouponActive = (id: string): void => {
  const coupons = getCoupons();
  const item = coupons.find((c) => c.id === id);
  if (item) {
    item.isActive = !item.isActive;
    saveCoupons(coupons);
  }
};

export interface CouponValidationResult {
  valid: boolean;
  coupon?: Coupon;
  error?: string;
  discountAmount: number;
}

export const validateCoupon = (code: string, subtotal: number): CouponValidationResult => {
  const clean = code.trim().toUpperCase();
  if (!clean) {
    return { valid: false, error: 'Silakan masukkan kode kupon.', discountAmount: 0 };
  }

  const coupons = getCoupons();
  const match = coupons.find((c) => c.code === clean);

  if (!match) {
    return { valid: false, error: 'Kode kupon tidak ditemukan.', discountAmount: 0 };
  }

  if (!match.isActive) {
    return { valid: false, error: 'Kupon ini sedang non-aktif.', discountAmount: 0 };
  }

  if (match.minOrderAmount && subtotal < match.minOrderAmount) {
    return {
      valid: false,
      error: `Minimal belanja untuk menggunakan kupon ini adalah Rp ${match.minOrderAmount.toLocaleString('id-ID')}.`,
      discountAmount: 0,
    };
  }

  let discountAmount = 0;
  if (match.discountType === 'percent') {
    discountAmount = Math.round((subtotal * match.amount) / 100);
  } else {
    discountAmount = Math.min(subtotal, match.amount);
  }

  return {
    valid: true,
    coupon: match,
    discountAmount,
  };
};

