import type { CartItem } from '../types';
import { getBankAccounts } from './bankConfig';

export interface InvoiceData {
  orderCode: string;
  customerName?: string;
  customerPhone?: string;
  shippingCity?: string;
  shippingAddress?: string;
  items: CartItem[];
  rawSubtotal: number;
  couponDiscountAmount?: number;
  couponCode?: string;
  grandTotal: number;
  paymentType: 'dp_50' | 'full';
  dpAmount: number;
  remainingAmount: number;
}

export const printInvoiceDocument = (data: InvoiceData) => {
  const printWindow = window.open('', '_blank', 'width=900,height=1000');
  if (!printWindow) {
    alert('Pop-up browser terblokir. Harap izinkan pop-up untuk mencetak invoice.');
    return;
  }

  const bankAccounts = getBankAccounts();
  const bank = bankAccounts[0] || {
    bankName: 'BCA',
    accountNumber: '8105-2983-11',
    holderName: 'Custom Apparel Bandung',
  };

  const totalQuantity = data.items.reduce((sum, i) => sum + i.quantity, 0);

  const itemsRows = data.items
    .map(
      (item, idx) => `
    <tr style="border-bottom: 1px solid #e2e8f0;">
      <td style="padding: 10px 8px; font-weight: bold; color: #0f172a;">#${idx + 1}</td>
      <td style="padding: 10px 8px;">
        <div style="font-weight: bold; color: #1e293b;">Kaos ${
          item.neckType === 'round' ? 'O-Neck' : 'V-Neck'
        } (${item.sleeveType === 'short' ? 'Lengan Pendek' : 'Lengan Panjang'})</div>
        <div style="font-size: 11px; color: #64748b;">Warna: ${item.colorName} • Bahan: ${
        item.materialName
      }</div>
        <div style="font-size: 11px; color: #0284c7;">Sablon: ${item.techniqueName} (${
        item.printBreakdown && item.printBreakdown.length > 0
          ? item.printBreakdown.map((p) => p.name).join(', ')
          : 'Polos'
      })</div>
      </td>
      <td style="padding: 10px 8px; font-size: 11px; color: #334155;">
        ${
          item.sizeBreakdown
            ? Object.entries(item.sizeBreakdown)
                .filter(([_, q]) => q > 0)
                .map(([s, q]) => `<strong>${s}:</strong> ${q}pcs`)
                .join(', ')
            : item.size
        }
      </td>
      <td style="padding: 10px 8px; text-align: center; font-weight: bold;">${item.quantity}</td>
      <td style="padding: 10px 8px; text-align: right; font-family: monospace;">Rp ${(
        item.unitPrice || Math.round(item.subtotal / item.quantity)
      ).toLocaleString('id-ID')}</td>
      <td style="padding: 10px 8px; text-align: right; font-weight: bold; font-family: monospace;">Rp ${item.subtotal.toLocaleString(
        'id-ID'
      )}</td>
    </tr>
  `
    )
    .join('');

  const html = `<!DOCTYPE html>
<html>
<head>
  <title>Invoice - ${data.orderCode} - Custom Apparel Bandung.id</title>
  <meta charset="utf-8" />
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; margin: 30px; color: #1e293b; font-size: 13px; line-height: 1.5; }
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0284c7; padding-bottom: 16px; margin-bottom: 20px; }
    .brand { font-size: 20px; font-weight: 900; color: #0f172a; }
    .brand-sub { font-size: 11px; color: #64748b; margin-top: 2px; }
    .inv-badge { text-align: right; }
    .inv-title { font-size: 18px; font-weight: 800; color: #0284c7; }
    .inv-code { font-family: monospace; font-size: 14px; font-weight: bold; color: #334155; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; padding: 14px; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    th { background: #0f172a; color: white; padding: 10px 8px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
    .total-box { margin-left: auto; width: 340px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px; margin-bottom: 24px; }
    .total-row { display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 12px; }
    .total-row.grand { font-size: 15px; font-weight: 900; color: #0f172a; border-top: 2px dashed #cbd5e1; padding-top: 8px; margin-top: 6px; }
    .payment-box { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 14px; margin-bottom: 24px; }
    .footer-terms { font-size: 10px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 14px; margin-top: 30px; }
    .sig-grid { display: flex; justify-content: space-between; margin-top: 40px; text-align: center; }
    .sig-line { width: 180px; border-bottom: 1px solid #94a3b8; margin: 50px auto 6px auto; }
    @media print {
      body { margin: 15mm; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="margin-bottom: 20px; text-align: right;">
    <button onclick="window.print()" style="background: #0284c7; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; cursor: pointer;">🖨️ Cetak / Simpan PDF</button>
  </div>

  <div class="header">
    <div>
      <div class="brand">CUSTOM APPAREL BANDUNG.ID</div>
      <div class="brand-sub">Konveksi & Studio Sablon Kaos Custom Terpercaya • Bandung, Jawa Barat</div>
      <div class="brand-sub">WhatsApp: +62 895-3563-38321 • Website: Custom Apparel Bandung Studio</div>
    </div>
    <div class="inv-badge">
      <div class="inv-title">INVOICE PEMESANAN</div>
      <div class="inv-code">NO: ${data.orderCode}</div>
      <div style="font-size: 11px; color: #64748b;">Tanggal: ${new Date().toLocaleDateString('id-ID', {
        dateStyle: 'long',
      })}</div>
    </div>
  </div>

  <div class="info-grid">
    <div>
      <div style="font-weight: bold; color: #0f172a; margin-bottom: 4px; font-size: 11px; text-transform: uppercase;">DITUJUKAN KEPADA:</div>
      <div style="font-size: 14px; font-weight: bold;">${data.customerName || 'Pelanggan'}</div>
      <div>No. WhatsApp: <strong>${data.customerPhone || '-'}</strong></div>
      <div>Kota: ${data.shippingCity || '-'}</div>
      <div style="margin-top: 4px; color: #475569;">Alamat: ${data.shippingAddress || '-'}</div>
    </div>
    <div>
      <div style="font-weight: bold; color: #0f172a; margin-bottom: 4px; font-size: 11px; text-transform: uppercase;">DETAIL TRANSAKSI:</div>
      <div>Status: <span style="background: #fef3c7; color: #92400e; padding: 2px 8px; border-radius: 10px; font-weight: bold; font-size: 11px;">Menunggu Pembayaran</span></div>
      <div>Skema Bayar: <strong>${
        data.paymentType === 'dp_50' ? 'Uang Muka (DP 50%)' : 'Pembayaran Lunas (100%)'
      }</strong></div>
      <div>Total Qty: <strong>${totalQuantity} pcs</strong> (${data.items.length} Model Desain)</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 30px; text-align: left;">No</th>
        <th style="text-align: left;">Spesifikasi Kaos & Sablon</th>
        <th style="text-align: left;">Rincian Ukuran</th>
        <th style="text-align: center; width: 60px;">Qty</th>
        <th style="text-align: right; width: 110px;">Harga Satuan</th>
        <th style="text-align: right; width: 120px;">Subtotal</th>
      </tr>
    </thead>
    <tbody>
      ${itemsRows}
    </tbody>
  </table>

  <div class="total-box">
    <div class="total-row">
      <span>Subtotal Pesanan:</span>
      <span style="font-family: monospace;">Rp ${data.rawSubtotal.toLocaleString('id-ID')}</span>
    </div>
    ${
      (data.couponDiscountAmount ?? 0) > 0
        ? `
      <div class="total-row" style="color: #16a34a; font-weight: bold;">
        <span>Diskon Kupon (${data.couponCode}):</span>
        <span style="font-family: monospace;">- Rp ${(data.couponDiscountAmount ?? 0).toLocaleString(
          'id-ID'
        )}</span>
      </div>
    `
        : ''
    }
    <div class="total-row grand">
      <span>Grand Total:</span>
      <span style="color: #0284c7;">Rp ${data.grandTotal.toLocaleString('id-ID')}</span>
    </div>
    ${
      data.paymentType === 'dp_50'
        ? `
      <div class="total-row" style="font-weight: bold; color: #0f172a; margin-top: 8px;">
        <span>Tagihan Uang Muka (DP 50%):</span>
        <span style="font-family: monospace; color: #d97706;">Rp ${data.dpAmount.toLocaleString(
          'id-ID'
        )}</span>
      </div>
      <div class="total-row" style="font-size: 11px; color: #64748b;">
        <span>Sisa Pelunasan (Saat Siap Kirim):</span>
        <span style="font-family: monospace;">Rp ${data.remainingAmount.toLocaleString(
          'id-ID'
        )}</span>
      </div>
    `
        : `
      <div class="total-row" style="font-weight: bold; color: #16a34a; margin-top: 8px;">
        <span>Total Bayar Sekarang:</span>
        <span style="font-family: monospace;">Rp ${data.grandTotal.toLocaleString('id-ID')}</span>
      </div>
    `
    }
  </div>

  <div class="payment-box">
    <div style="font-weight: bold; color: #1e3a8a; margin-bottom: 6px;">REKENING RESMI PEMBAYARAN:</div>
    <div style="font-size: 13px; font-weight: bold;">
      ${bank.bankName} - ${bank.accountNumber}
    </div>
    <div style="font-size: 12px; color: #3b82f6;">Atas Nama: <strong>${bank.holderName}</strong></div>
    <div style="font-size: 11px; color: #64748b; margin-top: 4px;">*Harap lampirkan bukti transfer dan kirimkan konfirmasi via WhatsApp untuk proses pengerjaan.</div>
  </div>

  <div class="sig-grid">
    <div>
      <div>Hormat Kami,</div>
      <div class="sig-line"></div>
      <strong>Custom Apparel Bandung.id</strong>
    </div>
    <div>
      <div>Disetujui Oleh Pemesan,</div>
      <div class="sig-line"></div>
      <strong>${data.customerName || 'Pelanggan'}</strong>
    </div>
  </div>

  <div class="footer-terms">
    <strong>Syarat & Ketentuan:</strong> Estimasi pengerjaan sablon 3-7 hari kerja terhitung sejak DP/Pembayaran dan validasi approval desain diterima. Warna sablon dan kain dapat memiliki sedikit deviasi visual layar versus cetak fisik (±5%).
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); }, 400);
    };
  </script>
</body>
</html>`;

  printWindow.document.write(html);
  printWindow.document.close();
};

