import React, { useState, useEffect, useRef } from 'react';
import { Type, Sparkles } from 'lucide-react';

interface TextDesignGeneratorProps {
  onApplyDesign: (dataUrl: string, promptName: string) => void;
  activeView: string;
}

interface FontOption {
  id: string;
  name: string;
  fontFamily: string;
  category: string;
}

const FONT_OPTIONS: FontOption[] = [
  { id: 'impact', name: 'Varsity Bold (Sport)', fontFamily: 'Impact, "Arial Black", sans-serif', category: 'Athletic' },
  { id: 'sans', name: 'Modern Clean Sans', fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif', category: 'Modern' },
  { id: 'georgia', name: 'Vintage Serif', fontFamily: 'Georgia, "Times New Roman", serif', category: 'Classic' },
  { id: 'monospace', name: 'Industrial Tech', fontFamily: '"Courier New", Courier, monospace', category: 'Tech' },
  { id: 'cursive', name: 'Retro Script', fontFamily: '"Brush Script MT", "Segoe Script", cursive', category: 'Casual' },
];

const PRESET_COLORS = [
  { name: 'Putih', hex: '#FFFFFF' },
  { name: 'Hitam', hex: '#111827' },
  { name: 'Merah Terang', hex: '#EF4444' },
  { name: 'Kuning Kenari', hex: '#FACC15' },
  { name: 'Biru Royal', hex: '#2563EB' },
  { name: 'Emas / Gold', hex: '#D97706' },
  { name: 'Hijau Army', hex: '#15803D' },
  { name: 'Oranye Sunset', hex: '#F97316' },
];

export const TextDesignGenerator: React.FC<TextDesignGeneratorProps> = ({
  onApplyDesign,
  activeView,
}) => {
  const [text, setText] = useState('BANDUNG APPAREL');
  const [selectedFont, setSelectedFont] = useState(FONT_OPTIONS[0]);
  const [textColor, setTextColor] = useState('#FFFFFF');
  const [outlineColor, setOutlineColor] = useState('#111827');
  const [outlineWidth, setOutlineWidth] = useState(6);
  const [isCurved, setIsCurved] = useState(false);
  const [curveRadius, setCurveRadius] = useState(30); // -60 to 60
  const [letterSpacing, setLetterSpacing] = useState(2);
  const [isUppercase, setIsUppercase] = useState(true);
  const [hasShadow, setHasShadow] = useState(true);

  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  // Render text onto high-res canvas
  const renderCanvas = (targetCanvas: HTMLCanvasElement, exportMode = false) => {
    const ctx = targetCanvas.getContext('2d');
    if (!ctx) return;

    const width = exportMode ? 1500 : 600;
    const height = exportMode ? 900 : 360;
    targetCanvas.width = width;
    targetCanvas.height = height;

    ctx.clearRect(0, 0, width, height);

    // If in preview mode (not export), draw checkered background to show transparency
    if (!exportMode) {
      const squareSize = 16;
      for (let x = 0; x < width; x += squareSize) {
        for (let y = 0; y < height; y += squareSize) {
          ctx.fillStyle = (Math.floor(x / squareSize) + Math.floor(y / squareSize)) % 2 === 0 ? '#1e293b' : '#0f172a';
          ctx.fillRect(x, y, squareSize, squareSize);
        }
      }
    }

    const displayText = isUppercase ? text.toUpperCase() : text;
    if (!displayText.trim()) return;

    const scaleFactor = width / 600;
    const fontSize = Math.round(52 * scaleFactor);
    ctx.font = `900 ${fontSize}px ${selectedFont.fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const centerX = width / 2;
    const centerY = height / 2;

    // Render curved or flat text
    if (isCurved && curveRadius !== 0) {
      // Curved arch text calculation
      const radius = (height * 0.9 * (100 / Math.abs(curveRadius))) * 0.45;
      const angleStep = (fontSize * 0.7 + letterSpacing * scaleFactor) / radius;
      const totalAngle = (displayText.length - 1) * angleStep;
      let startAngle = -Math.PI / 2 - totalAngle / 2;

      if (curveRadius < 0) {
        startAngle = Math.PI / 2 - totalAngle / 2;
      }

      const centerArcY = curveRadius > 0 ? centerY + radius * 0.6 : centerY - radius * 0.6;

      for (let i = 0; i < displayText.length; i++) {
        const char = displayText[i];
        const angle = startAngle + i * angleStep;
        const charX = centerX + Math.cos(angle) * radius;
        const charY = centerArcY + Math.sin(angle) * radius * (curveRadius < 0 ? -1 : 1);

        ctx.save();
        ctx.translate(charX, charY);
        ctx.rotate(angle + Math.PI / 2 * (curveRadius < 0 ? -1 : 1));

        // Draw shadow
        if (hasShadow) {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
          ctx.fillText(char, 4 * scaleFactor, 6 * scaleFactor);
        }

        // Draw outline
        if (outlineWidth > 0) {
          ctx.strokeStyle = outlineColor;
          ctx.lineWidth = outlineWidth * scaleFactor * 2;
          ctx.lineJoin = 'round';
          ctx.strokeText(char, 0, 0);
        }

        // Draw core text
        ctx.fillStyle = textColor;
        ctx.fillText(char, 0, 0);

        ctx.restore();
      }
    } else {
      // Flat centered text with letter spacing
      ctx.save();
      ctx.translate(centerX, centerY);

      // Shadow
      if (hasShadow) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillText(displayText, 4 * scaleFactor, 6 * scaleFactor);
      }

      // Outline
      if (outlineWidth > 0) {
        ctx.strokeStyle = outlineColor;
        ctx.lineWidth = outlineWidth * scaleFactor * 2;
        ctx.lineJoin = 'round';
        ctx.strokeText(displayText, 0, 0);
      }

      // Core text
      ctx.fillStyle = textColor;
      ctx.fillText(displayText, 0, 0);

      ctx.restore();
    }
  };

  // Re-render preview canvas on state changes
  useEffect(() => {
    if (previewCanvasRef.current) {
      renderCanvas(previewCanvasRef.current, false);
    }
  }, [text, selectedFont, textColor, outlineColor, outlineWidth, isCurved, curveRadius, letterSpacing, isUppercase, hasShadow]);

  const handleApplyToShirt = () => {
    const offscreenCanvas = document.createElement('canvas');
    renderCanvas(offscreenCanvas, true);
    const dataUrl = offscreenCanvas.toDataURL('image/png');
    onApplyDesign(dataUrl, `Teks Sablon: ${text.slice(0, 18)}`);
  };

  return (
    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
      {/* Header Info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
          <Type className="w-4 h-4 text-sky-600" />
          <span>Buat Tulisan & Nama Langsung</span>
        </div>
        <span className="text-[10px] bg-sky-100 text-sky-700 font-bold px-2 py-0.5 rounded-full">
          HD Transparent PNG
        </span>
      </div>

      {/* Input Teks */}
      <div>
        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
          Ketik Tulisan / Slogan / Nama Komunitas:
        </label>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Contoh: BANDUNG APPAREL"
          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
          maxLength={30}
        />
        <div className="flex items-center justify-between mt-1 text-[10px] text-slate-400">
          <button
            type="button"
            onClick={() => setIsUppercase(!isUppercase)}
            className="text-sky-600 font-semibold hover:underline"
          >
            {isUppercase ? 'Ganti ke Huruf Normal' : 'Ganti ke SEMUA KAPITAL'}
          </button>
          <span>{text.length}/30 karakter</span>
        </div>
      </div>

      {/* Live Preview Box */}
      <div className="relative rounded-xl overflow-hidden border border-slate-700 shadow-inner bg-slate-900">
        <canvas
          ref={previewCanvasRef}
          className="w-full h-auto block"
          style={{ maxHeight: '140px' }}
        />
        <span className="absolute bottom-1 right-2 text-[9px] text-slate-400 bg-slate-900/80 px-1.5 py-0.5 rounded">
          Pratinjau Sablon Teks
        </span>
      </div>

      {/* Pilihan Font */}
      <div>
        <label className="block text-[11px] font-semibold text-slate-700 mb-1.5">
          Gaya Font (Tipografi):
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          {FONT_OPTIONS.map((f) => {
            const isSelected = selectedFont.id === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setSelectedFont(f)}
                className={`p-2 rounded-xl border text-left transition cursor-pointer ${
                  isSelected
                    ? 'border-sky-500 bg-sky-50/80 ring-1 ring-sky-500'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="text-[11px] font-bold text-slate-800 truncate" style={{ fontFamily: f.fontFamily }}>
                  {f.name}
                </div>
                <div className="text-[9px] text-slate-400">{f.category}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Warna Teks & Outline */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        {/* Warna Teks */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
            Warna Teks:
          </label>
          <div className="flex items-center gap-1.5">
            <input
              type="color"
              value={textColor}
              onChange={(e) => setTextColor(e.target.value)}
              className="w-8 h-8 rounded-lg border border-slate-200 cursor-pointer p-0"
            />
            <div className="flex flex-wrap gap-1">
              {PRESET_COLORS.slice(0, 4).map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => setTextColor(c.hex)}
                  className="w-5 h-5 rounded-md border border-slate-300 shadow-2xs"
                  style={{ backgroundColor: c.hex }}
                  title={c.name}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Warna Outline */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
            Warna Garis Tepi (Outline):
          </label>
          <div className="flex items-center gap-1.5">
            <input
              type="color"
              value={outlineColor}
              onChange={(e) => setOutlineColor(e.target.value)}
              className="w-8 h-8 rounded-lg border border-slate-200 cursor-pointer p-0"
            />
            <div className="flex flex-wrap gap-1">
              {PRESET_COLORS.slice(0, 4).map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => setOutlineColor(c.hex)}
                  className="w-5 h-5 rounded-md border border-slate-300 shadow-2xs"
                  style={{ backgroundColor: c.hex }}
                  title={c.name}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Ketebalan Outline & Efek Lengkung */}
      <div className="space-y-3 pt-1 border-t border-slate-200/80">
        {/* Ketebalan Outline Slider */}
        <div>
          <div className="flex justify-between text-[11px] mb-1">
            <span className="text-slate-600">Ketebalan Garis Tepi (Stroke):</span>
            <span className="font-mono text-slate-800 font-bold">{outlineWidth}px</span>
          </div>
          <input
            type="range"
            min="0"
            max="12"
            step="1"
            value={outlineWidth}
            onChange={(e) => setOutlineWidth(parseInt(e.target.value, 10))}
            className="w-full accent-sky-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
          />
        </div>

        {/* Toggle Lengkungan / Arch Text */}
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-700">
            Lengkungkan Teks (Vintage Arch):
          </span>
          <button
            type="button"
            onClick={() => setIsCurved(!isCurved)}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
              isCurved
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
            }`}
          >
            {isCurved ? 'Aktif ✓' : 'Mati'}
          </button>
        </div>

        {isCurved && (
          <div>
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-slate-600">Derajat Lengkungan:</span>
              <span className="font-mono text-slate-800 font-bold">{curveRadius > 0 ? `+${curveRadius}°` : `${curveRadius}°`}</span>
            </div>
            <input
              type="range"
              min="-50"
              max="50"
              step="5"
              value={curveRadius}
              onChange={(e) => setCurveRadius(parseInt(e.target.value, 10))}
              className="w-full accent-sky-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[9px] text-slate-400 mt-0.5">
              <span>Lengkung Bawah</span>
              <span>Lengkung Atas</span>
            </div>
          </div>
        )}

        {/* Jarak Antar Huruf (Kerning) */}
        <div>
          <div className="flex justify-between text-[11px] mb-1">
            <span className="text-slate-600">Jarak Spasi Antar Huruf:</span>
            <span className="font-mono text-slate-800 font-bold">{letterSpacing}px</span>
          </div>
          <input
            type="range"
            min="0"
            max="12"
            step="1"
            value={letterSpacing}
            onChange={(e) => setLetterSpacing(parseInt(e.target.value, 10))}
            className="w-full accent-sky-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
          />
        </div>

        {/* 3D Shadow toggle */}
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-slate-600">Bayangan 3D (Shadow):</span>
          <button
            type="button"
            onClick={() => setHasShadow(!hasShadow)}
            className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
              hasShadow ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'
            }`}
          >
            {hasShadow ? 'Ya' : 'Tidak'}
          </button>
        </div>
      </div>

      {/* Button Pasang ke Kaos */}
      <button
        type="button"
        onClick={handleApplyToShirt}
        className="w-full py-2.5 px-4 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-md flex items-center justify-center gap-2 transition cursor-pointer"
      >
        <Sparkles className="w-4 h-4 text-amber-300" />
        <span>Pasang Tulisan Ini ke Kaos ({activeView === 'front' ? 'Depan' : activeView === 'back' ? 'Belakang' : 'Lengan'})</span>
      </button>
    </div>
  );
};
