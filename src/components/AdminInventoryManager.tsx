import React, { useState } from 'react';
import { 
  Settings, 
  Plus, 
  Edit, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCcw, 
  X, 
  Save, 
  Search,
  Layers,
  Wrench,
  ShieldCheck
} from 'lucide-react';
import { BmnItem, ItemCondition, ItemStatus, UserProfile } from '../types/simba';
import { storageService } from '../services/storageService';

interface AdminInventoryManagerProps {
  items: BmnItem[];
  currentUser: UserProfile;
}

export const AdminInventoryManager: React.FC<AdminInventoryManagerProps> = ({
  items,
  currentUser,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<BmnItem> | null>(null);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  const filteredItems = items.filter(
    (i) =>
      i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.brandModel.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenAdd = () => {
    setEditingItem({
      name: '',
      brandModel: '',
      category: 'Kamera',
      status: 'TERSEDIA',
      condition: 'Baik',
      storageLocation: 'Studio Multimedia BLSDM Komdigi Jakarta Lt. 2',
      specifications: '',
      usageContext: 'Mendukung kegiatan pelatihan, bootcamp, dan sertifikasi talenta digital di BLSDM Komdigi Jakarta.',
      imageUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600&auto=format&fit=crop&q=80',
      totalBorrowCount: 1,
      healthPercentage: 95,
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (item: BmnItem) => {
    setEditingItem({ ...item });
    setModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editingItem.name) {
      alert('Nama barang BMN wajib diisi.');
      return;
    }

    storageService.saveItem(editingItem as any);
    setModalOpen(false);
    setEditingItem(null);
    setNotificationMsg('Data master BMN berhasil diperbarui dan tersimpan permanen!');
    setTimeout(() => setNotificationMsg(null), 3500);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus aset BMN "${name}"?`)) {
      const ok = storageService.deleteItem(id);
      if (!ok) {
        alert('Barang tidak dapat dihapus karena sedang dalam status peminjaman aktif.');
      } else {
        setNotificationMsg('Barang berhasil dihapus dari inventaris BMN.');
        setTimeout(() => setNotificationMsg(null), 3500);
      }
    }
  };

  const handleResetData = () => {
    if (confirm('Reset seluruh data ke kondisi awal PRD BLSDM Komdigi Jakarta? Seluruh riwayat akan dikembalikan.')) {
      storageService.resetToInitial();
      setNotificationMsg('Sistem berhasil di-reset ke data bawaan simulasi!');
      setTimeout(() => setNotificationMsg(null), 3500);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-rose-600 uppercase tracking-wider mb-1">
            <Settings className="w-4 h-4" />
            Pengelolaan Master Data BMN & PIC
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Manajemen Master Aset BMN BLSDM Komdigi Jakarta
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Wewenang Administrator BMN BLSDM Komdigi Jakarta untuk mencatat aset baru, memperbarui kondisi fisik,
            mengatur lokasi penyimpanan, dan menjaga akurasi register BMN.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleResetData}
            className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 transition"
            title="Reset ke Data Bawaan"
          >
            <RefreshCcw className="w-3.5 h-3.5" />
            <span>Reset Data</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Aset BMN Baru</span>
          </button>
        </div>
      </div>

      {notificationMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notificationMsg}</span>
        </div>
      )}

      {/* Search and Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama barang atau kategori..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Total Terdaftar: <strong>{items.length} Aset BMN</strong>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <th className="py-3 px-4">Aset BMN</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4">Status & Kondisi</th>
                <th className="py-3 px-4">Lokasi Penyimpanan</th>
                <th className="py-3 px-4">PIC Penanggung Jawab</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-9 h-9 rounded-lg object-cover border border-slate-200 shrink-0"
                      />
                      <div>
                        <div className="font-bold text-slate-900">{item.name}</div>
                        <div className="text-[10px] text-slate-500">
                          {item.brandModel}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-700">{item.category}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                        {item.status}
                      </span>
                      <span className="text-[10px] text-slate-500">• {item.condition}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-600 max-w-xs truncate">{item.storageLocation}</td>
                  <td className="py-3 px-4 text-slate-700">{item.picName}</td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition"
                        title="Edit Data Aset"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id, item.name)}
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition"
                        title="Hapus Aset"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit / Add Modal */}
      {modalOpen && editingItem && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 my-6 animate-in fade-in zoom-in-95 duration-150 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">
                {editingItem.id ? 'Perbarui Data Aset BMN' : 'Pencatatan Aset BMN Baru'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="py-4 space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nama Barang BMN:</label>
                  <input
                    type="text"
                    required
                    value={editingItem.name || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                    placeholder="Contoh: Sony Alpha 7 IV Full-Frame Camera"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Kategori:</label>
                  <select
                    value={editingItem.category || 'Kamera'}
                    onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium"
                  >
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Merek & Model:</label>
                  <input
                    type="text"
                    value={editingItem.brandModel || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, brandModel: e.target.value })}
                    placeholder="Contoh: Sony ILCE-7M4"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Kondisi Fisik:</label>
                  <select
                    value={editingItem.condition || 'Baik'}
                    onChange={(e) => setEditingItem({ ...editingItem, condition: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium"
                  >
                    <option value="Baik">Baik</option>
                    <option value="Perlu Perawatan">Perlu Perawatan</option>
                    <option value="Rusak Ringan">Rusak Ringan</option>
                    <option value="Rusak Berat">Rusak Berat</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Lokasi Penyimpanan Fisik:</label>
                <input
                  type="text"
                  value={editingItem.storageLocation || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, storageLocation: e.target.value })}
                  placeholder="Contoh: Drybox Lemari Studio BLSDM Komdigi Jakarta Lt. 2"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Konteks Pemanfaatan di BLSDM Komdigi Jakarta:</label>
                <input
                  type="text"
                  value={editingItem.usageContext || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, usageContext: e.target.value })}
                  placeholder="Mendukung kegiatan peliputan pelatihan coding DTS dan modul e-learning..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Spesifikasi Teknis:</label>
                <textarea
                  rows={2}
                  value={editingItem.specifications || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, specifications: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
