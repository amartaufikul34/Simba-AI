import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Wrench, 
  Plus, 
  Check, 
  Info, 
  MapPin, 
  User, 
  Phone, 
  Sparkles,
  ArrowRight,
  Layers,
  ChevronRight,
  Bot,
  Settings,
  ShieldCheck,
  Activity,
  Calendar,
  X
} from 'lucide-react';
import { BmnItem, ItemStatus, UserProfile } from '../types/simba';
import { storageService } from '../services/storageService';
import { evaluateItemWithAi } from '../services/aiService';

interface ItemCatalogProps {
  items: BmnItem[];
  currentUser: UserProfile;
  selectedItemIds: string[];
  onToggleSelectItem: (item: BmnItem) => void;
  onOpenLoanModal: () => void;
  onOpenAiAssistantWithItems?: (items: BmnItem[]) => void;
  onOpenAiAssistantWithPrompt?: (prompt: string) => void;
}

export const ItemCatalog: React.FC<ItemCatalogProps> = ({
  items,
  currentUser,
  selectedItemIds,
  onToggleSelectItem,
  onOpenLoanModal,
  onOpenAiAssistantWithItems,
  onOpenAiAssistantWithPrompt,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('SEMUA');
  const [selectedStatus, setSelectedStatus] = useState<string>('SEMUA');
  const [activeDetailItem, setActiveDetailItem] = useState<BmnItem | null>(null);

  // Admin status toggle modal
  const [adminStatusModalItem, setAdminStatusModalItem] = useState<BmnItem | null>(null);
  const [adminTargetStatus, setAdminTargetStatus] = useState<'TERSEDIA' | 'DALAM_PERAWATAN'>('DALAM_PERAWATAN');
  const [adminStatusNotes, setAdminStatusNotes] = useState('');
  const [adminToast, setAdminToast] = useState<string | null>(null);

  // AI Agent Evaluation Modal
  const [evalModalItem, setEvalModalItem] = useState<BmnItem | null>(null);

  const categories = [
    'SEMUA',
    'Kamera',
    'Lensa',
    'Audio & Mic',
    'Lighting Studio',
    'Gimbal & Drone',
    'Workstation Editing',
    'Streaming Kit',
  ];

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.brandModel.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.usageContext.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.storageLocation.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === 'SEMUA' || item.category === selectedCategory;
    const matchesStatus = selectedStatus === 'SEMUA' || item.status === selectedStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getStatusBadge = (status: ItemStatus) => {
    switch (status) {
      case 'TERSEDIA':
        return {
          label: 'Tersedia',
          icon: CheckCircle2,
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          dot: 'bg-emerald-500',
        };
      case 'MENUNGGU_PERSETUJUAN':
        return {
          label: 'Menunggu Persetujuan',
          icon: Clock,
          bg: 'bg-amber-50 text-amber-700 border-amber-200',
          dot: 'bg-amber-500',
        };
      case 'DIPINJAM':
        return {
          label: 'Sedang Dipinjam',
          icon: AlertTriangle,
          bg: 'bg-blue-50 text-blue-700 border-blue-200',
          dot: 'bg-blue-500',
        };
      case 'DALAM_PERAWATAN':
        return {
          label: 'Dalam Perawatan',
          icon: Wrench,
          bg: 'bg-rose-50 text-rose-700 border-rose-200',
          dot: 'bg-rose-500',
        };
      default:
        return {
          label: status,
          icon: Info,
          bg: 'bg-slate-50 text-slate-700 border-slate-200',
          dot: 'bg-slate-400',
        };
    }
  };

  const selectedItemsList = items.filter((i) => selectedItemIds.includes(i.id));

  // Admin updates catalog status (FR-11 & User Request: Perawatan vs Tersedia)
  const handleOpenAdminStatusModal = (item: BmnItem) => {
    setAdminStatusModalItem(item);
    const nextStatus = item.status === 'TERSEDIA' ? 'DALAM_PERAWATAN' : 'TERSEDIA';
    setAdminTargetStatus(nextStatus);
    setAdminStatusNotes(
      nextStatus === 'DALAM_PERAWATAN'
        ? 'Pembersihan sensor, cek optik & kalibrasi rutin'
        : 'Perawatan selesai, unit telah diuji dan siap pakai kembali'
    );
  };

  const handleConfirmAdminStatusUpdate = () => {
    if (!adminStatusModalItem) return;

    const ok = storageService.updateItemStatus(
      adminStatusModalItem.id,
      adminTargetStatus,
      adminStatusNotes,
      currentUser
    );

    if (ok) {
      setAdminToast(`Status ${adminStatusModalItem.name} berhasil diubah menjadi ${adminTargetStatus.replace('_', ' ')}!`);
      setTimeout(() => setAdminToast(null), 4000);
      setAdminStatusModalItem(null);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Toast Alert */}
      {adminToast && (
        <div className="fixed top-18 right-4 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-xs border border-blue-500 animate-in slide-in-from-top duration-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="font-semibold">{adminToast}</span>
        </div>
      )}

      {/* Hero context banner for BLSDM Komdigi Jakarta */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-blue-600/10 to-transparent pointer-events-none" />
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 text-xs font-semibold mb-3 border border-blue-400/30">
            <Layers className="w-3.5 h-3.5 text-blue-300" />
            Inventaris Resmi BMN BLSDM Komdigi Jakarta
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Katalog Inventaris BMN
          </h1>
          <p className="mt-2 text-sm text-slate-300 leading-relaxed font-medium">
            Pilih Peralatan BMN untuk kegiatan di lingkungan BLSDM Komdigi jakarta. Anda dapat memilih lebih dari satu barang sekaligus dalam 1 kali pengajuan.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs">
            <span className="inline-flex items-center gap-1.5 bg-slate-800/80 px-3 py-1 rounded-lg border border-slate-700">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              Total Aset: <strong className="text-white">{items.length} Unit</strong>
            </span>
            <span className="inline-flex items-center gap-1.5 bg-slate-800/80 px-3 py-1 rounded-lg border border-slate-700">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              Tersedia Siap Pakai: <strong className="text-emerald-300">{items.filter((i) => i.status === 'TERSEDIA').length} Unit</strong>
            </span>
            <span className="inline-flex items-center gap-1.5 bg-slate-800/80 px-3 py-1 rounded-lg border border-slate-700">
              <span className="w-2 h-2 rounded-full bg-rose-400"></span>
              Dalam Perawatan: <strong className="text-rose-300">{items.filter((i) => i.status === 'DALAM_PERAWATAN').length} Unit</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Admin Privileged Notice Banner */}
      {currentUser.role === 'ADMIN_BMN' && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 flex items-center justify-between text-xs text-rose-900 shadow-sm">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-rose-600 shrink-0" />
            <span>
              <strong>Mode Administrator Aktif:</strong> Anda dapat mengubah status katalog barang secara langsung (Tersedia vs Dalam Perawatan) melalui tombol <em>Ubah Status</em> pada setiap kartu peralatan.
            </span>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-200 text-rose-800 uppercase">
            Ketua Tim BMN
          </span>
        </div>
      )}

      {/* Search and Filters Bar */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          {/* Search bar */}
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama barang, tipe, lokasi penyimpanan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
            />
          </div>

          {/* Status Quick Filter */}
          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            <span className="text-xs text-slate-500 font-semibold flex items-center gap-1 shrink-0">
              <Filter className="w-3.5 h-3.5" />
              <span>Status:</span>
            </span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="SEMUA">Semua Status</option>
              <option value="TERSEDIA">Tersedia</option>
              <option value="DALAM_PERAWATAN">Dalam Perawatan</option>
              <option value="DIPINJAM">Sedang Dipinjam</option>
              <option value="MENUNGGU_PERSETUJUAN">Menunggu Persetujuan</option>
            </select>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Items Grid */}
      {filteredItems.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm">
          <Info className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">Barang Tidak Ditemukan</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Tidak ada peralatan BMN yang cocok dengan filter pencarian "{searchQuery}". Silakan coba kata kunci lain.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredItems.map((item) => {
            const statusInfo = getStatusBadge(item.status);
            const isSelected = selectedItemIds.includes(item.id);
            const canSelect = item.status === 'TERSEDIA';

            return (
              <div
                key={item.id}
                className={`bg-white rounded-xl border transition-all duration-200 flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-md ${
                  isSelected ? 'border-blue-600 ring-2 ring-blue-500/20' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Image and Badges */}
                <div className="relative h-44 bg-slate-100 overflow-hidden group">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute top-2.5 left-2.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-900/80 text-white backdrop-blur-sm">
                      {item.category}
                    </span>
                  </div>
                  <div className="absolute top-2.5 right-2.5">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border backdrop-blur-md ${statusInfo.bg}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`}></span>
                      {statusInfo.label}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3
                      className="font-bold text-sm text-slate-900 line-clamp-1 hover:text-blue-600 cursor-pointer"
                      onClick={() => setActiveDetailItem(item)}
                    >
                      {item.name}
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5 font-medium">{item.brandModel}</p>

                    {/* Context Description */}
                    <div className="mt-2.5 p-2 rounded-lg bg-slate-50 border border-slate-100 text-[11px] text-slate-600 leading-snug">
                      <span className="font-semibold text-slate-700">Pemanfaatan: </span>
                      {item.usageContext}
                    </div>

                    {/* Active borrower info if currently loaned */}
                    {item.status === 'DIPINJAM' && (
                      <div className="mt-2 p-2 rounded-lg bg-blue-50/80 border border-blue-200 text-[11px] text-blue-900">
                        <div className="font-semibold flex items-center gap-1 text-blue-800">
                          <User className="w-3 h-3" />
                          <span>Dipinjam: {item.currentBorrowerName}</span>
                        </div>
                        <div className="text-[10px] text-blue-700 mt-0.5 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>Kembali: {item.estimatedReturnTime}</span>
                        </div>
                      </div>
                    )}

                    {item.status === 'MENUNGGU_PERSETUJUAN' && (
                      <div className="mt-2 p-2 rounded-lg bg-amber-50/80 border border-amber-200 text-[11px] text-amber-900">
                        <div className="font-semibold flex items-center gap-1 text-amber-800">
                          <Clock className="w-3 h-3" />
                          <span>Dalam Antrean Verifikasi PIC</span>
                        </div>
                        <div className="text-[10px] text-amber-700 mt-0.5">
                          Pemohon: {item.currentBorrowerName}
                        </div>
                      </div>
                    )}

                    {item.status === 'DALAM_PERAWATAN' && (
                      <div className="mt-2 p-2 rounded-lg bg-rose-50 border border-rose-200 text-[11px] text-rose-800 flex items-center gap-1.5">
                        <Wrench className="w-3.5 h-3.5 text-rose-600" />
                        <span>Sedang Masa Perawatan / Kalibrasi</span>
                      </div>
                    )}
                  </div>

                  {/* AI Evaluation Button & Admin Controls */}
                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <div className="flex items-center justify-between gap-1 text-[11px]">
                      {/* AI Agent Quick Evaluator Trigger */}
                      <button
                        onClick={() => setEvalModalItem(item)}
                        className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-bold bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded-md transition"
                        title="Dapatkan penilaian objektif kondisi & saran AI Agent"
                      >
                        <Sparkles className="w-3 h-3 text-indigo-500" />
                        <span>Penilaian AI</span>
                      </button>

                      {/* Admin Quick Status Changer */}
                      {currentUser.role === 'ADMIN_BMN' && (
                        <button
                          onClick={() => handleOpenAdminStatusModal(item)}
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-md font-bold transition text-[10px] ${
                            item.status === 'TERSEDIA'
                              ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                          }`}
                          title="Ubah Status Ketersediaan / Perawatan"
                        >
                          <Wrench className="w-3 h-3" />
                          <span>{item.status === 'TERSEDIA' ? 'Set Perawatan' : 'Set Tersedia'}</span>
                        </button>
                      )}

                      <button
                        onClick={() => setActiveDetailItem(item)}
                        className="text-slate-500 hover:text-slate-800 font-medium flex items-center gap-1"
                      >
                        <Info className="w-3.5 h-3.5" />
                        <span>Rincian</span>
                      </button>
                    </div>

                    {/* Multi-item Selection toggle button */}
                    <button
                      disabled={!canSelect}
                      onClick={() => onToggleSelectItem(item)}
                      className={`w-full py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-sm'
                          : canSelect
                          ? 'bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-blue-700'
                          : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      {isSelected ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Terpilih untuk Pengajuan</span>
                        </>
                      ) : canSelect ? (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          <span>Pilih Barang Ini</span>
                        </>
                      ) : (
                        <span>Tidak Dapat Dipinjam</span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating Selection Action Bar */}
      {selectedItemIds.length > 0 && (
        <div className="fixed bottom-4 left-4 right-4 max-w-4xl mx-auto bg-slate-900 text-white rounded-2xl p-4 shadow-2xl border border-slate-700 z-30 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in slide-in-from-bottom duration-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-base shadow-md">
              {selectedItemIds.length}
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-200">
                {selectedItemIds.length} Barang BMN Terpilih
              </div>
              <div className="text-[11px] text-slate-400 truncate max-w-md">
                {selectedItemsList.map((i) => i.name).join(' • ')}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {onOpenAiAssistantWithItems && (
              <button
                onClick={() => onOpenAiAssistantWithItems(selectedItemsList)}
                className="px-3 py-2 rounded-xl bg-indigo-600/40 hover:bg-indigo-600/70 text-indigo-200 text-xs font-semibold flex items-center gap-1.5 transition border border-indigo-500/50"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden sm:inline">Drafkan via AI</span>
              </button>
            )}

            <button
              onClick={onOpenLoanModal}
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition"
            >
              <span>Ajukan Peminjaman (1x Input)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ADMIN STATUS CHANGER MODAL */}
      {adminStatusModalItem && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-slate-900 animate-in fade-in duration-150 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Wrench className="w-5 h-5 text-rose-600" />
                <h3 className="font-extrabold text-sm text-slate-900">Ubah Status Katalog BMN</h3>
              </div>
              <button
                onClick={() => setAdminStatusModalItem(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="text-xs space-y-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="font-bold text-slate-800">{adminStatusModalItem.name}</div>
                <div className="text-[11px] text-slate-500">Status Saat Ini: <strong>{adminStatusModalItem.status}</strong></div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Pilih Status Baru:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdminTargetStatus('TERSEDIA')}
                    className={`py-2 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 transition ${
                      adminTargetStatus === 'TERSEDIA'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Tersedia</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdminTargetStatus('DALAM_PERAWATAN')}
                    className={`py-2 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 transition ${
                      adminTargetStatus === 'DALAM_PERAWATAN'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Wrench className="w-4 h-4" />
                    <span>Dalam Perawatan</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Catatan / Keterangan Pemeliharaan:
                </label>
                <textarea
                  rows={3}
                  value={adminStatusNotes}
                  onChange={(e) => setAdminStatusNotes(e.target.value)}
                  placeholder="Contoh: Pembersihan sensor & kalibrasi di lab multimedia BLSDM Komdigi Jakarta..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => setAdminStatusModalItem(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmAdminStatusUpdate}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-md shadow-blue-500/20"
              >
                Simpan Perubahan Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI AGENT EVALUATION MODAL */}
      {evalModalItem && (() => {
        const evaluation = evaluateItemWithAi(evalModalItem);
        return (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-indigo-200 text-slate-900 animate-in fade-in zoom-in-95 duration-150 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-indigo-100">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900">Penilaian Kondisi & Kelayakan AI</h3>
                    <p className="text-[10px] text-indigo-600 font-semibold">SIMBA AI Agent Evaluator • BLSDM Komdigi Jakarta</p>
                  </div>
                </div>
                <button
                  onClick={() => setEvalModalItem(null)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              </div>

              <div className="text-xs space-y-3">
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <img
                    src={evalModalItem.imageUrl}
                    alt={evalModalItem.name}
                    className="w-12 h-12 rounded-lg object-cover border border-slate-200"
                  />
                  <div className="flex-1">
                    <div className="font-bold text-slate-900">{evalModalItem.name}</div>
                    <div className="text-[10px] text-slate-500">{evalModalItem.brandModel} • {evalModalItem.category}</div>
                    <div className="text-[10px] text-slate-600 mt-0.5">
                      Status: <strong>{evalModalItem.status}</strong> | Riwayat Pinjam: <strong>{evalModalItem.totalBorrowCount || 1} kali</strong>
                    </div>
                  </div>
                  <div className="text-center bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-xl">
                    <span className="text-[9px] uppercase font-bold text-indigo-600 block">Skor Kelayakan</span>
                    <span className="text-base font-black text-indigo-900">{evaluation.score}%</span>
                  </div>
                </div>

                {/* Verdict Badge */}
                <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 space-y-1">
                  <div className="font-bold text-indigo-950 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-indigo-600" />
                    <span>Hasil Penilaian AI: {evaluation.verdict}</span>
                  </div>
                  <p className="text-[11px] text-indigo-900 leading-relaxed">
                    {evaluation.summary}
                  </p>
                </div>

                {/* AI Actionable Recommendations */}
                <div>
                  <span className="font-bold text-slate-800 text-[11px] block mb-1">
                    💡 Rekomendasi & Saran Tindakan AI:
                  </span>
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-slate-700 leading-relaxed text-[11px]">
                    {evaluation.recommendation}
                  </div>
                </div>

                {/* Suitable Digital Tasks */}
                <div>
                  <span className="font-bold text-slate-800 text-[11px] block mb-1">
                    🎯 Cocok Digunakan Untuk Agenda:
                  </span>
                  <ul className="space-y-1 text-[11px] text-slate-600">
                    {evaluation.suitableTasks.map((task, idx) => (
                      <li key={idx} className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{task}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-2 flex justify-between items-center gap-2 border-t border-slate-100">
                <button
                  onClick={() => {
                    if (onOpenAiAssistantWithPrompt) {
                      onOpenAiAssistantWithPrompt(`Tanyakan lebih detail kondisi dan kelayakan ${evalModalItem.name}`);
                    }
                    setEvalModalItem(null);
                  }}
                  className="text-xs text-indigo-600 hover:underline font-semibold flex items-center gap-1"
                >
                  <Bot className="w-3.5 h-3.5" />
                  <span>Konsultasi AI Lebih Lanjut</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEvalModalItem(null)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold hover:bg-slate-50"
                  >
                    Tutup
                  </button>
                  {evalModalItem.status === 'TERSEDIA' && (
                    <button
                      onClick={() => {
                        onToggleSelectItem(evalModalItem);
                        setEvalModalItem(null);
                      }}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-sm"
                    >
                      {selectedItemIds.includes(evalModalItem.id) ? 'Hapus Pilihan' : 'Pilih Barang Ini'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Item Detail Modal */}
      {activeDetailItem && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="relative h-48 bg-slate-100">
              <img
                src={activeDetailItem.imageUrl}
                alt={activeDetailItem.name}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => setActiveDetailItem(null)}
                className="absolute top-3 right-3 bg-slate-900/70 hover:bg-slate-900 text-white rounded-full p-1.5 text-xs transition"
              >
                ✕
              </button>
              <div className="absolute bottom-3 left-3">
                <span className="px-2.5 py-1 rounded text-xs font-bold bg-slate-900/90 text-white backdrop-blur-sm">
                  {activeDetailItem.category}
                </span>
              </div>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div>
                <h3 className="text-base font-bold text-slate-900">{activeDetailItem.name}</h3>
                <p className="text-slate-500 font-medium">{activeDetailItem.brandModel}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Status Ketersediaan</span>
                  <div className="font-bold text-slate-800 mt-0.5">{activeDetailItem.status}</div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Kondisi Fisik</span>
                  <div className="font-bold text-slate-800 mt-0.5">{activeDetailItem.condition}</div>
                </div>
              </div>

              <div>
                <span className="text-[11px] font-bold text-slate-700 block mb-1">Spesifikasi Teknis:</span>
                <p className="text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  {activeDetailItem.specifications}
                </p>
              </div>

              <div>
                <span className="text-[11px] font-bold text-slate-700 block mb-1">Pemanfaatan di BLSDM Komdigi Jakarta:</span>
                <p className="text-slate-600 leading-relaxed bg-blue-50/50 p-2.5 rounded-lg border border-blue-100 text-blue-900">
                  {activeDetailItem.usageContext}
                </p>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-slate-100 text-[11px]">
                <div className="flex items-center gap-2 text-slate-600">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span><strong>Lokasi Penyimpanan:</strong> {activeDetailItem.storageLocation}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span><strong>PIC BMN:</strong> {activeDetailItem.picName} ({activeDetailItem.picPhone})</span>
                </div>
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  onClick={() => setActiveDetailItem(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition"
                >
                  Tutup
                </button>
                <button
                  onClick={() => {
                    setEvalModalItem(activeDetailItem);
                    setActiveDetailItem(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold hover:bg-indigo-100 transition"
                >
                  ✨ Penilaian AI
                </button>
                {activeDetailItem.status === 'TERSEDIA' && (
                  <button
                    onClick={() => {
                      onToggleSelectItem(activeDetailItem);
                      setActiveDetailItem(null);
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition shadow-md shadow-blue-500/20"
                  >
                    {selectedItemIds.includes(activeDetailItem.id) ? 'Hapus Pilihan' : 'Pilih Barang Ini'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
