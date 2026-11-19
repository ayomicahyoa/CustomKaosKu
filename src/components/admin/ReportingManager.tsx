import React, { useState, useMemo } from 'react';
import type { CustomerOrder } from '../../types';
import { loadOrders } from '../../services/ordersStorage';
import {
  TrendingUp,
  DollarSign,
  Package,
  Calendar,
  Layers,
  Printer,
  PieChart,
  BarChart3,
  Download,
} from 'lucide-react';

type PeriodFilter = 'today' | '7days' | 'month' | 'all';

export const ReportingManager: React.FC = () => {
  const [period, setPeriod] = useState<PeriodFilter>('month');
  const [orders] = useState<CustomerOrder[]>(() => loadOrders());

  // Filter orders by selected period
  const filteredOrders = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const sevenDaysAgo = startOfToday - 6 * 24 * 60 * 60 * 1000;
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    return orders.filter((order) => {
      const orderTime = new Date(order.createdAt).getTime();
      switch (period) {
        case 'today':
          return orderTime >= startOfToday;
        case '7days':
          return orderTime >= sevenDaysAgo;
        case 'month':
          return orderTime >= startOfMonth;
        case 'all':
        default:
          return true;
      }
    });
  }, [orders, period]);

  // Aggregated calculations
  const stats = useMemo(() => {
    // Only non-canceled orders contribute to revenue
    const activeOrders = filteredOrders.filter((o) => o.status !== 'Cancel');
    const totalRevenue = activeOrders.reduce((sum, o) => sum + o.grandTotal, 0);
    const totalPcs = activeOrders.reduce((sum, o) => sum + o.quantity, 0);
    const totalOrders = filteredOrders.length;
    const aov = activeOrders.length > 0 ? Math.round(totalRevenue / activeOrders.length) : 0;

    // Status breakdown
    const statusMap: Record<string, { count: number; total: number }> = {};
    filteredOrders.forEach((o) => {
      if (!statusMap[o.status]) statusMap[o.status] = { count: 0, total: 0 };
      statusMap[o.status].count += 1;
      statusMap[o.status].total += o.grandTotal;
    });

    // Material breakdown
    const materialMap: Record<string, { pcs: number; revenue: number }> = {};
    activeOrders.forEach((o) => {
      if (!materialMap[o.materialName]) materialMap[o.materialName] = { pcs: 0, revenue: 0 };
      materialMap[o.materialName].pcs += o.quantity;
      materialMap[o.materialName].revenue += o.grandTotal;
    });

    // Technique breakdown
    const techniqueMap: Record<string, { pcs: number; revenue: number }> = {};
    activeOrders.forEach((o) => {
      if (!techniqueMap[o.techniqueName]) techniqueMap[o.techniqueName] = { pcs: 0, revenue: 0 };
      techniqueMap[o.techniqueName].pcs += o.quantity;
      techniqueMap[o.techniqueName].revenue += o.grandTotal;
    });

    // Daily breakdown
    const dailyMap: Record<string, { date: string; orders: number; pcs: number; revenue: number }> = {};
    activeOrders.forEach((o) => {
      const dateKey = new Date(o.createdAt).toISOString().split('T')[0];
      if (!dailyMap[dateKey]) {
        dailyMap[dateKey] = {
          date: dateKey,
          orders: 0,
          pcs: 0,
          revenue: 0,
        };
      }
      dailyMap[dateKey].orders += 1;
      dailyMap[dateKey].pcs += o.quantity;
      dailyMap[dateKey].revenue += o.grandTotal;
    });

    const dailyList = Object.values(dailyMap).sort((a, b) => b.date.localeCompare(a.date));

    return {
      totalRevenue,
      totalPcs,
      totalOrders,
      aov,
      statusMap,
      materialMap,
      techniqueMap,
      dailyList,
    };
  }, [filteredOrders]);

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Order ID', 'Tanggal', 'Status', 'Customer', 'Warna', 'Bahan', 'Teknik', 'Size', 'Qty', 'Grand Total (IDR)'];
    const rows = filteredOrders.map((o) => [
      o.id,
      new Date(o.createdAt).toISOString().split('T')[0],
      `"${o.status}"`,
      `"${o.customerName || 'Pelanggan WA'}"`,
      `"${o.colorName}"`,
      `"${o.materialName}"`,
      `"${o.techniqueName}"`,
      o.size,
      o.quantity,
      o.grandTotal,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `laporan-penjualan-cab-${period}-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Laporan Penjualan (Reporting)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Analisis omset penjualan, jumlah produksi kaos, dan tren sablon populer.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Period selector */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center text-xs font-semibold">
            <button
              onClick={() => setPeriod('today')}
              className={`py-1.5 px-3 rounded-lg transition ${
                period === 'today' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Hari Ini
            </button>
            <button
              onClick={() => setPeriod('7days')}
              className={`py-1.5 px-3 rounded-lg transition ${
                period === '7days' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              7 Hari
            </button>
            <button
              onClick={() => setPeriod('month')}
              className={`py-1.5 px-3 rounded-lg transition ${
                period === 'month' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Bulan Ini
            </button>
            <button
              onClick={() => setPeriod('all')}
              className={`py-1.5 px-3 rounded-lg transition ${
                period === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua
            </button>
          </div>

          {/* Export Button */}
          <button
            onClick={handleExportCSV}
            className="py-2 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition flex items-center gap-1.5 shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* Metric Highlights */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Omset */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Total Omset (Gross)
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
            Rp {stats.totalRevenue.toLocaleString('id-ID')}
          </div>
          <div className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1 pt-1">
            <TrendingUp className="w-3 h-3" />
            <span>Dari pesanan aktif terkonfirmasi</span>
          </div>
        </div>

        {/* Total Kaos Pcs */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Total Kaos Terjual
            </span>
            <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
            {stats.totalPcs.toLocaleString('id-ID')} <span className="text-xs font-sans font-bold text-slate-400">Pcs</span>
          </div>
          <div className="text-[10px] text-slate-400 pt-1">
            Volume produksi periode ini
          </div>
        </div>

        {/* Total Transaksi */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Total Transaksi
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
            {stats.totalOrders} <span className="text-xs font-sans font-bold text-slate-400">Pesanan</span>
          </div>
          <div className="text-[10px] text-slate-400 pt-1">
            Termasuk antrian & selesai
          </div>
        </div>

        {/* Rata-rata Pesanan (AOV) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Rata-rata Order (AOV)
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <PieChart className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
            Rp {stats.aov.toLocaleString('id-ID')}
          </div>
          <div className="text-[10px] text-slate-400 pt-1">
            Nilai rata-rata per transaksi
          </div>
        </div>
      </div>

      {/* Grid Charts / Breakdowns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Top Bahan Kaos */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-sky-500" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Volume Penjualan Bahan Kaos
              </h3>
            </div>
            <span className="text-[10px] text-slate-400">Total Pcs</span>
          </div>

          <div className="space-y-3">
            {Object.entries(stats.materialMap).length > 0 ? (
              Object.entries(stats.materialMap)
                .sort((a, b) => b[1].pcs - a[1].pcs)
                .map(([name, data]) => {
                  const percent = stats.totalPcs > 0 ? Math.round((data.pcs / stats.totalPcs) * 100) : 0;
                  return (
                    <div key={name} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold text-slate-800">
                        <span>{name}</span>
                        <span className="font-mono">{data.pcs} pcs ({percent}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-sky-500 h-full rounded-full transition-all duration-300"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <div className="text-[10px] text-slate-400 text-right font-mono">
                        Omset: Rp {data.revenue.toLocaleString('id-ID')}
                      </div>
                    </div>
                  );
                })
            ) : (
              <div className="py-6 text-center text-xs text-slate-400 italic">
                Belum ada data penjualan pada periode ini.
              </div>
            )}
          </div>
        </div>

        {/* Top Teknik Sablon */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Printer className="w-4 h-4 text-indigo-500" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Popularitas Teknik Sablon
              </h3>
            </div>
            <span className="text-[10px] text-slate-400">Total Pcs</span>
          </div>

          <div className="space-y-3">
            {Object.entries(stats.techniqueMap).length > 0 ? (
              Object.entries(stats.techniqueMap)
                .sort((a, b) => b[1].pcs - a[1].pcs)
                .map(([name, data]) => {
                  const percent = stats.totalPcs > 0 ? Math.round((data.pcs / stats.totalPcs) * 100) : 0;
                  return (
                    <div key={name} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold text-slate-800">
                        <span>{name}</span>
                        <span className="font-mono">{data.pcs} pcs ({percent}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-indigo-500 h-full rounded-full transition-all duration-300"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <div className="text-[10px] text-slate-400 text-right font-mono">
                        Omset: Rp {data.revenue.toLocaleString('id-ID')}
                      </div>
                    </div>
                  );
                })
            ) : (
              <div className="py-6 text-center text-xs text-slate-400 italic">
                Belum ada data penjualan pada periode ini.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Daily Sales Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-500" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Rekapitulasi Penjualan Harian
            </h3>
          </div>
          <span className="text-[10px] text-slate-400">
            {stats.dailyList.length} hari dengan transaksi
          </span>
        </div>

        {stats.dailyList.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Tanggal Transaksi</th>
                  <th className="py-3 px-4">Jumlah Order</th>
                  <th className="py-3 px-4">Volume Kaos (Pcs)</th>
                  <th className="py-3 px-4 text-right">Total Omset (IDR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {stats.dailyList.map((row) => (
                  <tr key={row.date} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-sans font-semibold text-slate-900">
                      {new Date(row.date).toLocaleDateString('id-ID', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3 px-4 text-slate-700">{row.orders} transaksi</td>
                    <td className="py-3 px-4 text-slate-700">{row.pcs} pcs</td>
                    <td className="py-3 px-4 text-right font-black text-slate-900">
                      Rp {row.revenue.toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-slate-400 italic">
            Belum ada rekapitulasi harian pada filter yang dipilih.
          </div>
        )}
      </div>
    </div>
  );
};
