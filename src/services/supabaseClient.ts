import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { CustomerOrder, OrderStatus, ViewAngle } from '../types';
import type { ProductDatabaseState } from './pricingStorage';

const STORAGE_URL_KEY = 'customkaos_supabase_url';
const STORAGE_KEY_KEY = 'customkaos_supabase_anon_key';

export function getSupabaseConfig(): { url: string; key: string } {
  const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

  const storedUrl = localStorage.getItem(STORAGE_URL_KEY) || '';
  const storedKey = localStorage.getItem(STORAGE_KEY_KEY) || '';

  return {
    url: (storedUrl || envUrl || '').trim(),
    key: (storedKey || envKey || '').trim(),
  };
}

export function setSupabaseConfig(url: string, key: string): void {
  localStorage.setItem(STORAGE_URL_KEY, url.trim());
  localStorage.setItem(STORAGE_KEY_KEY, key.trim());
  // Reinitialize client
  _supabaseInstance = null;
}

let _supabaseInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (_supabaseInstance) return _supabaseInstance;

  const { url, key } = getSupabaseConfig();
  if (!url || !key) return null;

  try {
    _supabaseInstance = createClient(url, key);
    return _supabaseInstance;
  } catch (err) {
    console.warn('Gagal inisialisasi Supabase client:', err);
    return null;
  }
}

export function isSupabaseConfigured(): boolean {
  const { url, key } = getSupabaseConfig();
  return Boolean(url && key);
}

// ─────────────────────────────────────────────
// Cloud Catalog Helpers
// ─────────────────────────────────────────────

export async function fetchCatalogFromSupabase(): Promise<ProductDatabaseState | null> {
  const sb = getSupabase();
  if (!sb) return null;

  try {
    const { data, error } = await sb
      .from('product_catalog')
      .select('data, updated_at')
      .eq('id', 'current_catalog')
      .maybeSingle();

    if (error) {
      console.warn('Supabase fetch catalog warning:', error.message);
      return null;
    }

    if (data && data.data) {
      return {
        ...data.data,
        lastUpdated: data.updated_at || data.data.lastUpdated,
      };
    }
    return null;
  } catch (err) {
    console.warn('Supabase fetch catalog exception:', err);
    return null;
  }
}

export async function saveCatalogToSupabase(db: ProductDatabaseState): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;

  try {
    const { error } = await sb.from('product_catalog').upsert({
      id: 'current_catalog',
      data: db,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.warn('Supabase save catalog warning:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase save catalog exception:', err);
    return false;
  }
}

// ─────────────────────────────────────────────
// Cloud Orders Helpers
// ─────────────────────────────────────────────

function mapRowToOrder(row: Record<string, unknown>): CustomerOrder {
  const rawPreview = row.mockup_preview ? String(row.mockup_preview) : undefined;
  let parsedPreview: string | undefined = rawPreview;
  let parsedPreviews: Partial<Record<ViewAngle, string>> | undefined = undefined;

  if (rawPreview && rawPreview.startsWith('{')) {
    try {
      parsedPreviews = JSON.parse(rawPreview);
      parsedPreview = parsedPreviews?.front || Object.values(parsedPreviews || {})[0] || rawPreview;
    } catch {
      // fallback to raw
    }
  }

  // Parse payment metadata if encoded in admin_notes or direct columns
  let paymentType: 'dp_50' | 'full' = (row.payment_type as 'dp_50' | 'full') || 'dp_50';
  let dpAmount = row.dp_amount !== undefined && row.dp_amount !== null ? Number(row.dp_amount) : undefined;
  let remainingAmount = row.remaining_amount !== undefined && row.remaining_amount !== null ? Number(row.remaining_amount) : undefined;
  let dpPaidAt = row.dp_paid_at ? String(row.dp_paid_at) : undefined;
  let settlementPaidAt = row.settlement_paid_at ? String(row.settlement_paid_at) : undefined;
  let items: CustomerOrder['items'] = undefined;
  let userId: string | undefined = row.user_id ? String(row.user_id) : undefined;
  let userEmail: string | undefined = row.user_email ? String(row.user_email) : undefined;

  let cleanAdminNotes = row.admin_notes ? String(row.admin_notes) : undefined;
  if (cleanAdminNotes && cleanAdminNotes.includes('__PAYMENT_META__:')) {
    try {
      const parts = cleanAdminNotes.split('__PAYMENT_META__:');
      cleanAdminNotes = parts[0].trim() || undefined;
      const meta = JSON.parse(parts[1]);
      if (meta.paymentType) paymentType = meta.paymentType;
      if (meta.dpAmount !== undefined) dpAmount = meta.dpAmount;
      if (meta.remainingAmount !== undefined) remainingAmount = meta.remainingAmount;
      if (meta.dpPaidAt) dpPaidAt = meta.dpPaidAt;
      if (meta.settlementPaidAt) settlementPaidAt = meta.settlementPaidAt;
      if (meta.items) items = meta.items;
      if (meta.userId) userId = meta.userId;
      if (meta.userEmail) userEmail = meta.userEmail;
    } catch {
      // ignore parsing error
    }
  }

  return {
    id: String(row.id),
    createdAt: String(row.created_at || new Date().toISOString()),
    updatedAt: String(row.updated_at || new Date().toISOString()),
    status: (row.status as OrderStatus) || 'Waiting for Payment',
    customerName: row.customer_name ? String(row.customer_name) : undefined,
    customerPhone: row.customer_phone ? String(row.customer_phone) : undefined,
    shippingCity: row.shipping_city ? String(row.shipping_city) : undefined,
    shippingAddress: row.shipping_address ? String(row.shipping_address) : undefined,
    customerNotes: row.customer_notes ? String(row.customer_notes) : undefined,
    trackingNumber: row.tracking_number ? String(row.tracking_number) : undefined,
    courier: row.courier ? String(row.courier) : undefined,
    adminNotes: cleanAdminNotes,
    neckType: (row.neck_type as CustomerOrder['neckType']) || 'round',
    sleeveType: (row.sleeve_type as CustomerOrder['sleeveType']) || 'short',
    colorName: String(row.color_name || 'Hitam'),
    colorHex: String(row.color_hex || '#000000'),
    materialName: String(row.material_name || 'Cotton Combed 30s'),
    materialGsm: row.material_gsm ? String(row.material_gsm) : undefined,
    techniqueName: String(row.technique_name || 'DTF'),
    size: String(row.size || 'L'),
    quantity: Number(row.quantity || 1),
    printBreakdown: Array.isArray(row.print_breakdown) ? row.print_breakdown : [],
    unitPrice: Number(row.unit_price || 0),
    discountPercent: Number(row.discount_percent || 0),
    grandTotal: Number(row.grand_total || 0),
    paymentType,
    dpAmount,
    remainingAmount,
    dpPaidAt,
    settlementPaidAt,
    items,
    userId,
    userEmail,
    mockupPreview: parsedPreview,
    mockupPreviews: parsedPreviews,
    driveFolderUrl: row.drive_folder_url ? String(row.drive_folder_url) : undefined,
  };
}

function mapOrderToRow(order: CustomerOrder) {
  let previewToSave: string | null = null;
  if (order.mockupPreviews && Object.keys(order.mockupPreviews).length > 0) {
    previewToSave = JSON.stringify(order.mockupPreviews);
  } else if (order.mockupPreview) {
    previewToSave = order.mockupPreview;
  }

  // Encode payment metadata safely inside admin_notes to ensure compatibility
  // with Supabase even if the database has not yet run the ALTER TABLE migrations
  const paymentMeta = {
    paymentType: order.paymentType || 'dp_50',
    dpAmount: order.dpAmount ?? Math.round(order.grandTotal * 0.5),
    remainingAmount: order.remainingAmount ?? (order.grandTotal - Math.round(order.grandTotal * 0.5)),
    dpPaidAt: order.dpPaidAt,
    settlementPaidAt: order.settlementPaidAt,
    items: order.items,
    userId: order.userId,
    userEmail: order.userEmail,
  };
  const baseAdminNotes = order.adminNotes ? order.adminNotes.replace(/__PAYMENT_META__:.*$/, '').trim() : '';
  const combinedAdminNotes = baseAdminNotes
    ? `${baseAdminNotes} __PAYMENT_META__:${JSON.stringify(paymentMeta)}`
    : `__PAYMENT_META__:${JSON.stringify(paymentMeta)}`;

  return {
    id: order.id,
    created_at: order.createdAt,
    updated_at: order.updatedAt,
    status: order.status,
    customer_name: order.customerName || null,
    customer_phone: order.customerPhone || null,
    shipping_city: order.shippingCity || null,
    shipping_address: order.shippingAddress || null,
    customer_notes: order.customerNotes || null,
    tracking_number: order.trackingNumber || null,
    courier: order.courier || null,
    admin_notes: combinedAdminNotes,
    neck_type: order.neckType,
    sleeve_type: order.sleeveType,
    color_name: order.colorName,
    color_hex: order.colorHex,
    material_name: order.materialName,
    material_gsm: order.materialGsm || null,
    technique_name: order.techniqueName,
    size: order.size,
    quantity: order.quantity,
    print_breakdown: order.printBreakdown,
    unit_price: order.unitPrice,
    discount_percent: order.discountPercent,
    grand_total: order.grandTotal,
    mockup_preview: previewToSave,
    drive_folder_url: order.driveFolderUrl || null,
  };
}

export async function fetchOrdersFromSupabase(): Promise<CustomerOrder[] | null> {
  const sb = getSupabase();
  if (!sb) return null;

  try {
    const { data, error } = await sb
      .from('customer_orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase fetch orders warning:', error.message);
      return null;
    }

    return (data || []).map(mapRowToOrder);
  } catch (err) {
    console.warn('Supabase fetch orders exception:', err);
    return null;
  }
}

export async function saveOrderToSupabase(order: CustomerOrder): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;

  try {
    const row = mapOrderToRow(order);
    const { error } = await sb.from('customer_orders').upsert(row);

    if (error) {
      console.warn('Supabase save order warning:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase save order exception:', err);
    return false;
  }
}

export async function updateOrderStatusInSupabase(
  orderId: string,
  newStatus: OrderStatus,
  options?: {
    trackingNumber?: string;
    courier?: string;
    adminNotes?: string;
    dpPaidAt?: string;
    settlementPaidAt?: string;
  }
): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;

  try {
    const updatePayload: Record<string, unknown> = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    };
    if (options?.trackingNumber !== undefined) updatePayload.tracking_number = options.trackingNumber;
    if (options?.courier !== undefined) updatePayload.courier = options.courier;

    if (options?.adminNotes !== undefined || options?.dpPaidAt !== undefined || options?.settlementPaidAt !== undefined) {
      let baseNotes = options?.adminNotes ?? '';
      let existingMeta: Record<string, unknown> = {};
      if (baseNotes.includes('__PAYMENT_META__:')) {
        const parts = baseNotes.split('__PAYMENT_META__:');
        baseNotes = parts[0].trim();
        try { existingMeta = JSON.parse(parts[1].trim()); } catch {}
      }
      if (options?.dpPaidAt !== undefined) existingMeta.dpPaidAt = options.dpPaidAt;
      if (options?.settlementPaidAt !== undefined) existingMeta.settlementPaidAt = options.settlementPaidAt;

      const combinedNotes = baseNotes
        ? `${baseNotes} __PAYMENT_META__:${JSON.stringify(existingMeta)}`
        : `__PAYMENT_META__:${JSON.stringify(existingMeta)}`;
      updatePayload.admin_notes = combinedNotes;
    }

    const { error } = await sb
      .from('customer_orders')
      .update(updatePayload)
      .eq('id', orderId);

    if (error) {
      console.warn('Supabase update status warning:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase update status exception:', err);
    return false;
  }
}

export async function deleteOrderFromSupabase(orderId: string): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;

  try {
    const { error } = await sb.from('customer_orders').delete().eq('id', orderId);
    if (error) {
      console.warn('Supabase delete order warning:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase delete order exception:', err);
    return false;
  }
}

