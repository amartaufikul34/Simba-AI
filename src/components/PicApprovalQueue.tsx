import React, { useState } from 'react';
import { 
  ClipboardCheck, 
  Check, 
  X, 
  Clock, 
  AlertTriangle, 
  User, 
  Calendar, 
  ShieldCheck, 
  RotateCcw, 
  Search, 
  FileText,
  Phone,
  Building,
  CheckCircle2,
  Info,
  Bell,
  Send,
  MessageSquare,
  Lock
} from 'lucide-react';
import { LoanRequest, UserProfile } from '../types/simba';
import { storageService } from '../services/storageService';

interface PicApprovalQueueProps {
  loans: LoanRequest[];
  currentUser: UserProfile;
  onOpenReturnInspection: (loan: LoanRequest) => void;
  onRequestReturn?: (loan: LoanRequest) => void;
}

export const PicApprovalQueue: React.FC<PicApprovalQueueProps> = ({
  loans,
  currentUser,
  onOpenReturnInspection,
  onRequestReturn,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'pending' | 'active_loans'>('pending');
  const [approvalNotes, setApprovalNotes] = useState<{ [loanId: string]: string }>({});
  const [rejectModalLoan, setRejectModalLoan] = useState<LoanRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Reminder feature state
  const [reminderModalLoan, setReminderModalLoan] = useState<LoanRequest | null>(null);
  const [customReminderMsg, setCustomReminderMsg] = useState('');

  const isPicOrAdmin = currentUser.role === 'PIC_BMN' || currentUser.role === 'ADMIN_BMN';

  const pendingLoans = loans.filter((l) => l.status === 'MENUNGGU_PERSETUJUAN');
  const activeLoans = loans.filter(
    (l) => l.status === 'SEDANG_DIPINJAM' || l.status === 'MENUNGGU_PENGEMBALIAN'
  );

  const handleApprove = (loan: LoanRequest) => {
    if (!isPicOrAdmin) {
      alert('Hanya PIC BMN atau Ketua Tim BMN yang berwenang menyetujui peminjaman.');
      return;
    }
    const notes = approvalNotes[loan.id] || 'Disetujui untuk kegiatan kedinasan BLSDM Komdigi Jakarta.';
    const ok = storageService.approveLoan(loan.id, notes, currentUser);
    if (ok) {
      setActionSuccessMsg(`Pengajuan ${loan.ticketNumber} berhasil disetujui! Status barang otomatis diperbarui.`);
      setTimeout(() => setActionSuccessMsg(null), 4000);
    }
  };

  const handleRejectConfirm = () => {
    if (!isPicOrAdmin) {
      alert('Hanya PIC BMN atau Ketua Tim BMN yang berwenang menolak peminjaman.');
      return;
    }
    if (!rejectModalLoan) return;
    if (!rejectReason.trim()) {
      alert('Tuliskan alasan penolakan secara jelas.');
      return;
    }

    const ok = storageService.rejectLoan(rejectModalLoan.id, rejectReason, currentUser);
    if (ok) {
      setActionSuccessMsg(`Pengajuan ${rejectModalLoan.ticketNumber} telah ditolak. Peminjam telah dinotifikasi.`);
      setRejectModalLoan(null);
      setRejectReason('');
      setTimeout(() => setActionSuccessMsg(null), 4000);
    }
  };

  const handleOpenReminderModal = (loan: LoanRequest) => {
    if (!isPicOrAdmin) {
      alert('Hanya PIC BMN yang berwenang mengirimkan pengingat batas waktu pengembalian.');
      return;
    }
    setReminderModalLoan(loan);
    const itemNames = loan.items.map((i) => i.itemName).join(', ');
    setCustomReminderMsg(
      `Halo ${loan.borrowerName}, pengingat bahwa peminjaman ${itemNames} (${loan.ticketNumber}) untuk kegiatan BLSDM Komdigi Jakarta dijadwalkan kembali pada ${loan.plannedEndDate} pukul ${loan.plannedEndTime} WIB ke Studio BMN. Mohon konfirmasi pengembalian tepat waktu.`
    );
  };

  const handleSendReminderConfirm = () => {
    if (!reminderModalLoan) return;

    const ok = storageService.sendReturnReminder(reminderModalLoan.id, customReminderMsg);
    if (ok) {
      setActionSuccessMsg(`Notifikasi pengingat pengembalian berhasil dikirimkan ke peminjam ${reminderModalLoan.borrowerName}!`);
      setReminderModalLoan(null);
      setCustomReminderMsg('');
      setTimeout(() => setActionSuccessMsg(null), 4000);
    }
  };

  const handleBorrowerReturnAction = (loan: LoanRequest) => {
    storageService.requestReturn(loan.id, currentUser);
    setActionSuccessMsg(`Permintaan pengembalian tiket ${loan.ticketNumber} telah dikirim ke PIC BMN untuk inspeksi fisik.`);
    setTimeout(() => setActionSuccessMsg(null), 4000);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">
            <ClipboardCheck className="w-4 h-4" />
            Portal Wewenang PIC Barang BMN BLSDM Komdigi Jakarta
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Antrean Persetujuan & Pengingat Pengembalian
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            PIC berwenang menyetujui permohonan pinjam, mengirimkan pengingat batas waktu pengembalian kepada peminjam,
            serta memverifikasi kondisi fisik barang saat pengembalian.
          </p>
        </div>

        {/* Sub-tab pills */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200 text-xs">
          <button
            onClick={() => setActiveSubTab('pending')}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition ${
              activeSubTab === 'pending'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Perlu Persetujuan</span>
            {pendingLoans.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white text-amber-600 font-extrabold">
                {pendingLoans.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('active_loans')}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition ${
              activeSubTab === 'active_loans'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Sedang Dipinjam & Pengingat</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-700 font-semibold">
              {activeLoans.length}
            </span>
          </button>
        </div>
      </div>

      {/* Role Notice Banner for Regular Employees (Peminjam) */}
      {!isPicOrAdmin && (
        <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-center gap-3">
          <Info className="w-5 h-5 text-blue-600 shrink-0" />
          <div className="leading-relaxed">
            <strong>Mode Pegawai / Peminjam ({currentUser.name}):</strong> Anda dapat memantau status verifikasi pengajuan peminjaman Anda secara langsung di bawah ini.
            Wewenang untuk melakukan <em>persetujuan (approval)</em>, penolakan, inspeksi fisik, dan pengiriman pengingat berada pada <strong>PIC BMN (Bambang Haryanto, S.Sos.)</strong> atau Ketua Tim BMN.
          </div>
        </div>
      )}

      {actionSuccessMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* SUB-TAB 1: PENDING APPROVALS */}
      {activeSubTab === 'pending' && (
        <div className="space-y-4">
          {pendingLoans.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-800">
                Semua Pengajuan Telah Ditinjau!
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Tidak ada pengajuan peminjaman baru yang menunggu persetujuan PIC saat ini.
              </p>
            </div>
          ) : (
            pendingLoans.map((loan) => (
              <div
                key={loan.id}
                className="bg-white rounded-2xl p-5 border border-amber-200 shadow-sm hover:shadow-md transition space-y-4"
              >
                {/* Header Ticket */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <span className="px-2.5 py-1 rounded-lg text-xs font-bold font-mono bg-amber-100 text-amber-800 border border-amber-200">
                      {loan.ticketNumber}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                      {loan.purposeCategory}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Diajukan pada: {loan.createdAt}</span>
                  </div>
                </div>

                {/* Borrower & Purpose in BLSDM Komdigi Jakarta */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <User className="w-4 h-4 text-slate-400" />
                      <span>{loan.borrowerName}</span>
                    </div>
                    <div className="text-slate-600 pl-5">Unit: {loan.borrowerUnit}</div>
                    <div className="text-slate-600 pl-5 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{loan.borrowerPhone}</span>
                    </div>
                  </div>

                  <div className="space-y-1.5 p-3 rounded-xl bg-blue-50/50 border border-blue-100">
                    <div className="font-bold text-blue-900 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-blue-500" />
                      <span>Jadwal Peminjaman:</span>
                    </div>
                    <div className="text-slate-700 font-medium pl-5">
                      Mulai: {loan.startDate} pukul {loan.startTime} WIB
                    </div>
                    <div className="text-slate-700 font-medium pl-5">
                      Rencana Kembali: {loan.plannedEndDate} pukul {loan.plannedEndTime} WIB
                    </div>
                  </div>
                </div>

                {/* Multi-Item List */}
                <div>
                  <span className="text-[11px] font-bold text-slate-700 block mb-1.5">
                    Daftar Barang BMN ({loan.items.length} Item):
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {loan.items.map((item) => (
                      <div
                        key={item.itemId}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-xs text-slate-800 font-medium flex items-center gap-1.5"
                      >
                        <span>{item.itemName}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Purpose text */}
                <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-700 leading-relaxed border border-slate-100">
                  <span className="font-bold text-slate-800">Keperluan BLSDM Komdigi Jakarta: </span>
                  {loan.purpose}
                </div>

                {/* Approval Notes Input & Buttons based on User Role */}
                <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                  {isPicOrAdmin ? (
                    <>
                      <input
                        type="text"
                        value={approvalNotes[loan.id] || ''}
                        onChange={(e) =>
                          setApprovalNotes({ ...approvalNotes, [loan.id]: e.target.value })
                        }
                        placeholder="Catatan persetujuan PIC (opsional)..."
                        className="w-full sm:flex-1 text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />

                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button
                          onClick={() => setRejectModalLoan(loan)}
                          className="flex-1 sm:flex-initial px-4 py-2 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Tolak</span>
                        </button>

                        <button
                          onClick={() => handleApprove(loan)}
                          className="flex-1 sm:flex-initial px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 transition"
                        >
                          <Check className="w-4 h-4" />
                          <span>Setujui Peminjaman (ACC)</span>
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="w-full flex items-center justify-between py-1 text-xs">
                      <div className="flex items-center gap-2 text-amber-700 font-medium">
                        <Clock className="w-4 h-4 text-amber-500" />
                        <span>Pengajuan Anda sedang menunggu keputusan dari PIC BMN ({loan.picName})</span>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        Menunggu ACC PIC
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* SUB-TAB 2: ACTIVE LOANS & RETURN REMINDER / RETURN CONFIRMATION */}
      {activeSubTab === 'active_loans' && (
        <div className="space-y-4">
          {activeLoans.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
              <Info className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-800">
                Tidak Ada Barang yang Sedang Dipinjam
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Semua aset BMN BLSDM Komdigi Jakarta berada di tempat penyimpanan masing-masing.
              </p>
            </div>
          ) : (
            activeLoans.map((loan) => {
              const isWaitingReturn = loan.status === 'MENUNGGU_PENGEMBALIAN';
              const isCurrentUserBorrower = loan.borrowerId === currentUser.id;

              return (
                <div
                  key={loan.id}
                  className={`bg-white rounded-2xl p-5 border shadow-sm transition space-y-3 ${
                    isWaitingReturn
                      ? 'border-indigo-300 ring-2 ring-indigo-500/10'
                      : 'border-slate-200'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-800">
                        {loan.ticketNumber}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isWaitingReturn
                            ? 'bg-indigo-100 text-indigo-800 animate-pulse'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {isWaitingReturn ? '🔔 Siap Diinspeksi Kembali' : '📌 Sedang Digunakan'}
                      </span>

                      {/* Reminder sent badge */}
                      {loan.reminderSentCount && loan.reminderSentCount > 0 ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                          <Bell className="w-3 h-3 text-amber-500" />
                          <span>Pengingat Terkirim ({loan.reminderSentCount}x)</span>
                        </span>
                      ) : null}
                    </div>

                    <div className="text-[11px] text-slate-500">
                      Rencana Kembali: <strong>{loan.plannedEndDate} pukul {loan.plannedEndTime} WIB</strong>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Peminjam:</span>
                      <span className="font-bold text-slate-800">{loan.borrowerName}</span>
                      <span className="text-slate-500 text-[11px] block">{loan.borrowerUnit}</span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[10px]">Barang BMN ({loan.items.length} Item):</span>
                      <span className="font-medium text-slate-700">
                        {loan.items.map((i) => i.itemName).join(', ')}
                      </span>
                    </div>
                  </div>

                  {loan.lastReminderSentAt && (
                    <div className="p-2.5 bg-amber-50/60 rounded-xl border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2">
                      <Bell className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold">Catatan Pengingat Terakhir ({loan.lastReminderSentAt}):</span>
                        <p className="text-amber-800 text-[10px] italic mt-0.5">"{loan.lastReminderMessage}"</p>
                      </div>
                    </div>
                  )}

                  {/* Action buttons based on Role */}
                  <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-end gap-2">
                    {/* PIC & Admin Remind & Inspect Actions */}
                    {isPicOrAdmin ? (
                      <>
                        <button
                          onClick={() => handleOpenReminderModal(loan)}
                          className="px-3.5 py-2 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold flex items-center gap-1.5 transition"
                          title="Kirimkan pemberitahuan pengingat batas waktu pengembalian ke peminjam"
                        >
                          <Bell className="w-3.5 h-3.5 text-amber-600" />
                          <span>Kirim Pengingat Pengembalian</span>
                        </button>

                        <button
                          onClick={() => onOpenReturnInspection(loan)}
                          className={`px-4 py-2 rounded-xl text-white text-xs font-bold flex items-center gap-1.5 transition shadow-sm ${
                            isWaitingReturn
                              ? 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30 ring-2 ring-indigo-400'
                              : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20'
                          }`}
                        >
                          <ShieldCheck className="w-4 h-4" />
                          <span>Verifikasi Kondisi & Terima Barang</span>
                        </button>
                      </>
                    ) : (
                      /* Borrower Return Request Action */
                      isCurrentUserBorrower && loan.status === 'SEDANG_DIPINJAM' && (
                        <button
                          onClick={() => handleBorrowerReturnAction(loan)}
                          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Ajukan Pengembalian Barang Saya</span>
                        </button>
                      )
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* REJECTION REASON MODAL */}
      {rejectModalLoan && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-slate-900 animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-sm text-slate-900">Tolak Permohonan Peminjaman</h3>
              <button
                onClick={() => setRejectModalLoan(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="text-xs space-y-3">
              <p className="text-slate-600">
                Tiket: <strong>{rejectModalLoan.ticketNumber}</strong> ({rejectModalLoan.borrowerName})
              </p>
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Alasan Penolakan Kedinasan:
                </label>
                <textarea
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Contoh: Barang dialokasikan untuk prioritas pelatihan sertifikasi digital talenta..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setRejectModalLoan(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                onClick={handleRejectConfirm}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition"
              >
                Konfirmasi Penolakan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM REMINDER MODAL */}
      {reminderModalLoan && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-amber-200 text-slate-900 animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-amber-100">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-500" />
                <h3 className="font-extrabold text-sm text-slate-900">Kirim Pengingat Pengembalian</h3>
              </div>
              <button
                onClick={() => setReminderModalLoan(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="text-xs space-y-3">
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900">
                <div>Peminjam: <strong>{reminderModalLoan.borrowerName}</strong></div>
                <div>Batas Pengembalian: <strong>{reminderModalLoan.plannedEndDate} pukul {reminderModalLoan.plannedEndTime} WIB</strong></div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Pesan Pengingat Resmi:
                </label>
                <textarea
                  rows={4}
                  value={customReminderMsg}
                  onChange={(e) => setCustomReminderMsg(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 leading-relaxed"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setReminderModalLoan(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                onClick={handleSendReminderConfirm}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-900 text-xs font-bold flex items-center gap-1.5 transition"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Kirimkan Pengingat</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
