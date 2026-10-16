import React, { useState } from 'react';
import { 
  X, 
  Send, 
  Calendar, 
  Clock, 
  FileText, 
  AlertCircle, 
  CheckCircle2, 
  Building, 
  User, 
  Phone,
  Trash2,
  Sparkles,
  Layers
} from 'lucide-react';
import { BmnItem, LoanRequest, UserProfile } from '../types/simba';
import { storageService } from '../services/storageService';

interface LoanRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  selectedItems: BmnItem[];
  onRemoveItem: (id: string) => void;
  onSuccess: (loan: LoanRequest) => void;
}

export const LoanRequestModal: React.FC<LoanRequestModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  selectedItems,
  onRemoveItem,
  onSuccess,
}) => {
  const today = new Date().toISOString().split('T')[0];

  const [purposeCategory, setPurposeCategory] = useState<LoanRequest['purposeCategory']>(
    'Peliputan Pelatihan Digital'
  );
  const [purpose, setPurpose] = useState('');
  const [startDate, setStartDate] = useState(today);
  const [startTime, setStartTime] = useState('09:00');
  const [plannedEndDate, setPlannedEndDate] = useState(today);
  const [plannedEndTime, setPlannedEndTime] = useState('17:00');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (selectedItems.length === 0) {
      setErrorMsg('Pilih minimal satu barang BMN.');
      return;
    }

    if (!purpose.trim() || purpose.trim().length < 8) {
      setErrorMsg('Tuliskan rincian keperluan kegiatan BLSDM Komdigi Jakarta secara jelas.');
      return;
    }

    const startIso = `${startDate}T${startTime}:00`;
    const endIso = `${plannedEndDate}T${plannedEndTime}:00`;
    if (new Date(startIso) >= new Date(endIso)) {
      setErrorMsg('Waktu rencana pengembalian harus lebih lambat dari waktu mulai peminjaman.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = storageService.createLoan({
        borrower: currentUser,
        itemIds: selectedItems.map((i) => i.id),
        purpose,
        purposeCategory,
        startDate,
        startTime,
        plannedEndDate,
        plannedEndTime,
      });

      if (!res.success || !res.loan) {
        setErrorMsg(res.error || 'Gagal mengajukan peminjaman. Periksa kembali jadwal barang.');
        setIsSubmitting(false);
        return;
      }

      setIsSubmitting(false);
      onSuccess(res.loan);
      onClose();
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMsg(err.message || 'Terjadi kesalahan sistem.');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-200 my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/50 border border-blue-400/30 flex items-center justify-center font-bold">
              <Layers className="w-5 h-5 text-blue-200" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">
                Formulir Peminjaman BMN Terpadu
              </h2>
              <p className="text-[11px] text-blue-200">
                BLSDM Komdigi Jakarta • 1x Input Terpadu Tanpa Pencatatan Ganda
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-blue-200 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="leading-snug">{errorMsg}</div>
            </div>
          )}

          {/* Selected Items List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="font-bold text-slate-800 text-xs">
                Barang BMN yang Dipinjam ({selectedItems.length} Unit):
              </label>
              <span className="text-[10px] text-blue-600 font-semibold">
                Multi-Item Peminjaman Aktif
              </span>
            </div>

            {selectedItems.length === 0 ? (
              <div className="p-4 border-2 border-dashed border-slate-200 rounded-xl text-center text-slate-400">
                Belum ada barang yang dipilih. Silakan kembali ke katalog untuk memilih barang.
              </div>
            ) : (
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {selectedItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs hover:border-slate-300 transition"
                  >
                    <div className="flex items-center gap-2.5">
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-9 h-9 rounded-lg object-cover border border-slate-200 shrink-0"
                      />
                      <div>
                        <div className="font-bold text-slate-800">{item.name}</div>
                        <div className="text-[10px] text-slate-500">
                          {item.brandModel} • PIC: {item.picName}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemoveItem(item.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 transition"
                      title="Hapus barang"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Borrower Profile (No NIP) */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center gap-2 text-slate-700">
              <User className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Nama Peminjam</span>
                <span className="font-bold text-slate-900">{currentUser.name}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-slate-700">
              <Building className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Unit Kerja</span>
                <span className="font-medium text-slate-900">{currentUser.unit}</span>
              </div>
            </div>
          </div>

          {/* Purpose Category */}
          <div className="space-y-3">
            <div>
              <label className="block font-bold text-slate-800 mb-1">
                Kategori Keperluan BLSDM Komdigi Jakarta:
              </label>
              <select
                value={purposeCategory}
                onChange={(e) => setPurposeCategory(e.target.value as LoanRequest['purposeCategory'])}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              >
                <option value="Peliputan Pelatihan Digital">Peliputan Pelatihan Digital (DTS / FGA / DLA / GTA)</option>
                <option value="Produksi Modul E-Learning">Produksi Modul E-Learning (LMS BLSDM Komdigi Jakarta)</option>
                <option value="Dokumentasi Sertifikasi Kompetensi">Dokumentasi Uji Sertifikasi Kompetensi Talenta Digital</option>
                <option value="Webinar & Live Workshop">Webinar & Live Workshop Literasi Digital</option>
                <option value="Uji Lab & Bootcamp Talenta Digital">Uji Praktik Lab & Bootcamp Talenta Digital</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">
                Rincian Agenda / Keperluan Kedinasan:
              </label>
              <textarea
                rows={3}
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="Contoh: Peliputan pembukaan kelas pelatihan Fresh Graduate Academy (FGA) Batch 3 di Gedung BLSDM Komdigi Jakarta..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed"
              />
            </div>
          </div>

          {/* Date & Time Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3 bg-blue-50/40 rounded-xl border border-blue-100 space-y-2">
              <span className="font-bold text-blue-900 text-[11px] flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                Mulai Peminjaman:
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-500 block mb-0.5">Tanggal:</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block mb-0.5">Jam:</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="p-3 bg-indigo-50/40 rounded-xl border border-indigo-100 space-y-2">
              <span className="font-bold text-indigo-900 text-[11px] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-600" />
                Rencana Pengembalian:
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-500 block mb-0.5">Tanggal:</label>
                  <input
                    type="date"
                    value={plannedEndDate}
                    onChange={(e) => setPlannedEndDate(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block mb-0.5">Jam:</label>
                  <input
                    type="time"
                    value={plannedEndTime}
                    onChange={(e) => setPlannedEndTime(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* PIC notice */}
          <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 text-[11px] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
            <div>
              Pengajuan ini akan diteruskan langsung ke <strong>PIC BMN (Bambang Haryanto, S.Sos.)</strong>.
              PIC akan menerima notifikasi instan untuk persetujuan.
            </div>
          </div>

          {/* Footer buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || selectedItems.length === 0}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-slate-300 text-white font-bold shadow-md shadow-blue-500/20 flex items-center gap-2 transition"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'Memproses...' : 'Kirim Pengajuan Sekarang'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
