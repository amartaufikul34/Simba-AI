import React, { useState } from 'react';
import { 
  BarChart3, 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  Wrench, 
  Sparkles, 
  TrendingUp, 
  ShieldCheck, 
  Info,
  Calendar,
  Layers,
  FileSpreadsheet,
  Settings,
  Edit,
  Sliders,
  Check
} from 'lucide-react';
import { BmnItem, ItemCondition, UserProfile } from '../types/simba';
import { storageService } from '../services/storageService';

interface AnalyticsConditionChartProps {
  items: BmnItem[];
  currentUser?: UserProfile | null;
}

export const AnalyticsConditionChart: React.FC<AnalyticsConditionChartProps> = ({ 
  items,
  currentUser 
}) => {
  const [filterCategory, setFilterCategory] = useState<string>('SEMUA');
  const [sortBy, setSortBy] = useState<'frequency' | 'health'>('frequency');

  // Admin edit condition modal state
  const [editingItem, setEditingItem] = useState<BmnItem | null>(null);
  const [editCondition, setEditCondition] = useState<ItemCondition>('Baik');
  const [editHealth, setEditHealth] = useState<number>(90);
  const [editNotes, setEditNotes] = useState<string>('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Filter items
  const filteredItems = items.filter((item) => {
    if (filterCategory === 'SEMUA') return true;
    return item.category === filterCategory;
  });

  // Calculate total borrow instances across filtered items
  const totalBorrows = filteredItems.reduce((acc, curr) => acc + (curr.totalBorrowCount || 1), 0);

  // Distribution of conditions strictly as set by Ketua Tim / Admin BMN
  const conditionCounts = {
    baik: items.filter((i) => i.condition === 'Baik').length,
    perluPerawatan: items.filter((i) => i.condition === 'Perlu Perawatan').length,
    rusakRingan: items.filter((i) => i.condition === 'Rusak Ringan').length,
    rusakBerat: items.filter((i) => i.condition === 'Rusak Berat').length,
  };

  const totalItemCount = items.length || 1;
  const pctBaik = ((conditionCounts.baik / totalItemCount) * 100).toFixed(1);
  const pctPerluPerawatan = ((conditionCounts.perluPerawatan / totalItemCount) * 100).toFixed(1);
  const pctRusakRingan = ((conditionCounts.rusakRingan / totalItemCount) * 100).toFixed(1);
  const pctRusakBerat = ((conditionCounts.rusakBerat / totalItemCount) * 100).toFixed(1);

  // Sort items
  const sortedItems = [...filteredItems].sort((a, b) => {
    if (sortBy === 'frequency') {
      return (b.totalBorrowCount || 0) - (a.totalBorrowCount || 0);
    } else {
      return (a.healthPercentage || 90) - (b.healthPercentage || 90);
    }
  });

  // Determine condition advisory strictly adhering to conditions set by Ketua Tim / Admin BMN
  const getConditionAdvisory = (item: BmnItem) => {
    const health = item.healthPercentage || 90;

    // Follow condition set by Ketua Tim / Admin BMN
    if (item.status === 'DALAM_PERAWATAN' || item.condition === 'Rusak Berat' || health < 60) {
      return {
        status: 'TIDAK_LAYAK',
        badge: 'Tidak Layak Pakai (Wajib Servis)',
        color: 'rose',
        bg: 'bg-rose-50 text-rose-800 border-rose-200',
        recommendation: `Kondisi fisik aset ditetapkan "${item.condition}" oleh Ketua Tim/Admin BMN. Unit wajib melalui proses servis/perawatan di bengkel resmi BLSDM Komdigi Jakarta sebelum diizinkan untuk dipinjamkan kembali.`,
      };
    }

    if (item.condition === 'Perlu Perawatan' || item.condition === 'Rusak Ringan' || health < 80) {
      return {
        status: 'LAYAK_BERSYARAT',
        badge: 'Layak Pakai dengan Catatan',
        color: 'amber',
        bg: 'bg-amber-50 text-amber-800 border-amber-200',
        recommendation: `Kondisi fisik aset ditetapkan "${item.condition}" oleh Ketua Tim/Admin BMN. Masih layak digunakan untuk agenda reguler, namun disarankan pembersihan optik/sensor dan pengawasan berkala.`,
      };
    }

    return {
      status: 'LAYAK_PRIMA',
      badge: 'Sangat Layak Pakai (Kondisi Prima)',
      color: 'emerald',
      bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      recommendation: `Kondisi fisik aset ditetapkan "${item.condition}" (Prima) oleh Ketua Tim/Admin BMN. Sangat direkomendasikan untuk peliputan VVIP, rekaman modul e-learning, maupun bootcamp talenta digital.`,
    };
  };

  const handleOpenEditCondition = (item: BmnItem) => {
    setEditingItem(item);
    setEditCondition(item.condition);
    setEditHealth(item.healthPercentage || 90);
    setEditNotes(`Penyesuaian berkala oleh Ketua Tim BMN BLSDM Komdigi Jakarta.`);
  };

  const handleSaveCondition = () => {
    if (!editingItem) return;

    storageService.updateItemCondition(
      editingItem.id,
      editCondition,
      editHealth,
      editNotes,
      currentUser || undefined
    );

    setToastMsg(`Kondisi ${editingItem.name} berhasil diperbarui menjadi "${editCondition}" (${editHealth}%).`);
    setTimeout(() => setToastMsg(null), 4000);
    setEditingItem(null);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed top-18 right-4 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-xs border border-emerald-500 animate-in slide-in-from-top duration-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="font-semibold">{toastMsg}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 rounded-2xl p-6 text-white border border-slate-800 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold mb-2 border border-blue-400/30">
              <BarChart3 className="w-3.5 h-3.5 text-blue-300" />
              Statistik Pemakaian & Analisis Kelayakan Aset
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
              Diagram Frekuensi Peminjaman & Rekomendasi Kelayakan BMN
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Visualisasi persentase (%) intensitas peminjaman dan tingkat kelayakan fisik barang BMN yang <strong className="text-blue-300">mengikuti kondisi resmi yang telah ditetapkan oleh Ketua Tim / Admin BMN</strong> di BLSDM Komdigi Jakarta.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-slate-800/80 border border-slate-700 p-3 rounded-xl text-center min-w-[120px]">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Total Peminjaman</div>
              <div className="text-xl font-black text-white mt-0.5">{totalBorrows} Kali</div>
            </div>
            <div className="bg-slate-800/80 border border-slate-700 p-3 rounded-xl text-center min-w-[120px]">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Kondisi Baik (Prima)</div>
              <div className="text-xl font-black text-emerald-400 mt-0.5">{pctBaik}%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Breakdown Diagram Mengikuti Kondisi yang di-Set Ketua Tim / Admin BMN */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>Proporsi Kondisi Fisik Aset (Ditetapkan oleh Ketua Tim / Admin BMN)</span>
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Rekapitulasi seluruh {items.length} unit inventaris BMN BLSDM Komdigi Jakarta sesuai register resmi
            </p>
          </div>

          {currentUser?.role === 'ADMIN_BMN' && (
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
              <Settings className="w-3 h-3 text-rose-600" />
              <span>Admin BMN: Hak Ubah Kondisi Aktif</span>
            </span>
          )}
        </div>

        {/* Multi-segment condition proportion bar */}
        <div className="space-y-2">
          <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden flex shadow-inner">
            <div
              className="bg-emerald-500 h-full transition-all duration-500"
              style={{ width: `${pctBaik}%` }}
              title={`Kondisi Baik: ${pctBaik}%`}
            />
            <div
              className="bg-amber-400 h-full transition-all duration-500"
              style={{ width: `${pctPerluPerawatan}%` }}
              title={`Perlu Perawatan: ${pctPerluPerawatan}%`}
            />
            <div
              className="bg-orange-500 h-full transition-all duration-500"
              style={{ width: `${pctRusakRingan}%` }}
              title={`Rusak Ringan: ${pctRusakRingan}%`}
            />
            <div
              className="bg-rose-500 h-full transition-all duration-500"
              style={{ width: `${pctRusakBerat}%` }}
              title={`Rusak Berat: ${pctRusakBerat}%`}
            />
          </div>

          {/* Condition Legend with Percentages */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
            <div className="flex items-center gap-2 p-2 rounded-xl bg-emerald-50/60 border border-emerald-100">
              <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0"></span>
              <div>
                <span className="font-bold text-slate-800">Kondisi Baik:</span>
                <div className="text-[11px] text-emerald-700 font-bold">{conditionCounts.baik} Unit ({pctBaik}%)</div>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2 rounded-xl bg-amber-50/60 border border-amber-100">
              <span className="w-3 h-3 rounded-full bg-amber-400 shrink-0"></span>
              <div>
                <span className="font-bold text-slate-800">Perlu Perawatan:</span>
                <div className="text-[11px] text-amber-700 font-bold">{conditionCounts.perluPerawatan} Unit ({pctPerluPerawatan}%)</div>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2 rounded-xl bg-orange-50/60 border border-orange-100">
              <span className="w-3 h-3 rounded-full bg-orange-500 shrink-0"></span>
              <div>
                <span className="font-bold text-slate-800">Rusak Ringan:</span>
                <div className="text-[11px] text-orange-700 font-bold">{conditionCounts.rusakRingan} Unit ({pctRusakRingan}%)</div>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2 rounded-xl bg-rose-50/60 border border-rose-100">
              <span className="w-3 h-3 rounded-full bg-rose-500 shrink-0"></span>
              <div>
                <span className="font-bold text-slate-800">Rusak Berat:</span>
                <div className="text-[11px] text-rose-700 font-bold">{conditionCounts.rusakBerat} Unit ({pctRusakBerat}%)</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="font-semibold text-slate-600">Filter Kategori:</span>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
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

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="font-semibold text-slate-600">Urutkan Berdasarkan:</span>
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setSortBy('frequency')}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                sortBy === 'frequency'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Paling Sering Dipinjam
            </button>
            <button
              onClick={() => setSortBy('health')}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                sortBy === 'health'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Kondisi Terendah Dulu
            </button>
          </div>
        </div>
      </div>

      {/* Main Visual Diagram & Cards Following Conditions Set by Ketua Tim */}
      <div className="space-y-4">
        {sortedItems.map((item, index) => {
          const borrowCount = item.totalBorrowCount || 0;
          const borrowPercentage = totalBorrows > 0 ? ((borrowCount / totalBorrows) * 100).toFixed(1) : '0';
          const health = item.healthPercentage || 90;
          const advisory = getConditionAdvisory(item);

          return (
            <div
              key={item.id}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition space-y-4 text-xs"
            >
              {/* Top Row: Item Header & Percentage Badges */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-800 font-bold flex items-center justify-center font-mono text-xs">
                    #{index + 1}
                  </div>
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
                  />
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">{item.name}</h3>
                    <p className="text-slate-500 text-[11px] font-medium">
                      {item.brandModel} • Kategori: <strong>{item.category}</strong>
                    </p>
                  </div>
                </div>

                {/* Percentage & Status Chips */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 font-bold flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
                    <span>{borrowPercentage}% Frekuensi</span>
                    <span className="text-blue-500 text-[10px]">({borrowCount}x)</span>
                  </div>

                  <span className={`px-3 py-1.5 rounded-xl border text-[11px] font-bold ${advisory.bg}`}>
                    {advisory.badge}
                  </span>

                  {/* Ketua Tim / Admin BMN Edit Button */}
                  {currentUser?.role === 'ADMIN_BMN' && (
                    <button
                      onClick={() => handleOpenEditCondition(item)}
                      className="px-2.5 py-1.5 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 font-bold flex items-center gap-1 transition"
                      title="Set/Ubah Kondisi Aset oleh Ketua Tim BMN"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Set Kondisi</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Progress Bars: Frequency vs Physical Health Following Admin Condition */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Visual Bar 1: Borrow Frequency Percentage */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="font-bold text-slate-700">Persentase Peminjaman:</span>
                    <span className="font-bold text-blue-600">{borrowPercentage}% ({borrowCount} Kali)</span>
                  </div>
                  <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(8, parseFloat(borrowPercentage) * 3))}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Akumulasi peminjaman untuk pelatihan, modul e-learning, & liputan BLSDM Komdigi Jakarta
                  </div>
                </div>

                {/* Visual Bar 2: Physical Condition & Wear Rate Set by Ketua Tim */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="font-bold text-slate-700">Kondisi Ditetapkan Ketua Tim BMN:</span>
                    <span className={`font-bold ${
                      item.condition === 'Baik' ? 'text-emerald-600' : item.condition === 'Perlu Perawatan' ? 'text-amber-600' : 'text-rose-600'
                    }`}>
                      {item.condition} ({health}% Sehat)
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        item.condition === 'Baik'
                          ? 'bg-emerald-500'
                          : item.condition === 'Perlu Perawatan'
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                      }`}
                      style={{ width: `${health}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-slate-400 flex justify-between">
                    <span>Status Aset: <strong>{item.status.replace('_', ' ')}</strong></span>
                    <span>Telah Dikonfirmasi Ketua Tim BMN</span>
                  </div>
                </div>
              </div>

              {/* Recommendation Box Following Admin Condition */}
              <div className={`p-3.5 rounded-xl border flex items-start gap-2.5 ${
                advisory.status === 'LAYAK_PRIMA'
                  ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                  : advisory.status === 'LAYAK_BERSYARAT'
                  ? 'bg-amber-50/60 border-amber-200 text-amber-900'
                  : 'bg-rose-50/60 border-rose-200 text-rose-900'
              }`}>
                {advisory.status === 'LAYAK_PRIMA' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : advisory.status === 'LAYAK_BERSYARAT' ? (
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                ) : (
                  <Wrench className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-bold text-xs">
                    Saran Kelayakan Pakai: {advisory.badge}
                  </div>
                  <p className="text-[11px] mt-0.5 leading-relaxed">
                    {advisory.recommendation}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* KETUA TIM / ADMIN BMN EDIT CONDITION MODAL */}
      {editingItem && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-slate-900 animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-rose-600" />
                <h3 className="font-extrabold text-sm text-slate-900">Set Kondisi Fisik & Kelayakan Aset</h3>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="text-xs space-y-3.5">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="font-bold text-slate-900">{editingItem.name}</div>
                <div className="text-[11px] text-slate-500">{editingItem.brandModel} • {editingItem.category}</div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                  Tentukan Kondisi Fisik Aset:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['Baik', 'Perlu Perawatan', 'Rusak Ringan', 'Rusak Berat'] as ItemCondition[]).map((cond) => (
                    <button
                      key={cond}
                      type="button"
                      onClick={() => {
                        setEditCondition(cond);
                        if (cond === 'Baik') setEditHealth(95);
                        else if (cond === 'Perlu Perawatan') setEditHealth(75);
                        else if (cond === 'Rusak Ringan') setEditHealth(60);
                        else setEditHealth(40);
                      }}
                      className={`py-2 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 transition ${
                        editCondition === cond
                          ? cond === 'Baik'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                            : cond === 'Perlu Perawatan'
                            ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                            : 'bg-rose-600 text-white border-rose-600 shadow-sm'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span>{cond}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[11px] font-bold text-slate-700">
                    Skor Kesehatan Fisik Aset:
                  </label>
                  <span className="font-bold text-indigo-600">{editHealth}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="100"
                  step="5"
                  value={editHealth}
                  onChange={(e) => setEditHealth(parseInt(e.target.value, 10))}
                  className="w-full accent-indigo-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Catatan Verifikasi Ketua Tim BMN:
                </label>
                <textarea
                  rows={2}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
              <button
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                onClick={handleSaveCondition}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-md shadow-blue-500/20"
              >
                Terapkan Kondisi ke Diagram
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
