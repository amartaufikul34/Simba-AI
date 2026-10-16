import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Wrench, 
  User, 
  ShieldAlert, 
  Search, 
  Sparkles, 
  ArrowRight,
  CalendarCheck
} from 'lucide-react';
import { BmnItem, LoanRequest } from '../types/simba';
import { storageService } from '../services/storageService';

interface ItemAvailabilityScheduleProps {
  items: BmnItem[];
  loans: LoanRequest[];
  onSelectItemForLoan?: (item: BmnItem) => void;
}

export const ItemAvailabilitySchedule: React.FC<ItemAvailabilityScheduleProps> = ({
  items,
  loans,
  onSelectItemForLoan,
}) => {
  const [filterCategory, setFilterCategory] = useState<string>('SEMUA');
  const [testItemId, setTestItemId] = useState<string>(items[0]?.id || '');
  const [testDate, setTestDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [testStartTime, setTestStartTime] = useState<string>('09:00');
  const [testEndTime, setTestEndTime] = useState<string>('16:00');
  const [conflictResult, setConflictResult] = useState<{ checked: boolean; hasConflict: boolean; details: string[] } | null>(null);

  const timelineDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return {
      dateStr: d.toISOString().split('T')[0],
      dayName: d.toLocaleDateString('id-ID', { weekday: 'short' }),
      dayNumber: d.getDate(),
      monthName: d.toLocaleDateString('id-ID', { month: 'short' }),
      isToday: i === 0,
    };
  });

  const filteredItems = items.filter((item) => {
    if (filterCategory === 'SEMUA') return true;
    return item.category === filterCategory;
  });

  const handleTestConflict = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testItemId) return;

    const res = storageService.checkConflict(
      [testItemId],
      testDate,
      testStartTime,
      testDate,
      testEndTime
    );

    setConflictResult({
      checked: true,
      hasConflict: res.hasConflict,
      details: res.conflictDetails,
    });
  };

  const getBookingsForItemOnDate = (itemId: string, dateStr: string) => {
    return loans.filter((loan) => {
      if (loan.status !== 'SEDANG_DIPINJAM' && loan.status !== 'MENUNGGU_PERSETUJUAN') return false;
      const hasItem = loan.items.some((i) => i.itemId === itemId);
      if (!hasItem) return false;
      return loan.startDate <= dateStr && loan.plannedEndDate >= dateStr;
    });
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header Info */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
            <CalendarCheck className="w-4 h-4" />
            Pemantauan Real-Time & Jadwal Pemakaian BMN
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Ketersediaan & Jadwal Penggunaan Barang BMN
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Pantau status barang yang sedang digunakan dalam kegiatan <strong className="text-blue-600">BLSDM Komdigi Jakarta</strong>, ketahui siapa peminjamnya,
            dan periksa deteksi bentrok jadwal secara otomatis sebelum mengajukan permohonan.
          </p>
        </div>

        {/* Category filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-600">Filter:</span>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
          >
            <option value="SEMUA">Semua Kategori</option>
            <option value="Kamera">Kamera</option>
            <option value="Lensa">Lensa</option>
            <option value="Audio & Mic">Audio & Mic</option>
            <option value="Lighting Studio">Lighting Studio</option>
            <option value="Gimbal & Drone">Gimbal & Drone</option>
            <option value="Workstation Editing">Workstation Editing</option>
            <option value="Streaming Kit">Streaming Kit</option>
          </select>
        </div>
      </div>

      {/* Real-time Conflict Checker Tool */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-2xl p-5 shadow-lg border border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-blue-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Validasi Otomatis: Pencegah Jadwal Bentrok (Conflict Detector)
            </h3>
          </div>
          <span className="text-[10px] text-blue-300 font-medium">BLSDM Komdigi Jakarta</span>
        </div>

        <form onSubmit={handleTestConflict} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          <div>
            <label className="block text-[11px] text-slate-300 mb-1 font-medium">Pilih Barang BMN:</label>
            <select
              value={testItemId}
              onChange={(e) => {
                setTestItemId(e.target.value);
                setConflictResult(null);
              }}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              {items.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name} ({i.category})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] text-slate-300 mb-1 font-medium">Tanggal Rencana:</label>
            <input
              type="date"
              value={testDate}
              onChange={(e) => {
                setTestDate(e.target.value);
                setConflictResult(null);
              }}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] text-slate-300 mb-1 font-medium">Jam Mulai:</label>
            <input
              type="time"
              value={testStartTime}
              onChange={(e) => {
                setTestStartTime(e.target.value);
                setConflictResult(null);
              }}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] text-slate-300 mb-1 font-medium">Rencana Jam Kembali:</label>
            <input
              type="time"
              value={testEndTime}
              onChange={(e) => {
                setTestEndTime(e.target.value);
                setConflictResult(null);
              }}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-3 rounded-lg shadow transition flex items-center justify-center gap-1.5"
            >
              <span>Uji Ketersediaan</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>

        {conflictResult && (
          <div className={`mt-3 p-3 rounded-xl text-xs border ${
            conflictResult.hasConflict
              ? 'bg-rose-950/70 border-rose-800 text-rose-200'
              : 'bg-emerald-950/70 border-emerald-800 text-emerald-200'
          }`}>
            <div className="font-bold flex items-center gap-2">
              {conflictResult.hasConflict ? (
                <>
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <span>JADWAL BENTROK TERDETEKSI: Pengajuan pada slot waktu ini akan otomatis DITOLAK sistem!</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>SLOT JADWAL TERSEDIA: Barang dapat dipinjam pada rentang waktu yang dipilih!</span>
                </>
              )}
            </div>
            {conflictResult.hasConflict && (
              <ul className="mt-1.5 list-disc list-inside text-[11px] space-y-0.5 text-rose-300">
                {conflictResult.details.map((d, idx) => (
                  <li key={idx}>{d}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Visual 7-Day Schedule Matrix */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-slate-500" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Matriks Jadwal Pemakaian 7 Hari Ke Depan
            </h3>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-emerald-500"></span>
              Tersedia
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-blue-500"></span>
              Dipinjam
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-amber-500"></span>
              Menunggu Approval
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-rose-400"></span>
              Perawatan
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-600">
                <th className="py-3 px-4 font-bold min-w-[240px] sticky left-0 bg-slate-100 z-10">
                  Barang BMN & PIC
                </th>
                {timelineDays.map((td) => (
                  <th
                    key={td.dateStr}
                    className={`py-2 px-3 text-center min-w-[110px] font-semibold border-l border-slate-200 ${
                      td.isToday ? 'bg-blue-50 text-blue-900 font-bold' : ''
                    }`}
                  >
                    <div>{td.dayName}</div>
                    <div className="text-sm font-bold text-slate-800">
                      {td.dayNumber} {td.monthName}
                    </div>
                    {td.isToday && (
                      <span className="inline-block mt-0.5 px-1.5 py-0.2 text-[9px] bg-blue-600 text-white rounded font-bold">
                        HARI INI
                      </span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4 sticky left-0 bg-white z-10 border-r border-slate-100 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0"
                      />
                      <div>
                        <div className="font-bold text-slate-900 text-xs line-clamp-1">{item.name}</div>
                        <div className="text-[10px] text-slate-500 font-medium flex items-center gap-1.5 mt-0.5">
                          <span>{item.brandModel}</span>
                          <span>•</span>
                          <span>{item.category}</span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {timelineDays.map((td) => {
                    const bookings = getBookingsForItemOnDate(item.id, td.dateStr);
                    const isUnderMaintenance = item.status === 'DALAM_PERAWATAN';

                    if (isUnderMaintenance) {
                      return (
                        <td key={td.dateStr} className="p-2 border-l border-slate-100 bg-rose-50/40 text-center">
                          <div className="p-1 rounded bg-rose-100 text-rose-800 text-[10px] font-semibold">
                            Perawatan BMN
                          </div>
                        </td>
                      );
                    }

                    if (bookings.length > 0) {
                      const b = bookings[0];
                      const isPending = b.status === 'MENUNGGU_PERSETUJUAN';
                      return (
                        <td
                          key={td.dateStr}
                          className={`p-2 border-l border-slate-100 ${
                            isPending ? 'bg-amber-50/40' : 'bg-blue-50/40'
                          }`}
                        >
                          <div
                            className={`p-1.5 rounded-lg text-[10px] leading-tight border ${
                              isPending
                                ? 'bg-amber-100 border-amber-300 text-amber-900'
                                : 'bg-blue-100 border-blue-300 text-blue-900'
                            }`}
                            title={`${b.purpose} (${b.borrowerName})`}
                          >
                            <div className="font-bold truncate">{b.borrowerName.split(',')[0]}</div>
                            <div className="text-[9px] text-slate-600 mt-0.5">
                              {b.startTime} - {b.plannedEndTime}
                            </div>
                            <div className="text-[9px] font-semibold mt-0.5 truncate text-slate-700">
                              {isPending ? '⏳ Menunggu ACC' : '📌 Digunakan'}
                            </div>
                          </div>
                        </td>
                      );
                    }

                    return (
                      <td key={td.dateStr} className="p-2 border-l border-slate-100 text-center">
                        <div className="p-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-medium">
                          Tersedia
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
