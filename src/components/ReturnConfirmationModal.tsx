import React, { useState } from 'react';
import { 
  X, 
  RotateCcw, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  ShieldCheck, 
  ClipboardCheck,
  Building
} from 'lucide-react';
import { LoanRequest, ItemCondition, UserProfile } from '../types/simba';
import { storageService } from '../services/storageService';

interface ReturnConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  loan: LoanRequest | null;
  currentUser: UserProfile;
  onSuccess: () => void;
}

export const ReturnConfirmationModal: React.FC<ReturnConfirmationModalProps> = ({
  isOpen,
  onClose,
  loan,
  currentUser,
  onSuccess,
}) => {
  const [condition, setCondition] = useState<ItemCondition>('Baik');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !loan) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const ok = storageService.confirmReturn(loan.id, condition, notes, currentUser);
    setIsSubmitting(false);

    if (ok) {
      onSuccess();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 my-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-900 to-slate-900 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/50 border border-indigo-400/30 flex items-center justify-center">
              <ClipboardCheck className="w-5 h-5 text-indigo-200" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">
                Inspeksi Kondisi Fisik & Pengembalian BMN (FR-07)
              </h2>
              <p className="text-[11px] text-indigo-200">
                BLSDM Komdigi Jakarta • Verifikasi Kelayakan Aset Negara
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-indigo-200 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Ticket Information */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-slate-800 text-sm">{loan.ticketNumber}</span>
              <span className="text-[11px] text-slate-500 font-medium">Peminjam: {loan.borrowerName}</span>
            </div>
            <div className="text-[11px] text-slate-600">
              Kegiatan SDM Digital: <em>{loan.purpose}</em>
            </div>
          </div>

          {/* Items Being Returned */}
          <div>
            <label className="font-bold text-slate-800 block mb-1.5">
              Barang yang Dikembalikan ({loan.items.length} Item):
            </label>
            <div className="space-y-1.5">
              {loan.items.map((i) => (
                <div
                  key={i.itemId}
                  className="p-2 rounded-lg bg-indigo-50/50 border border-indigo-100 flex items-center justify-between"
                >
                  <span className="font-semibold text-slate-800">{i.itemName}</span>
                  <span className="text-[10px] text-slate-500 font-medium">{i.category}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Condition Assessment (FR-07: Baik, Rusak, Catatan) */}
          <div className="space-y-2">
            <label className="font-bold text-slate-800 block">
              Hasil Inspeksi Kondisi Fisik (Wajib):
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { val: 'Baik', label: 'Baik & Lengkap', desc: 'Fisik utuh, optik bersih, siap pakai langsung', color: 'emerald' },
                { val: 'Perlu Perawatan', label: 'Perlu Perawatan', desc: 'Pembersihan sensor/debu, kalibrasi ringan', color: 'blue' },
                { val: 'Rusak Ringan', label: 'Rusak Ringan', desc: 'Baret fisik minor, aksesoris kecil kurang', color: 'amber' },
                { val: 'Rusak Berat', label: 'Rusak Berat', desc: 'Kerusakan fungsi utama / perlu service BMN', color: 'rose' },
              ].map((opt) => (
                <label
                  key={opt.val}
                  className={`p-3 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                    condition === opt.val
                      ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-800">{opt.label}</span>
                    <input
                      type="radio"
                      name="condition"
                      value={opt.val}
                      checked={condition === opt.val}
                      onChange={() => setCondition(opt.val as ItemCondition)}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                  </div>
                  <span className="text-[10px] text-slate-500">{opt.desc}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Condition Notes */}
          <div>
            <label className="block font-bold text-slate-800 mb-1">
              Catatan Inspeksi Fisik BMN:
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Seluruh kabel, baterai cadangan, dan strap kamera lengkap. Lensa bersih dan fungsi AF bekerja optimal..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {/* Notice */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-[11px] flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>
              Setelah konfirmasi, status barang akan otomatis kembali ke <strong>"Tersedia"</strong> (atau "Dalam Perawatan" bila rusak) dan tercatat permanen di riwayat audit BMN.
            </span>
          </div>

          {/* Buttons */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-md shadow-indigo-600/20 flex items-center gap-2 transition"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{isSubmitting ? 'Menyimpan...' : 'Konfirmasi Pengembalian'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
