import React, { useState } from 'react';
import { 
  Database, 
  ShieldCheck, 
  Key, 
  Copy, 
  Check, 
  Layers, 
  FileCode2, 
  Lock, 
  Cpu, 
  AlertCircle 
} from 'lucide-react';
import { POSTGRESQL_DDL_SCHEMA } from '../data/sqlSchema';

export const DatabaseSecurityDoc: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [activeSubView, setActiveSubView] = useState<'erd' | 'security' | 'ddl'>('erd');

  const handleCopySql = () => {
    navigator.clipboard.writeText(POSTGRESQL_DDL_SCHEMA);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-2xl p-6 text-white border border-slate-800 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold mb-2 border border-blue-400/30">
              <Database className="w-3.5 h-3.5 text-blue-300" />
              Database Architect & Security Engineering Blueprint
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
              Arsitektur Basis Data PostgreSQL & Keamanan BMN
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Desain skema relasional berefisiensi tinggi, indexing multi-kolom, pencegahan jadwal bentrok di level database trigger,
              dan Row-Level Security (RLS) untuk mematuhi regulasi tata kelola Barang Milik Negara pada institusi pengembangan SDM Digital.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopySql}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-500/20 flex items-center gap-2 transition"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Tersalin ke Clipboard!' : 'Salin Skrip DDL PostgreSQL'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Pills */}
      <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200 shadow-sm text-xs">
        <button
          onClick={() => setActiveSubView('erd')}
          className={`px-4 py-2 rounded-lg font-bold transition flex items-center gap-2 ${
            activeSubView === 'erd'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Diagram Skema Relasional (ERD)</span>
        </button>
        <button
          onClick={() => setActiveSubView('security')}
          className={`px-4 py-2 rounded-lg font-bold transition flex items-center gap-2 ${
            activeSubView === 'security'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Keamanan & Row-Level Security (RLS)</span>
        </button>
        <button
          onClick={() => setActiveSubView('ddl')}
          className={`px-4 py-2 rounded-lg font-bold transition flex items-center gap-2 ${
            activeSubView === 'ddl'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <FileCode2 className="w-4 h-4" />
          <span>Kode DDL PostgreSQL Lengkap</span>
        </button>
      </div>

      {/* VIEW 1: ERD & TABLE ARCHITECTURE */}
      {activeSubView === 'erd' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Table: barang_bmn */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-xs">
            <div className="bg-slate-900 text-white p-3 font-bold flex items-center justify-between">
              <span>📋 barang_bmn</span>
              <span className="text-[10px] text-blue-400 font-mono">Table: Master Aset</span>
            </div>
            <div className="p-4 space-y-2 divide-y divide-slate-100">
              <div className="flex justify-between py-1 font-mono text-[11px]">
                <span className="font-bold text-blue-600">id</span>
                <span className="text-slate-500">UUID PRIMARY KEY</span>
              </div>
              <div className="flex justify-between py-1 font-mono text-[11px]">
                <span className="font-semibold text-slate-800">kode_bmn</span>
                <span className="text-slate-500">VARCHAR(50) UNIQUE</span>
              </div>
              <div className="flex justify-between py-1 font-mono text-[11px]">
                <span>nama_barang</span>
                <span className="text-slate-500">VARCHAR(200)</span>
              </div>
              <div className="flex justify-between py-1 font-mono text-[11px]">
                <span>kategori</span>
                <span className="text-slate-500">VARCHAR(50)</span>
              </div>
              <div className="flex justify-between py-1 font-mono text-[11px]">
                <span className="text-purple-600 font-semibold">pic_id</span>
                <span className="text-slate-500">FK → pengguna(id)</span>
              </div>
              <div className="flex justify-between py-1 font-mono text-[11px]">
                <span>status</span>
                <span className="text-slate-500">ENUM status_barang</span>
              </div>
              <div className="flex justify-between py-1 font-mono text-[11px]">
                <span>kondisi</span>
                <span className="text-slate-500">ENUM kondisi_barang</span>
              </div>
              <div className="flex justify-between py-1 font-mono text-[11px]">
                <span>konteks_sdm_digital</span>
                <span className="text-slate-500">TEXT (Diklat/Publikasi)</span>
              </div>
            </div>
          </div>

          {/* Table: peminjaman */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-xs">
            <div className="bg-slate-900 text-white p-3 font-bold flex items-center justify-between">
              <span>🎟️ peminjaman</span>
              <span className="text-[10px] text-emerald-400 font-mono">Table: Tiket Pengajuan</span>
            </div>
            <div className="p-4 space-y-2 divide-y divide-slate-100">
              <div className="flex justify-between py-1 font-mono text-[11px]">
                <span className="font-bold text-emerald-600">id</span>
                <span className="text-slate-500">UUID PRIMARY KEY</span>
              </div>
              <div className="flex justify-between py-1 font-mono text-[11px]">
                <span className="font-semibold text-slate-800">nomor_tiket</span>
                <span className="text-slate-500">VARCHAR(30) UNIQUE</span>
              </div>
              <div className="flex justify-between py-1 font-mono text-[11px]">
                <span className="text-purple-600 font-semibold">peminjam_id</span>
                <span className="text-slate-500">FK → pengguna(id)</span>
              </div>
              <div className="flex justify-between py-1 font-mono text-[11px]">
                <span className="text-purple-600 font-semibold">pic_id</span>
                <span className="text-slate-500">FK → pengguna(id)</span>
              </div>
              <div className="flex justify-between py-1 font-mono text-[11px]">
                <span>waktu_pinjam</span>
                <span className="text-slate-500">TIMESTAMPTZ</span>
              </div>
              <div className="flex justify-between py-1 font-mono text-[11px]">
                <span>rencana_kembali</span>
                <span className="text-slate-500">TIMESTAMPTZ</span>
              </div>
              <div className="flex justify-between py-1 font-mono text-[11px]">
                <span>status</span>
                <span className="text-slate-500">ENUM status_peminjaman</span>
              </div>
              <div className="flex justify-between py-1 font-mono text-[11px]">
                <span>keperluan</span>
                <span className="text-slate-500">TEXT (SDM Digital)</span>
              </div>
            </div>
          </div>

          {/* Table: peminjaman_item (Multi-Item FR-02) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-xs">
            <div className="bg-slate-900 text-white p-3 font-bold flex items-center justify-between">
              <span>🔗 peminjaman_item</span>
              <span className="text-[10px] text-amber-400 font-mono">Relasi Multi-Item (FR-02)</span>
            </div>
            <div className="p-4 space-y-2 divide-y divide-slate-100">
              <div className="flex justify-between py-1 font-mono text-[11px]">
                <span className="font-bold text-amber-600">id</span>
                <span className="text-slate-500">UUID PRIMARY KEY</span>
              </div>
              <div className="flex justify-between py-1 font-mono text-[11px]">
                <span className="text-purple-600 font-semibold">peminjaman_id</span>
                <span className="text-slate-500">FK → peminjaman(id)</span>
              </div>
              <div className="flex justify-between py-1 font-mono text-[11px]">
                <span className="text-purple-600 font-semibold">barang_id</span>
                <span className="text-slate-500">FK → barang_bmn(id)</span>
              </div>
              <div className="flex justify-between py-1 font-mono text-[11px]">
                <span>kondisi_awal</span>
                <span className="text-slate-500">ENUM ('Baik', dll)</span>
              </div>
              <div className="flex justify-between py-1 font-mono text-[11px]">
                <span>kondisi_akhir</span>
                <span className="text-slate-500">ENUM ('Baik', 'Rusak')</span>
              </div>
              <div className="flex justify-between py-1 font-mono text-[11px]">
                <span>catatan_item</span>
                <span className="text-slate-500">TEXT (Inspeksi Fisik)</span>
              </div>
            </div>
          </div>

          {/* Table: audit_log (NFR-05) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-xs">
            <div className="bg-slate-900 text-white p-3 font-bold flex items-center justify-between">
              <span>🛡️ audit_log</span>
              <span className="text-[10px] text-rose-400 font-mono">Append-Only (NFR-05)</span>
            </div>
            <div className="p-4 space-y-2 divide-y divide-slate-100">
              <div className="flex justify-between py-1 font-mono text-[11px]">
                <span className="font-bold text-rose-600">id</span>
                <span className="text-slate-500">UUID PRIMARY KEY</span>
              </div>
              <div className="flex justify-between py-1 font-mono text-[11px]">
                <span>actor_name</span>
                <span className="text-slate-500">VARCHAR(150)</span>
              </div>
              <div className="flex justify-between py-1 font-mono text-[11px]">
                <span>actor_role</span>
                <span className="text-slate-500">ENUM peran_pengguna</span>
              </div>
              <div className="flex justify-between py-1 font-mono text-[11px]">
                <span>aksi</span>
                <span className="text-slate-500">VARCHAR(50)</span>
              </div>
              <div className="flex justify-between py-1 font-mono text-[11px]">
                <span>nomor_tiket</span>
                <span className="text-slate-500">VARCHAR(30)</span>
              </div>
              <div className="flex justify-between py-1 font-mono text-[11px]">
                <span>rincian</span>
                <span className="text-slate-500">TEXT</span>
              </div>
              <div className="flex justify-between py-1 font-mono text-[11px]">
                <span>created_at</span>
                <span className="text-slate-500">TIMESTAMPTZ (Imm)</span>
              </div>
            </div>
          </div>

          {/* Table: pengguna */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-xs">
            <div className="bg-slate-900 text-white p-3 font-bold flex items-center justify-between">
              <span>👤 pengguna</span>
              <span className="text-[10px] text-blue-300 font-mono">Pegawai & PIC</span>
            </div>
            <div className="p-4 space-y-2 divide-y divide-slate-100">
              <div className="flex justify-between py-1 font-mono text-[11px]">
                <span className="font-bold text-blue-600">id</span>
                <span className="text-slate-500">UUID PRIMARY KEY</span>
              </div>
              <div className="flex justify-between py-1 font-mono text-[11px]">
                <span className="font-semibold text-slate-800">nip</span>
                <span className="text-slate-500">VARCHAR(18) UNIQUE</span>
              </div>
              <div className="flex justify-between py-1 font-mono text-[11px]">
                <span>nama</span>
                <span className="text-slate-500">VARCHAR(150)</span>
              </div>
              <div className="flex justify-between py-1 font-mono text-[11px]">
                <span>peran</span>
                <span className="text-slate-500">ENUM peran_pengguna</span>
              </div>
              <div className="flex justify-between py-1 font-mono text-[11px]">
                <span>unit_kerja</span>
                <span className="text-slate-500">VARCHAR(200)</span>
              </div>
            </div>
          </div>

          {/* Table: notifikasi */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-xs">
            <div className="bg-slate-900 text-white p-3 font-bold flex items-center justify-between">
              <span>🔔 notifikasi</span>
              <span className="text-[10px] text-amber-300 font-mono">Real-Time Alerts</span>
            </div>
            <div className="p-4 space-y-2 divide-y divide-slate-100">
              <div className="flex justify-between py-1 font-mono text-[11px]">
                <span className="font-bold text-amber-600">id</span>
                <span className="text-slate-500">UUID PRIMARY KEY</span>
              </div>
              <div className="flex justify-between py-1 font-mono text-[11px]">
                <span>penerima_peran</span>
                <span className="text-slate-500">ENUM peran_pengguna</span>
              </div>
              <div className="flex justify-between py-1 font-mono text-[11px]">
                <span>judul</span>
                <span className="text-slate-500">VARCHAR(150)</span>
              </div>
              <div className="flex justify-between py-1 font-mono text-[11px]">
                <span>is_read</span>
                <span className="text-slate-500">BOOLEAN DEFAULT false</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: SECURITY & RLS POLICIES */}
      {activeSubView === 'security' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5 text-xs">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Lock className="w-4 h-4 text-blue-600" />
              <span>Row-Level Security (RLS) & Mekanisme Pengamanan BMN</span>
            </h3>
            <p className="text-slate-500 mt-1">
              Setiap baris data peminjaman dan inventaris BMN diamankan menggunakan kebijakan RLS PostgreSQL native.
            </p>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="font-bold text-slate-800 text-xs">
                1. Kebijakan Hak Akses Peminjam (Peminjam Isolasi):
              </span>
              <p className="text-slate-600 leading-relaxed">
                Peminjam hanya dapat melihat data pengajuan milik mereka sendiri. Hak <code>SELECT</code> dibatasi pada <code>peminjam_id = auth.uid()</code>. Peminjam tidak dapat mengubah status approval secara sepihak.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="font-bold text-slate-800 text-xs">
                2. Kebijakan Wewenang Persetujuan PIC & Admin (RBAC):
              </span>
              <p className="text-slate-600 leading-relaxed">
                Hak <code>UPDATE</code> status peminjaman (menyetujui atau menolak) hanya diberikan jika peran aktor adalah <code>PIC_BMN</code> atau <code>ADMIN_BMN</code>. Percobaan modifikasi langsung dari peran non-PIC akan ditolak oleh PostgreSQL RLS engine.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="font-bold text-slate-800 text-xs">
                3. Pencegahan Bentrok di Level Database Trigger (PL/pgSQL):
              </span>
              <p className="text-slate-600 leading-relaxed">
                Trigger <code>trg_validasi_bentrok</code> berjalan otomatis sebelum baris <code>peminjaman_item</code> dimasukkan. Jika barang yang diminta sedang dalam status <code>DISETUJUI</code> atau <code>SEDANG_DIPINJAM</code> pada interval waktu tumpang-tindih (overlap), transaksi di-abort dengan pesan pengecualian.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="font-bold text-slate-800 text-xs">
                4. Ketahanan Audit Trail (Append-Only):
              </span>
              <p className="text-slate-600 leading-relaxed">
                Tabel <code>audit_log</code> dikonfigurasi tanpa policy <code>UPDATE</code> atau <code>DELETE</code>. Sekali log tercipta, data terkunci selamanya untuk memenuhi kewajiban audit penatausahaan BMN instansi negara.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: FULL DDL SQL SCRIPT */}
      {activeSubView === 'ddl' && (
        <div className="bg-slate-900 text-slate-200 rounded-2xl p-5 border border-slate-800 shadow-xl overflow-hidden">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3 text-xs">
            <span className="font-mono text-blue-400">schema_simba_bmn_sdm_digital.sql (PostgreSQL 16+)</span>
            <button
              onClick={handleCopySql}
              className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium flex items-center gap-1.5 transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Tersalin' : 'Salin SQL'}</span>
            </button>
          </div>
          <pre className="font-mono text-[11px] leading-relaxed max-h-[550px] overflow-y-auto text-slate-300 p-2">
            {POSTGRESQL_DDL_SCHEMA}
          </pre>
        </div>
      )}
    </div>
  );
};
