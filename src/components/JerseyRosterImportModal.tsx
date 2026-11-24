import React, { useState } from 'react';
import type { JerseyRosterItem, ShirtSize } from '../types';
import { X, FileSpreadsheet, Check, AlertCircle, Download, FileText, Sparkles } from 'lucide-react';

interface JerseyRosterImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyRoster: (roster: JerseyRosterItem[], mode: 'replace' | 'append') => void;
  existingCount?: number;
}

const VALID_SIZES: ShirtSize[] = ['S', 'M', 'L', 'XL', 'XXL', '3XL'];

// Helper to normalize size strings like '2XL' -> 'XXL'
const normalizeSize = (raw: string): ShirtSize => {
  const clean = raw.trim().toUpperCase();
  if (clean === '2XL') return 'XXL';
  if (clean === 'XXXL' || clean === '4XL') return '3XL';
  if (VALID_SIZES.includes(clean as ShirtSize)) {
    return clean as ShirtSize;
  }
  return 'L'; // default fallback
};

export const JerseyRosterImportModal: React.FC<JerseyRosterImportModalProps> = ({
  isOpen,
  onClose,
  onApplyRoster,
  existingCount = 0,
}) => {
  const [inputText, setInputText] = useState('');
  const [importMode, setImportMode] = useState<'replace' | 'append'>('replace');

  if (!isOpen) return null;

  // Smart parser for multiple formats:
  // 1. Tab-separated (copy-paste from Excel / Google Sheets)
  // 2. Dash-separated: "BUDI - 10 - L" or "BUDI - 10"
  // 3. Comma-separated (CSV): "BUDI, 10, L"
  // 4. Dot/colon numbered format: "10. BUDI (L)"
  const parseLines = (text: string): JerseyRosterItem[] => {
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
    const parsed: JerseyRosterItem[] = [];

    lines.forEach((line, idx) => {
      let name = '';
      let number = '';
      let size: ShirtSize = 'L';

      // Check format 1: Tab-separated (Excel / Google Sheets)
      if (line.includes('\t')) {
        const parts = line.split('\t').map((p) => p.trim());
        name = parts[0] || '';
        number = parts[1] || '';
        size = normalizeSize(parts[2] || 'L');
      }
      // Check format 2: Comma-separated (CSV)
      else if (line.includes(',')) {
        const parts = line.split(',').map((p) => p.trim());
        name = parts[0] || '';
        number = parts[1] || '';
        size = normalizeSize(parts[2] || 'L');
      }
      // Check format 3: Dash-separated (e.g. "BUDI - 10 - L")
      else if (line.includes('-')) {
        const parts = line.split('-').map((p) => p.trim());
        name = parts[0] || '';
        number = parts[1] || '';
        size = normalizeSize(parts[2] || 'L');
      }
      // Check format 4: Space separated with potential number/parentheses
      else {
        // Match pattern like "10 BUDI L" or "BUDI 10 L"
        const tokens = line.split(/\s+/);
        if (tokens.length >= 3) {
          // If first token is digits (e.g. "10 BUDI L")
          if (/^\d+$/.test(tokens[0])) {
            number = tokens[0];
            size = normalizeSize(tokens[tokens.length - 1]);
            name = tokens.slice(1, -1).join(' ');
          } else {
            // E.g. "BUDI 10 L"
            const numIdx = tokens.findIndex((t) => /^\d+$/.test(t));
            if (numIdx > 0) {
              name = tokens.slice(0, numIdx).join(' ');
              number = tokens[numIdx];
              size = normalizeSize(tokens.slice(numIdx + 1).join(' '));
            } else {
              name = tokens.slice(0, -1).join(' ');
              size = normalizeSize(tokens[tokens.length - 1]);
              number = String(idx + 1);
            }
          }
        } else if (tokens.length === 2) {
          if (/^\d+$/.test(tokens[0])) {
            number = tokens[0];
            name = tokens[1];
          } else if (/^\d+$/.test(tokens[1])) {
            name = tokens[0];
            number = tokens[1];
          } else {
            name = tokens.join(' ');
            number = String(idx + 1);
          }
        } else {
          name = line;
          number = String(idx + 1);
        }
      }

      // Cleanup
      name = name.replace(/^[\d\.\-\)]+\s*/, '').trim().toUpperCase();
      number = number.replace(/\D/g, '').substring(0, 3) || String(idx + 1);

      if (name.length > 0) {
        parsed.push({
          id: `r-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
          name,
          number,
          size,
        });
      }
    });

    return parsed;
  };

  const previewList = parseLines(inputText);

  const handleApply = () => {
    if (previewList.length === 0) return;
    onApplyRoster(previewList, importMode);
    onClose();
  };

  const handleInsertSample = (type: 'excel' | 'text') => {
    if (type === 'excel') {
      setInputText(
        `PERALTA\t10\tL\nNEYMAR\t11\tM\nMBAPPE\t7\tXL\nRONALDO\t7\tL\nMESSI\t10\tM\nMODRIC\t10\tL\nBELLINGHAM\t5\tXL\nCOURTOIS\t1\tXXL\nVALVERDE\t8\tL\nVINICIUS\t7\tM\nRODRYGO\t11\tM\nKROOS\t8\tL`
      );
    } else {
      setInputText(
        `PERALTA - 10 - L\nNEYMAR - 11 - M\nMBAPPE - 7 - XL\nRONALDO - 7 - L\nMESSI - 10 - M\nMODRIC - 10 - L\nBELLINGHAM - 5 - XL\nCOURTOIS - 1 - XXL\nVALVERDE - 8 - L\nVINICIUS - 7 - M\nRODRYGO - 11 - M\nKROOS - 8 - L`
      );
    }
  };

  const handleDownloadTemplate = () => {
    const csvContent =
      'Nama Pemain,Nomor Punggung,Ukuran\nPERALTA,10,L\nNEYMAR,11,M\nMBAPPE,7,XL\nRONALDO,7,L\nMESSI,10,M\nCOURTOIS,1,XXL';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Template_Roster_Jersey_CustomApparel.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center shadow-xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Quick Import Roster Pemain Tim
              </h3>
              <p className="text-xs text-slate-500">
                Salin & tempel daftar nama, nomor, dan ukuran langsung dari Excel atau teks
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Action helpers */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium">Contoh Format:</span>
              <button
                type="button"
                onClick={() => handleInsertSample('excel')}
                className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-bold hover:bg-emerald-100 transition cursor-pointer flex items-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Salin dari Excel</span>
              </button>
              <button
                type="button"
                onClick={() => handleInsertSample('text')}
                className="px-2.5 py-1 rounded-lg bg-sky-50 text-sky-700 font-bold hover:bg-sky-100 transition cursor-pointer flex items-center gap-1"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Format Teks (Strip)</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="text-slate-600 hover:text-sky-700 font-medium flex items-center gap-1 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Template CSV</span>
            </button>
          </div>

          {/* Text Area */}
          <div>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              rows={6}
              placeholder={`Contoh salin langsung kolom Excel:\nPERALTA\t10\tL\nNEYMAR\t11\tM\n\nAtau ketik format strip:\nPERALTA - 10 - L\nNEYMAR - 11 - M`}
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-xs font-mono focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition outline-hidden resize-none bg-slate-50/50"
            />
          </div>

          {/* Preview Parsed Results */}
          {previewList.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                <span className="flex items-center gap-1.5 text-emerald-700">
                  <Check className="w-4 h-4" />
                  <span>
                    Terdeteksi {previewList.length} Pemain Siap Import:
                  </span>
                </span>
                <span className="text-slate-400 font-normal">
                  Ukuran: {Array.from(new Set(previewList.map((p) => p.size))).join(', ')}
                </span>
              </div>

              <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-2xl bg-white shadow-2xs divide-y divide-slate-100">
                {previewList.map((player, idx) => (
                  <div
                    key={idx}
                    className="px-4 py-2 flex items-center justify-between text-xs text-slate-700 hover:bg-slate-50 transition"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-slate-400 text-[10px] w-5">
                        #{idx + 1}
                      </span>
                      <span className="font-bold uppercase tracking-wider text-slate-900">
                        {player.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 font-mono font-bold text-slate-800 text-[11px]">
                        No. {player.number}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-sky-100 font-bold text-sky-800 text-[11px]">
                        {player.size}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Import Mode Radio (if already has items) */}
          {existingCount > 0 && (
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700">
                Roster saat ini ada {existingCount} pemain.
              </span>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
                  <input
                    type="radio"
                    name="importMode"
                    checked={importMode === 'replace'}
                    onChange={() => setImportMode('replace')}
                    className="text-sky-600 focus:ring-sky-500"
                  />
                  <span>Gantikan Semua</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
                  <input
                    type="radio"
                    name="importMode"
                    checked={importMode === 'append'}
                    onChange={() => setImportMode('append')}
                    className="text-sky-600 focus:ring-sky-500"
                  />
                  <span>Tambahkan</span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="text-xs text-slate-500 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
            <span>Ukuran otomatis menghitung total quantity & diskon tim</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={previewList.length === 0}
              onClick={handleApply}
              className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white text-xs font-bold transition shadow-md shadow-sky-600/20 cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Terapkan {previewList.length > 0 ? `(${previewList.length} Pemain)` : ''}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

