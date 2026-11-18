import React, { useState, useEffect } from 'react';
import type { CustomerOrder, OrderStatus } from '../../types';
import {
  loadOrders,
  updateOrderStatus,
  deleteOrder,
  resetOrdersToDefault,
  syncOrdersFromCloud,
} from '../../services/ordersStorage';
import { dataUrlToBlob } from '../../services/imageUtils';
import JSZip from 'jszip';
import {
  Package,
  Search,
  Filter,
  CheckCircle2,
  Truck,
  Edit,
  Trash2,
  X,
  RefreshCw,
  Save,
  MapPin,
  MessageSquare,
  Download,
  Image,
  ExternalLink,
} from 'lucide-react';

const ALL_STATUSES: OrderStatus[] = [
  'Waiting for Payment',
  'Order masuk DP',
  'On Processed',
  'Ready to send',
  'On Sending',
  'Done',
  'Cancel',
];

export const OrderListManager: React.FC = () => {
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedOrder, setSelectedOrder] = useState<CustomerOrder | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Edit form state
  const [editStatus, setEditStatus] = useState<OrderStatus>('Waiting for Payment');
  const [editCourier, setEditCourier] = useState('');
  const [editTrackingNumber, setEditTrackingNumber] = useState('');
  const [editAdminNotes, setEditAdminNotes] = useState('');
  const [modalAngle, setModalAngle] = useState<'front' | 'back' | 'sleeve-left' | 'sleeve-right'>('front');

  const refreshOrders = () => {
    setOrders(loadOrders());
    // Also fetch latest orders from cloud in background
    syncOrdersFromCloud().then((cloudOrders) => {
      if (cloudOrders && cloudOrders.length > 0) {
        setOrders(cloudOrders);
      }
    });
  };

  useEffect(() => {
    refreshOrders();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Status badge styling helper
  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'Waiting for Payment':
        return {
          bg: 'bg-amber-50 text-amber-800 border-amber-200',
          dot: 'bg-amber-500',
          label: 'Waiting for Payment',
        };
      case 'Order masuk DP':
        return {
          bg: 'bg-sky-50 text-sky-800 border-sky-200',
          dot: 'bg-sky-500',
          label: 'Order Masuk DP',
        };
      case 'On Processed':
        return {
          bg: 'bg-indigo-50 text-indigo-800 border-indigo-200',
          dot: 'bg-indigo-500',
          label: 'On Processed',
        };
      case 'Ready to send':
        return {
          bg: 'bg-teal-50 text-teal-800 border-teal-200',
          dot: 'bg-teal-500',
          label: 'Ready to Send',
        };
      case 'On Sending':
        return {
          bg: 'bg-orange-50 text-orange-800 border-orange-200',
          dot: 'bg-orange-500',
          label: 'On Sending',
        };
      case 'Done':
        return {
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          dot: 'bg-emerald-500',
          label: 'Done',
        };
      case 'Cancel':
        return {
          bg: 'bg-rose-50 text-rose-800 border-rose-200',
          dot: 'bg-rose-500',
          label: 'Cancelled',
        };
    }
  };

  const handleOpenEdit = (order: CustomerOrder) => {
    setSelectedOrder(order);
    setEditStatus(order.status);
    setEditCourier(order.courier || '');
    setEditTrackingNumber(order.trackingNumber || '');
    setEditAdminNotes(order.adminNotes || '');
    setIsEditModalOpen(true);
  };

  const handleSaveStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    updateOrderStatus(selectedOrder.id, editStatus, {
      courier: editCourier,
      trackingNumber: editTrackingNumber,
      adminNotes: editAdminNotes,
    });

    refreshOrders();
    setIsEditModalOpen(false);
    showToast(`Status pesanan ${selectedOrder.id} berhasil diupdate ke "${editStatus}"!`);
  };

  const handleDelete = (orderId: string) => {
    if (window.confirm(`Yakin ingin menghapus pesanan ${orderId}? Tindakan ini tidak dapat dibatalkan.`)) {
      deleteOrder(orderId);
      refreshOrders();
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(null);
        setIsEditModalOpen(false);
      }
      showToast(`Pesanan ${orderId} telah dihapus.`);
    }
  };

  const handleResetSampleOrders = () => {
    if (window.confirm('Reset data pesanan ke data contoh default? Pesanan kustom baru akan direset.')) {
      resetOrdersToDefault();
      refreshOrders();
      showToast('Data pesanan berhasil direset ke contoh default.');
    }
  };

  const handleDownloadZip = async (order: CustomerOrder) => {
    const zip = new JSZip();
    const folder = zip.folder(order.id) || zip;

    if (order.mockupPreviews) {
      for (const [view, dataUrl] of Object.entries(order.mockupPreviews)) {
        if (dataUrl) {
          folder.file(`mockup-${view.toUpperCase()}.jpg`, dataUrlToBlob(dataUrl));
        }
      }
    } else if (order.mockupPreview) {
      folder.file('mockup-preview.jpg', dataUrlToBlob(order.mockupPreview));
    }
    if (order.designFiles) {
      for (const df of order.designFiles) {
        const ext = df.fileName.includes('.') ? '' : '.png';
        folder.file(`design-${df.view}-${df.fileName}${ext}`, dataUrlToBlob(df.dataUrl));
      }
    }

    const details = `DETAIL PESANAN: ${order.id}\n${'='.repeat(37)}\nTanggal: ${new Date(order.createdAt).toLocaleString('id-ID')}\nStatus: ${order.status}\n\nPEMESAN:\n- Nama: ${order.customerName || '-'}\n- Telepon: ${order.customerPhone || '-'}\n- Kota: ${order.shippingCity || '-'}\n- Alamat: ${order.shippingAddress || '-'}\n- Catatan: ${order.customerNotes || '-'}\n\nSPESIFIKASI:\n- Warna: ${order.colorName} (${order.colorHex})\n- Bahan: ${order.materialName}\n- Model: ${order.neckType === 'round' ? 'Round Neck' : 'V-Neck'}, ${order.sleeveType === 'short' ? 'Lengan Pendek' : 'Lengan Panjang'}\n- Ukuran: ${order.size}\n- Jumlah: ${order.quantity} pcs\n- Teknik: ${order.techniqueName}\n\nBIAYA:\n- Harga Satuan: Rp ${order.unitPrice.toLocaleString('id-ID')}\n- Diskon: ${order.discountPercent}%\n- Grand Total: Rp ${order.grandTotal.toLocaleString('id-ID')}\n${'='.repeat(37)}`;
    folder.file('order-details.txt', details);

    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = `order-${order.id}-files.zip`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`File ZIP untuk ${order.id} berhasil di-download!`);
  };

  // Filtered orders
  const filteredOrders = orders.filter((order) => {
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    const query = searchQuery.trim().toLowerCase();
    const matchesQuery =
      !query ||
      order.id.toLowerCase().includes(query) ||
      (order.customerName && order.customerName.toLowerCase().includes(query)) ||
      (order.customerPhone && order.customerPhone.includes(query)) ||
      order.materialName.toLowerCase().includes(query) ||
      order.techniqueName.toLowerCase().includes(query);

    return matchesStatus && matchesQuery;
  });

  // Metric counts
  const counts = {
    total: orders.length,
    waiting: orders.filter((o) => o.status === 'Waiting for Payment').length,
    dp: orders.filter((o) => o.status === 'Order masuk DP').length,
    processing: orders.filter((o) => o.status === 'On Processed').length,
    shipping: orders.filter((o) => o.status === 'On Sending' || o.status === 'Ready to send').length,
    done: orders.filter((o) => o.status === 'Done').length,
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-semibold animate-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header & Action Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Daftar Pesanan Masuk (OrderList)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola pesanan dari customer WhatsApp, verifikasi pembayaran DP, dan perbarui resi pengiriman.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={refreshOrders}
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition shadow-xs text-xs flex items-center gap-1.5"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            onClick={handleResetSampleOrders}
            className="py-2.5 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-medium transition"
          >
            Reset Contoh
          </button>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div
          onClick={() => setFilterStatus('all')}
          className={`p-4 rounded-2xl border cursor-pointer transition ${
            filterStatus === 'all'
              ? 'bg-slate-900 text-white border-slate-900 shadow-md'
              : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
          }`}
        >
          <div className="text-[11px] uppercase font-bold opacity-75">Semua Pesanan</div>
          <div className="text-2xl font-black mt-1">{counts.total}</div>
        </div>

        <div
          onClick={() => setFilterStatus('Waiting for Payment')}
          className={`p-4 rounded-2xl border cursor-pointer transition ${
            filterStatus === 'Waiting for Payment'
              ? 'bg-amber-500 text-white border-amber-600 shadow-md'
              : 'bg-white border-slate-200 hover:border-amber-300 text-slate-800'
          }`}
        >
          <div className="text-[11px] uppercase font-bold opacity-75 flex items-center justify-between">
            <span>Menunggu Bayar</span>
            <span className="w-2 h-2 rounded-full bg-amber-400" />
          </div>
          <div className="text-2xl font-black mt-1 text-amber-700">{counts.waiting}</div>
        </div>

        <div
          onClick={() => setFilterStatus('On Processed')}
          className={`p-4 rounded-2xl border cursor-pointer transition ${
            filterStatus === 'On Processed'
              ? 'bg-indigo-600 text-white border-indigo-700 shadow-md'
              : 'bg-white border-slate-200 hover:border-indigo-300 text-slate-800'
          }`}
        >
          <div className="text-[11px] uppercase font-bold opacity-75 flex items-center justify-between">
            <span>Sedang Diproduksi</span>
            <span className="w-2 h-2 rounded-full bg-indigo-400" />
          </div>
          <div className="text-2xl font-black mt-1 text-indigo-700">{counts.processing}</div>
        </div>

        <div
          onClick={() => setFilterStatus('Done')}
          className={`p-4 rounded-2xl border cursor-pointer transition ${
            filterStatus === 'Done'
              ? 'bg-emerald-600 text-white border-emerald-700 shadow-md'
              : 'bg-white border-slate-200 hover:border-emerald-300 text-slate-800'
          }`}
        >
          <div className="text-[11px] uppercase font-bold opacity-75 flex items-center justify-between">
            <span>Selesai (Done)</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
          </div>
          <div className="text-2xl font-black mt-1 text-emerald-700">{counts.done}</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari kode order (CK-...), nama pemesan, atau bahan..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-slate-900 transition bg-slate-50/50"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
        </div>

        {/* Status Dropdown */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs font-semibold text-slate-600">Status:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="py-1.5 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:border-slate-900"
          >
            <option value="all">Semua Status ({orders.length})</option>
            {ALL_STATUSES.map((st) => (
              <option key={st} value={st}>
                {st} ({orders.filter((o) => o.status === st).length})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3.5 px-3 w-16">Preview</th>
                  <th className="py-3.5 px-4">Order ID & Tanggal</th>
                  <th className="py-3.5 px-4">Customer & Kontak</th>
                  <th className="py-3.5 px-4">Spesifikasi Kaos</th>
                  <th className="py-3.5 px-4">Qty & Total Tagihan</th>
                  <th className="py-3.5 px-4">Status Produksi</th>
                  <th className="py-3.5 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map((order) => {
                  const badge = getStatusBadge(order.status);
                  return (
                    <tr key={order.id} className="hover:bg-slate-50/80 transition">
                      {/* Preview Thumbnail */}
                      <td className="py-3.5 px-3">
                        {order.mockupPreview ? (
                          <img
                            src={order.mockupPreview}
                            alt="Mockup"
                            className="w-12 h-14 object-cover rounded-lg border border-slate-200 shadow-2xs"
                          />
                        ) : (
                          <div className="w-12 h-14 bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-center">
                            <Image className="w-4 h-4 text-slate-300" />
                          </div>
                        )}
                      </td>

                      {/* ID & Date */}
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-black text-slate-900 text-sm">
                          {order.id}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {new Date(order.createdAt).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-800">
                          {order.customerName || 'Pelanggan WA'}
                        </div>
                        {order.customerPhone && (
                          <a
                            href={`https://wa.me/${order.customerPhone.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] text-emerald-600 hover:text-emerald-700 font-mono font-medium flex items-center gap-1 mt-0.5"
                            title="Chat WhatsApp Customer"
                          >
                            <MessageSquare className="w-3 h-3" />
                            <span>{order.customerPhone}</span>
                          </a>
                        )}
                        {order.shippingCity && (
                          <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            <span className="truncate max-w-[140px]">{order.shippingCity}</span>
                          </div>
                        )}
                      </td>

                      {/* Garment specs */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                          <span
                            className="w-2.5 h-2.5 rounded-full border border-slate-300 flex-shrink-0"
                            style={{ backgroundColor: order.colorHex }}
                          />
                          <span>
                            {order.colorName} ({order.size})
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {order.materialName} • {order.techniqueName}
                        </div>
                      </td>

                      {/* Total */}
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-slate-900 text-sm">
                          Rp {order.grandTotal.toLocaleString('id-ID')}
                        </div>
                        <div className="text-[10px] text-slate-500 font-medium">
                          {order.quantity} pcs @ Rp {order.unitPrice.toLocaleString('id-ID')}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-bold ${badge.bg}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                          <span>{badge.label}</span>
                        </span>
                        {order.trackingNumber && (
                          <div className="text-[10px] font-mono text-slate-500 mt-1 flex items-center gap-1">
                            <Truck className="w-3 h-3 text-slate-400" />
                            <span>{order.courier}: {order.trackingNumber}</span>
                          </div>
                        )}
                        {order.driveFolderUrl && (
                          <a
                            href={order.driveFolderUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] text-sky-600 hover:text-sky-700 font-semibold flex items-center gap-1 mt-1"
                            title="Buka Folder Google Drive"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>Google Drive</span>
                          </a>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(order)}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300 transition"
                            title="Update Status / Detail"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(order.id)}
                            className="p-1.5 rounded-lg border border-slate-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 transition"
                            title="Hapus Order"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center space-y-3">
            <Package className="w-10 h-10 text-slate-300 mx-auto" />
            <div className="text-sm font-bold text-slate-800">
              Tidak ada pesanan yang sesuai filter
            </div>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Cobalah ubah kata kunci pencarian atau ganti filter status ke "Semua Status".
            </p>
          </div>
        )}
      </div>

      {/* Edit / Detail Modal */}
      {isEditModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Update Status Pesanan</span>
                <h3 className="text-base font-black text-slate-900 font-mono">
                  {selectedOrder.id}
                </h3>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Customer & Specs Detail Card */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150 space-y-2 text-xs text-slate-700">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Pemesan</span>
                  <div className="font-bold text-slate-900 text-sm">
                    {selectedOrder.customerName || 'Pelanggan WA'}
                  </div>
                  {selectedOrder.customerPhone && (
                    <div className="font-mono text-slate-500 text-[11px] mt-0.5">
                      {selectedOrder.customerPhone}
                    </div>
                  )}
                </div>
                {selectedOrder.customerPhone && (
                  <a
                    href={`https://wa.me/${selectedOrder.customerPhone.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="py-1 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] flex items-center gap-1 transition"
                  >
                    <MessageSquare className="w-3 h-3" />
                    <span>Chat WA</span>
                  </a>
                )}
              </div>

              {(selectedOrder.shippingAddress || selectedOrder.shippingCity) && (
                <div className="pb-2 border-b border-slate-200/60 space-y-0.5">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Alamat Pengiriman</span>
                  {selectedOrder.shippingCity && (
                    <div className="font-semibold text-slate-800 text-[11px]">
                      {selectedOrder.shippingCity}
                    </div>
                  )}
                  {selectedOrder.shippingAddress && (
                    <div className="text-slate-600 text-[11px] leading-relaxed">
                      {selectedOrder.shippingAddress}
                    </div>
                  )}
                </div>
              )}

              {selectedOrder.customerNotes && (
                <div className="pb-2 border-b border-slate-200/60 bg-amber-50/60 p-2 rounded-xl border border-amber-200/60">
                  <span className="text-[10px] text-amber-800 font-bold uppercase block">Catatan Khusus dari Pemesan:</span>
                  <p className="text-slate-700 text-[11px] italic mt-0.5">"{selectedOrder.customerNotes}"</p>
                </div>
              )}

              <div className="flex justify-between pt-1">
                <span className="text-slate-500">Spesifikasi:</span>
                <span className="font-semibold text-slate-800">
                  {selectedOrder.colorName} • {selectedOrder.materialName}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Ukuran:</span>
                <span className="font-semibold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                  {selectedOrder.size}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Qty & Tagihan:</span>
                <span className="font-mono font-bold text-sky-700">
                  {selectedOrder.quantity} Pcs • Rp {selectedOrder.grandTotal.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            {/* Mockup Preview & Files */}
            {(selectedOrder.mockupPreview || selectedOrder.mockupPreviews || selectedOrder.driveFolderUrl || (selectedOrder.designFiles && selectedOrder.designFiles.length > 0)) && (() => {
              const hasMultiAngles =
                selectedOrder.mockupPreviews &&
                Object.keys(selectedOrder.mockupPreviews).length > 1;

              const currentModalImage = hasMultiAngles
                ? selectedOrder.mockupPreviews?.[modalAngle] || selectedOrder.mockupPreview
                : selectedOrder.mockupPreview || (selectedOrder.mockupPreviews && Object.values(selectedOrder.mockupPreviews)[0]);

              return (
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">
                      {hasMultiAngles ? 'Preview Mockup (Multi-Sudut)' : 'Preview Mockup'}
                    </div>

                    {/* Angle Switcher (Only if multi-angles exist) */}
                    {hasMultiAngles && (
                      <div className="flex items-center bg-white border border-slate-200 p-0.5 rounded-lg text-[10px] font-bold">
                        {[
                          { id: 'front' as const, label: 'Depan' },
                          { id: 'back' as const, label: 'Belakang' },
                          { id: 'sleeve-left' as const, label: 'Kiri' },
                          { id: 'sleeve-right' as const, label: 'Kanan' },
                        ].map((tab) => (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => setModalAngle(tab.id)}
                            className={`px-2 py-0.5 rounded-md transition ${
                              modalAngle === tab.id
                                ? 'bg-slate-900 text-white'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            {tab.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-center bg-white p-3 rounded-xl border border-slate-200">
                    {currentModalImage ? (
                      <img
                        src={currentModalImage}
                        alt={`Mockup Preview (${hasMultiAngles ? modalAngle : 'Utama'})`}
                        className="max-h-56 object-contain rounded-lg shadow-2xs"
                      />
                    ) : (
                      <div className="py-8 text-xs text-slate-400">
                        Tidak ada preview untuk sudut ini
                      </div>
                    )}
                  </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {selectedOrder.driveFolderUrl && (
                    <a
                      href={selectedOrder.driveFolderUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 px-3 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl transition shadow-2xs"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Buka Folder Google Drive</span>
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={() => handleDownloadZip(selectedOrder)}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition shadow-2xs cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Semua File (ZIP)</span>
                  </button>
                </div>
              </div>
            );
          })()}

            {/* Form */}
            <form onSubmit={handleSaveStatus} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-800 block mb-1.5">
                  Status Pesanan Terkini
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as OrderStatus)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold text-slate-900 bg-white focus:outline-none focus:border-slate-900"
                >
                  {ALL_STATUSES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  Status ini akan langsung tampil saat customer melacak di portal <code>#/cekorderan</code>.
                </p>
              </div>

              {/* Kurir & Nomor Resi */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Ekspedisi / Kurir
                  </label>
                  <input
                    type="text"
                    value={editCourier}
                    onChange={(e) => setEditCourier(e.target.value)}
                    placeholder="J&T, JNE, SiCepat, dll"
                    className="w-full p-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:border-slate-900"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Nomor Resi
                  </label>
                  <input
                    type="text"
                    value={editTrackingNumber}
                    onChange={(e) => setEditTrackingNumber(e.target.value)}
                    placeholder="Contoh: JT981273910"
                    className="w-full p-2 rounded-xl border border-slate-300 font-mono bg-white focus:outline-none focus:border-slate-900"
                  />
                </div>
              </div>

              {/* Admin Notes */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Catatan Admin / Keterangan
                </label>
                <textarea
                  rows={2}
                  value={editAdminNotes}
                  onChange={(e) => setEditAdminNotes(e.target.value)}
                  placeholder="Contoh: DP 50% sudah diterima via transfer BCA. Kaos dalam proses print..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white focus:outline-none focus:border-slate-900 resize-none"
                />
              </div>

              {/* Footer Buttons */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition shadow-xs flex items-center justify-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
