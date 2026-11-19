import type { CustomerOrder, OrderStatus } from '../types';
import {
  saveOrderToSupabase,
  updateOrderStatusInSupabase,
  deleteOrderFromSupabase,
  fetchOrdersFromSupabase,
  isSupabaseConfigured,
} from './supabaseClient';

const ORDERS_STORAGE_KEY = 'customkaos_orders_v1';

// Initial mock orders to populate dashboard & reporting if localStorage is empty
export const INITIAL_MOCK_ORDERS: CustomerOrder[] = [
  {
    id: 'CK-882910',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    updatedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    status: 'Waiting for Payment',
    customerName: 'Budi Santoso',
    customerPhone: '081234567890',
    shippingCity: 'Bandung, Jawa Barat',
    shippingAddress: 'Jl. Riau No. 45, Citarum, Bandung Wetan',
    customerNotes: 'Tolong sablon logo agak naik 2 cm dari dada.',
    neckType: 'round',
    sleeveType: 'short',
    colorName: 'Hitam Jet Black',
    colorHex: '#121214',
    materialName: 'Cotton Combed 24s',
    materialGsm: '180-190 gsm',
    techniqueName: 'DTF (Direct to Film)',
    size: 'L',
    quantity: 24,
    printBreakdown: [
      { placement: 'FRONT', name: 'A3 Besar Center (30 x 42 cm)', cost: 35000 },
      { placement: 'SLEEVE-LEFT', name: 'Logo Lengan (8 x 8 cm)', cost: 12000 },
    ],
    unitPrice: 98000,
    discountPercent: 10,
    grandTotal: 2116800,
  },
  {
    id: 'CK-749102',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(), // Yesterday
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    status: 'Order masuk DP',
    customerName: 'Komunitas Motor Bandung',
    customerPhone: '085712398411',
    adminNotes: 'DP 50% sebesar Rp 2.250.000 sudah masuk via BCA.',
    neckType: 'round',
    sleeveType: 'short',
    colorName: 'Putih Solid',
    colorHex: '#F8FAFC',
    materialName: 'Cotton Combed 30s',
    materialGsm: '150-160 gsm',
    techniqueName: 'Sablon Plastisol Premium',
    size: 'XL',
    quantity: 50,
    printBreakdown: [
      { placement: 'FRONT', name: 'A4 Center (21 x 30 cm)', cost: 25000 },
      { placement: 'BACK', name: 'A3 Besar Center (30 x 42 cm)', cost: 35000 },
    ],
    unitPrice: 110000,
    discountPercent: 18,
    grandTotal: 4510000,
  },
  {
    id: 'CK-654819',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    status: 'On Processed',
    customerName: 'Startup Nexa Tech',
    customerPhone: '081388901234',
    adminNotes: 'Proses sablon DTF sisi depan dan bordir/press kerah.',
    neckType: 'round',
    sleeveType: 'short',
    colorName: 'Navy Blue Tua',
    colorHex: '#1E293B',
    materialName: 'Cotton Combed 24s',
    materialGsm: '180-190 gsm',
    techniqueName: 'DTF (Direct to Film)',
    size: 'M',
    quantity: 36,
    printBreakdown: [
      { placement: 'FRONT', name: 'Dada Kiri Logo (10 x 10 cm)', cost: 15000 },
      { placement: 'BACK', name: 'A4 Center (21 x 30 cm)', cost: 25000 },
    ],
    unitPrice: 85000,
    discountPercent: 10,
    grandTotal: 2754000,
  },
  {
    id: 'CK-593120',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(), // 3 days ago
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    status: 'Ready to send',
    customerName: 'Event Fun Run Surabaya',
    customerPhone: '089612345678',
    adminNotes: 'Packing rapi plastik OPP & size polybag per pcs.',
    neckType: 'v-neck',
    sleeveType: 'short',
    colorName: 'Sage Green',
    colorHex: '#708272',
    materialName: 'Cotton Combed 30s',
    materialGsm: '150-160 gsm',
    techniqueName: 'DTF (Direct to Film)',
    size: 'L',
    quantity: 120,
    printBreakdown: [
      { placement: 'FRONT', name: 'A4 Center (21 x 30 cm)', cost: 25000 },
    ],
    unitPrice: 70000,
    discountPercent: 25,
    grandTotal: 6300000,
  },
  {
    id: 'CK-481902',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString(), // 4 days ago
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
    status: 'On Sending',
    customerName: 'Rian Pratama',
    customerPhone: '082199887766',
    courier: 'J&T Express',
    trackingNumber: 'JT98127391028',
    adminNotes: 'Paket diserahkan ke kurir J&T jam 14.00.',
    neckType: 'round',
    sleeveType: 'long',
    colorName: 'Maroon Red',
    colorHex: '#641B24',
    materialName: 'Heavyweight Cotton 16s',
    materialGsm: '230-240 gsm',
    techniqueName: 'Sablon Plastisol Premium',
    size: 'XXL',
    quantity: 15,
    printBreakdown: [
      { placement: 'FRONT', name: 'A3 Besar Center (30 x 42 cm)', cost: 35000 },
      { placement: 'SLEEVE-LEFT', name: 'Vertikal Lengan (8 x 35 cm)', cost: 22000 },
    ],
    unitPrice: 145000,
    discountPercent: 10,
    grandTotal: 1957500,
  },
  {
    id: 'CK-391048',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 140).toISOString(), // ~6 days ago
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    status: 'Done',
    customerName: 'Cafe Kopi Temu',
    customerPhone: '081299001122',
    courier: 'SiCepat BEST',
    trackingNumber: 'SI00192847120',
    adminNotes: 'Pesanan telah diterima customer dengan rating puas bintang 5.',
    neckType: 'round',
    sleeveType: 'short',
    colorName: 'Hitam Jet Black',
    colorHex: '#121214',
    materialName: 'Cotton Bamboo 30s',
    materialGsm: '160 gsm Anti-Bakteri',
    techniqueName: 'Discharge (Cabut Warna)',
    size: 'M',
    quantity: 60,
    printBreakdown: [
      { placement: 'FRONT', name: 'A4 Center (21 x 30 cm)', cost: 25000 },
      { placement: 'BACK', name: 'Dada Kiri Logo (10 x 10 cm)', cost: 15000 },
    ],
    unitPrice: 125000,
    discountPercent: 18,
    grandTotal: 6150000,
  },
  {
    id: 'CK-284910',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 180).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 150).toISOString(),
    status: 'Cancel',
    customerName: 'Doni Saputra',
    customerPhone: '087788990011',
    adminNotes: 'Customer membatalkan karena tanggal acara dimajukan.',
    neckType: 'round',
    sleeveType: 'short',
    colorName: 'Kuning Mustard',
    colorHex: '#D99B26',
    materialName: 'Cotton Combed 30s',
    materialGsm: '150-160 gsm',
    techniqueName: 'Polyflex PU Korea',
    size: 'L',
    quantity: 12,
    printBreakdown: [
      { placement: 'FRONT', name: 'A4 Center (21 x 30 cm)', cost: 25000 },
    ],
    unitPrice: 85000,
    discountPercent: 10,
    grandTotal: 918000,
  },
];

export const loadOrders = (): CustomerOrder[] => {
  try {
    const raw = localStorage.getItem(ORDERS_STORAGE_KEY);
    if (!raw) {
      saveOrders(INITIAL_MOCK_ORDERS);
      return INITIAL_MOCK_ORDERS;
    }
    const parsed = JSON.parse(raw) as CustomerOrder[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      saveOrders(INITIAL_MOCK_ORDERS);
      return INITIAL_MOCK_ORDERS;
    }
    return parsed;
  } catch (err) {
    console.error('Failed to load orders from localStorage:', err);
    return INITIAL_MOCK_ORDERS;
  }
};

export const saveOrders = (orders: CustomerOrder[]): void => {
  try {
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
  } catch (err) {
    console.error('Failed to save orders to localStorage:', err);
  }
};

export const syncOrdersFromCloud = async (): Promise<CustomerOrder[] | null> => {
  if (!isSupabaseConfigured()) return null;
  const cloudOrders = await fetchOrdersFromSupabase();
  if (cloudOrders && cloudOrders.length > 0) {
    saveOrders(cloudOrders);
    return cloudOrders;
  }
  return null;
};

export const addOrder = (order: CustomerOrder): CustomerOrder => {
  const currentOrders = loadOrders();
  // Check if exists
  const existingIdx = currentOrders.findIndex((o) => o.id === order.id);
  let updated: CustomerOrder[];
  if (existingIdx >= 0) {
    updated = [...currentOrders];
    updated[existingIdx] = { ...order, updatedAt: new Date().toISOString() };
  } else {
    updated = [order, ...currentOrders];
  }
  saveOrders(updated);

  // Sync to Supabase in background
  if (isSupabaseConfigured()) {
    saveOrderToSupabase(order).catch((err) => {
      console.warn('Async cloud order save failed:', err);
    });
  }

  return order;
};

export const updateOrderStatus = (
  orderId: string,
  newStatus: OrderStatus,
  options?: {
    trackingNumber?: string;
    courier?: string;
    adminNotes?: string;
    dpPaidAt?: string;
    settlementPaidAt?: string;
  }
): CustomerOrder | null => {
  const currentOrders = loadOrders();
  const idx = currentOrders.findIndex(
    (o) => o.id.toLowerCase().replace(/[^a-z0-9]/g, '') === orderId.toLowerCase().replace(/[^a-z0-9]/g, '')
  );
  if (idx === -1) return null;

  const target = currentOrders[idx];
  const updatedOrder: CustomerOrder = {
    ...target,
    status: newStatus,
    updatedAt: new Date().toISOString(),
    ...(options?.trackingNumber !== undefined ? { trackingNumber: options.trackingNumber } : {}),
    ...(options?.courier !== undefined ? { courier: options.courier } : {}),
    ...(options?.adminNotes !== undefined ? { adminNotes: options.adminNotes } : {}),
    ...(options?.dpPaidAt !== undefined ? { dpPaidAt: options.dpPaidAt } : {}),
    ...(options?.settlementPaidAt !== undefined ? { settlementPaidAt: options.settlementPaidAt } : {}),
  };

  currentOrders[idx] = updatedOrder;
  saveOrders(currentOrders);

  // Sync to Supabase in background
  if (isSupabaseConfigured()) {
    updateOrderStatusInSupabase(orderId, newStatus, options).catch((err) => {
      console.warn('Async cloud status update failed:', err);
    });
  }

  return updatedOrder;
};

export const getOrderById = (orderId: string): CustomerOrder | null => {
  const cleanSearch = orderId.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!cleanSearch) return null;
  const currentOrders = loadOrders();
  return (
    currentOrders.find(
      (o) => o.id.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanSearch
    ) || null
  );
};

export const deleteOrder = (orderId: string): void => {
  const currentOrders = loadOrders();
  const filtered = currentOrders.filter((o) => o.id !== orderId);
  saveOrders(filtered);

  if (isSupabaseConfigured()) {
    deleteOrderFromSupabase(orderId).catch((err) => {
      console.warn('Async cloud delete order failed:', err);
    });
  }
};

export const getOrdersForUser = (userId: string, userEmail?: string, userPhone?: string): CustomerOrder[] => {
  const allOrders = loadOrders();
  const cleanEmail = userEmail?.trim().toLowerCase();
  const cleanPhone = userPhone?.trim().replace(/[^0-9]/g, '');

  return allOrders.filter((order) => {
    if (order.userId && order.userId === userId) return true;
    if (cleanEmail && order.userEmail && order.userEmail.toLowerCase() === cleanEmail) return true;
    if (cleanPhone && order.customerPhone) {
      const orderPhone = order.customerPhone.replace(/[^0-9]/g, '');
      if (orderPhone.length >= 8 && cleanPhone.endsWith(orderPhone.slice(-8))) return true;
    }
    return false;
  });
};

export const resetOrdersToDefault = (): CustomerOrder[] => {
  saveOrders(INITIAL_MOCK_ORDERS);
  return INITIAL_MOCK_ORDERS;
};

