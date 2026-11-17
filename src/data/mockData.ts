import type { MaterialOption, PrintTechnique, ShirtColor, PrintZonePreset } from '../types';

export const SHIRT_COLORS: ShirtColor[] = [
  { id: 'black', name: 'Jet Black', hex: '#18181b', isDark: true },
  { id: 'white', name: 'Pure White', hex: '#f8fafc', isDark: false },
  { id: 'navy', name: 'Navy Blue', hex: '#1e293b', isDark: true },
  { id: 'maroon', name: 'Deep Maroon', hex: '#631d27', isDark: true },
  { id: 'forest', name: 'Forest Green', hex: '#143823', isDark: true },
  { id: 'sage', name: 'Sage Green', hex: '#8da38f', isDark: false },
  { id: 'terracotta', name: 'Terracotta', hex: '#a84c32', isDark: true },
  { id: 'mustard', name: 'Mustard Gold', hex: '#d99726', isDark: false },
  { id: 'charcoal', name: 'Misty Charcoal', hex: '#3f3f46', isDark: true },
  { id: 'sand', name: 'Warm Sand / Beige', hex: '#e2d4be', isDark: false },
  { id: 'lilac', name: 'Soft Lilac', hex: '#c4b5fd', isDark: false },
  { id: 'babyblue', name: 'Baby Blue', hex: '#93c5fd', isDark: false },
];

export const MATERIALS: MaterialOption[] = [
  {
    id: 'combed-30s',
    name: 'Cotton Combed 30s',
    gsm: '150 - 160 gsm',
    description: 'Standar distro paling populer di Indonesia. Sangat adem, halus, menyerap keringat, pas untuk iklim tropis.',
    basePrice: 55000,
    badge: 'Paling Populer',
  },
  {
    id: 'combed-24s',
    name: 'Cotton Combed 24s',
    gsm: '180 - 190 gsm',
    description: 'Lebih tebal dan kokoh dari 30s, tidak menerawang, tetap jatuh rapi dan nyaman seharian.',
    basePrice: 60000,
    badge: 'Recommended',
  },
  {
    id: 'combed-20s',
    name: 'Cotton Combed 20s',
    gsm: '200 - 210 gsm',
    description: 'Kain tebal dan kokoh bergaya vintage/streetwear klasik. Daya tahan sangat tinggi.',
    basePrice: 65000,
  },
  {
    id: 'bamboo-cotton',
    name: 'Cotton Bamboo 30s',
    gsm: '160 gsm',
    description: 'Kombinasi serat bambu alami dan katun. Antibakteri alami, sangat lembut sutra, dingin di kulit.',
    basePrice: 75000,
    badge: 'Premium Eco',
  },
  {
    id: 'heavyweight-16s',
    name: 'Heavyweight Cotton 16s',
    gsm: '235 - 245 gsm',
    description: 'Sangat tebal, boxy streetwear fit, tidak mudah melar, disukai brand streetwear modern.',
    basePrice: 85000,
    badge: 'Oversize / Boxy',
  },
];

export const PRINT_TECHNIQUES: PrintTechnique[] = [
  {
    id: 'dtf',
    name: 'DTF (Direct to Film)',
    badge: 'Best Seller',
    description: 'Teknologi cetak digital modern beresolusi tinggi. Warna gradasi foto tajam, elastis, tidak pecah.',
    bestFor: 'Desain full color, ilustrasi detail, gradasi, cetak satuan (No Min. Order)',
    minQty: 1,
    baseCost: 20000,
  },
  {
    id: 'polyflex',
    name: 'Polyflex (Heat Transfer Vinyl)',
    badge: 'Presisi & Solid',
    description: 'Stiker vinyl PU import di-press panas. Warna solid ekstra pekat, finishing matte atau glitter/reflektif.',
    bestFor: 'Nomor punggung, logo 1-2 warna, tipografi tegas, jersey style',
    minQty: 1,
    baseCost: 25000,
  },
  {
    id: 'plastisol',
    name: 'Sablon Manual - Plastisol',
    badge: 'Standar Distro Dunia',
    description: 'Sablon berbasis oil-based ink. Sangat awet tahan cuci bertahun-tahun, warna cerah di atas kain gelap.',
    bestFor: 'Order quantity menengah/besar (>12 pcs), merchandise band/event',
    minQty: 12,
    baseCost: 15000,
  },
  {
    id: 'rubber',
    name: 'Sablon Manual - Rubber (GL)',
    badge: 'Ekonomis & Lentur',
    description: 'Tinta water-based lentur mengikuti serat kain. Lembut dan nyaman digunakan.',
    bestFor: 'Desain kasual, seragam komunitas, harga terjangkau',
    minQty: 12,
    baseCost: 12000,
  },
  {
    id: 'discharge',
    name: 'Sablon Manual - Discharge (Cabut Warna)',
    badge: 'Zero-Feel Handfeel',
    description: 'Tinta meresap ke serat kain dan menggantikan pigmen asli kain. Tidak ada lapisan tebal (terasa seperti kain polos).',
    bestFor: 'Kaos warna gelap katun 100%, handfeel super halus tanpa rasa karet',
    minQty: 24,
    baseCost: 22000,
  },
];

export const PRINT_ZONE_PRESETS: PrintZonePreset[] = [
  // Front Presets
  {
    id: 'chest-left',
    name: 'Logo Dada Kiri',
    dimensions: '10 x 10 cm',
    view: 'front',
    defaultX: 38,
    defaultY: 33,
    defaultWidth: 15,
    defaultHeight: 15,
    description: 'Posisi saku dada kiri, cocok untuk logo brand atau emblem minimalis.',
    cost: 10000,
  },
  {
    id: 'chest-right',
    name: 'Logo Dada Kanan',
    dimensions: '10 x 10 cm',
    view: 'front',
    defaultX: 62,
    defaultY: 33,
    defaultWidth: 15,
    defaultHeight: 15,
    description: 'Posisi dada kanan untuk co-branding atau logo sekunder.',
    cost: 10000,
  },
  {
    id: 'chest-top',
    name: 'Full Dada Atas',
    dimensions: '28 x 15 cm',
    view: 'front',
    defaultX: 50,
    defaultY: 33,
    defaultWidth: 38,
    defaultHeight: 20,
    description: 'Area horizontal di atas dada, ideal untuk tipografi brand lebar.',
    cost: 18000,
  },
  {
    id: 'front-a4',
    name: 'A4 Center Depan',
    dimensions: '21 x 30 cm',
    view: 'front',
    defaultX: 50,
    defaultY: 46,
    defaultWidth: 34,
    defaultHeight: 42,
    description: 'Ukuran standar A4 pas di tengah dada hingga perut.',
    cost: 25000,
  },
  {
    id: 'front-a3',
    name: 'A3 Oversize Depan',
    dimensions: '30 x 42 cm',
    view: 'front',
    defaultX: 50,
    defaultY: 50,
    defaultWidth: 44,
    defaultHeight: 56,
    description: 'Ukuran besar A3 menutup sebagian besar area depan.',
    cost: 38000,
  },

  // Back Presets
  {
    id: 'back-neck',
    name: 'Logo Bawah Kerah',
    dimensions: '8 x 8 cm',
    view: 'back',
    defaultX: 50,
    defaultY: 22,
    defaultWidth: 14,
    defaultHeight: 14,
    description: 'Logo kecil minimalis tepat di bawah tengkuk kerah belakang.',
    cost: 10000,
  },
  {
    id: 'back-a4',
    name: 'A4 Center Belakang',
    dimensions: '21 x 30 cm',
    view: 'back',
    defaultX: 50,
    defaultY: 46,
    defaultWidth: 34,
    defaultHeight: 42,
    description: 'Cetak A4 proporsional di punggung tengah.',
    cost: 25000,
  },
  {
    id: 'back-a3',
    name: 'A3 Full Punggung Belakang',
    dimensions: '30 x 42 cm',
    view: 'back',
    defaultX: 50,
    defaultY: 50,
    defaultWidth: 44,
    defaultHeight: 56,
    description: 'Area cetak maksimal A3 dari punggung atas hingga bawah.',
    cost: 38000,
  },

  // Sleeves Presets
  {
    id: 'sleeve-patch',
    name: 'Patch / Logo Lengan',
    dimensions: '8 x 8 cm',
    view: 'sleeve-left',
    defaultX: 54,
    defaultY: 27,
    defaultWidth: 16,
    defaultHeight: 16,
    description: 'Logo badge atau emblem tepat di tengah lengan luar.',
    cost: 12000,
  },
  {
    id: 'sleeve-vertical',
    name: 'Grafis Vertikal Lengan',
    dimensions: '7 x 25 cm',
    view: 'sleeve-left',
    defaultX: 54,
    defaultY: 30,
    defaultWidth: 15,
    defaultHeight: 24,
    description: 'Teks vertikal atau grafis striping memanjang pada lengan.',
    cost: 25000,
  },
];

export const SAMPLE_ARTWORKS = [
  {
    id: 'sample-1',
    name: 'Cyberpunk Emblem',
    category: 'Streetwear',
    svg: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#ec4899"/>
          <stop offset="100%" stop-color="#3b82f6"/>
        </linearGradient>
      </defs>
      <circle cx="100" cy="100" r="88" fill="none" stroke="url(#g1)" stroke-width="6" stroke-dasharray="8 6"/>
      <polygon points="100,25 175,150 25,150" fill="none" stroke="#f43f5e" stroke-width="5"/>
      <text x="100" y="110" font-family="Impact, sans-serif" font-size="28" fill="#ffffff" text-anchor="middle" letter-spacing="4">TOKYO</text>
      <text x="100" y="132" font-family="sans-serif" font-size="12" font-weight="900" fill="#38bdf8" text-anchor="middle" letter-spacing="6">CYBER2099</text>
    </svg>`,
  },
  {
    id: 'sample-2',
    name: 'Mountain Expedition',
    category: 'Outdoor',
    svg: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <circle cx="100" cy="100" r="90" fill="#f8fafc" stroke="#1e293b" stroke-width="5"/>
      <path d="M40 140 L85 70 L115 110 L135 85 L165 140 Z" fill="#0f172a"/>
      <path d="M85 70 L100 95 L90 100 L80 90 Z" fill="#ffffff"/>
      <path d="M135 85 L145 105 L138 110 L130 100 Z" fill="#ffffff"/>
      <circle cx="140" cy="55" r="14" fill="#f59e0b"/>
      <text x="100" y="170" font-family="Georgia, serif" font-weight="bold" font-size="13" fill="#0f172a" text-anchor="middle" letter-spacing="3">WILDERNESS CLUB</text>
    </svg>`,
  },
  {
    id: 'sample-3',
    name: 'Minimalist Typography',
    category: 'Minimal',
    svg: `<svg viewBox="0 0 200 80" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="80" rx="8" fill="#0f172a" />
      <text x="100" y="48" font-family="'Helvetica Neue', Arial, sans-serif" font-weight="900" font-size="28" fill="#ffffff" text-anchor="middle" letter-spacing="5">AUTHENTIC</text>
      <text x="100" y="66" font-family="sans-serif" font-size="9" fill="#94a3b8" text-anchor="middle" letter-spacing="4">ORIGINAL APPAREL</text>
    </svg>`,
  },
];
