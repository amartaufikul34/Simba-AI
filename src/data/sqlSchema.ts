export const POSTGRESQL_DDL_SCHEMA = `-- =====================================================================
-- SIMBA AI: SISTEM PEMINJAMAN & PEMANTAUAN BARANG MILIK NEGARA (BMN)
-- PUSAT PENGEMBANGAN SUMBER DAYA MANUSIA DI BIDANG DIGITAL
-- Database Architect & Security Engineer Blueprint
-- Dialect: PostgreSQL 16+ with Row-Level Security (RLS) & Audit Triggers
-- =====================================================================

-- 1. ENUM TYPES
CREATE TYPE peran_pengguna AS ENUM ('PEMINJAM', 'PIC_BMN', 'ADMIN_BMN');
CREATE TYPE status_barang AS ENUM ('TERSEDIA', 'MENUNGGU_PERSETUJUAN', 'DIPINJAM', 'DALAM_PERAWATAN');
CREATE TYPE kondisi_barang AS ENUM ('Baik', 'Perlu Perawatan', 'Rusak Ringan', 'Rusak Berat');
CREATE TYPE status_peminjaman AS ENUM (
  'MENUNGGU_PERSETUJUAN', 
  'DISETUJUI', 
  'DITOLAK', 
  'SEDANG_DIPINJAM', 
  'MENUNGGU_PENGEMBALIAN', 
  'DIKEMBALIKAN', 
  'TERLAMBAT'
);

-- 2. TABEL PENGGUNA (PEGAWAI PUSBANG SDM DIGITAL)
CREATE TABLE pengguna (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nip VARCHAR(18) UNIQUE NOT NULL,
  nama VARCHAR(150) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  peran peran_pengguna NOT NULL DEFAULT 'PEMINJAM',
  nomor_telepon VARCHAR(20) NOT NULL,
  unit_kerja VARCHAR(200) NOT NULL,
  avatar_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. TABEL BARANG BMN (INVENTARIS RESMI PUSBANG SDM DIGITAL)
CREATE TABLE barang_bmn (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kode_bmn VARCHAR(50) UNIQUE NOT NULL,
  nama_barang VARCHAR(200) NOT NULL,
  merek_tipe VARCHAR(150) NOT NULL,
  kategori VARCHAR(50) NOT NULL,
  pic_id UUID NOT NULL REFERENCES pengguna(id) ON DELETE RESTRICT,
  status status_barang NOT NULL DEFAULT 'TERSEDIA',
  kondisi kondisi_barang NOT NULL DEFAULT 'Baik',
  lokasi_penyimpanan VARCHAR(255) NOT NULL,
  spesifikasi TEXT NOT NULL,
  konteks_sdm_digital TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_barang_status_kategori ON barang_bmn(status, kategori);
CREATE INDEX idx_barang_pic ON barang_bmn(pic_id);

-- 4. TABEL PEMINJAMAN (HEADER TIKET)
CREATE TABLE peminjaman (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nomor_tiket VARCHAR(30) UNIQUE NOT NULL,
  peminjam_id UUID NOT NULL REFERENCES pengguna(id) ON DELETE RESTRICT,
  pic_id UUID NOT NULL REFERENCES pengguna(id) ON DELETE RESTRICT,
  keperluan TEXT NOT NULL,
  kategori_keperluan VARCHAR(100) NOT NULL,
  waktu_pinjam TIMESTAMPTZ NOT NULL,
  rencana_kembali TIMESTAMPTZ NOT NULL,
  waktu_kembali_aktual TIMESTAMPTZ,
  status status_peminjaman NOT NULL DEFAULT 'MENUNGGU_PERSETUJUAN',
  catatan_persetujuan TEXT,
  alasan_penolakan TEXT,
  kondisi_saat_kembali kondisi_barang,
  catatan_pengembalian TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_waktu_valid CHECK (rencana_kembali > waktu_pinjam)
);

CREATE INDEX idx_peminjaman_peminjam ON peminjaman(peminjam_id);
CREATE INDEX idx_peminjaman_pic ON peminjaman(pic_id);
CREATE INDEX idx_peminjaman_status ON peminjaman(status);
CREATE INDEX idx_peminjaman_rentang_waktu ON peminjaman(waktu_pinjam, rencana_kembali);

-- 5. TABEL PEMINJAMAN_ITEM (RELASI MULTI-ITEM PER PENGAJUAN - FR-02)
CREATE TABLE peminjaman_item (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  peminjaman_id UUID NOT NULL REFERENCES peminjaman(id) ON DELETE CASCADE,
  barang_id UUID NOT NULL REFERENCES barang_bmn(id) ON DELETE RESTRICT,
  kondisi_awal kondisi_barang NOT NULL DEFAULT 'Baik',
  kondisi_akhir kondisi_barang,
  catatan_item TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(peminjaman_id, barang_id)
);

CREATE INDEX idx_peminjaman_item_barang ON peminjaman_item(barang_id);

-- 6. TABEL AUDIT_LOG (AUDITABILITAS NFR-05 & SECURITY COMPLIANCE)
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES pengguna(id) ON DELETE SET NULL,
  actor_name VARCHAR(150) NOT NULL,
  actor_role peran_pengguna NOT NULL,
  aksi VARCHAR(50) NOT NULL,
  nomor_tiket VARCHAR(30),
  rincian TEXT NOT NULL,
  ip_address INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_created ON audit_log(created_at DESC);
CREATE INDEX idx_audit_tiket ON audit_log(nomor_tiket);

-- 7. TABEL NOTIFIKASI & PENGINGAT REAL-TIME (FR-06, FR-08)
CREATE TABLE notifikasi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  penerima_id UUID REFERENCES pengguna(id) ON DELETE CASCADE,
  penerima_peran peran_pengguna,
  judul VARCHAR(150) NOT NULL,
  pesan TEXT NOT NULL,
  tipe VARCHAR(20) NOT NULL DEFAULT 'info',
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  nomor_tiket VARCHAR(30),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================================
-- KEAMANAN: ROW-LEVEL SECURITY (RLS) POLICIES
-- =====================================================================
ALTER TABLE peminjaman ENABLE ROW LEVEL SECURITY;
ALTER TABLE peminjaman_item ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Policy Peminjam: Hanya melihat peminjaman miliknya sendiri
CREATE POLICY rls_peminjam_select ON peminjaman
  FOR SELECT
  TO authenticated
  USING (
    peminjam_id = auth.uid() 
    OR (SELECT peran FROM pengguna WHERE id = auth.uid()) IN ('PIC_BMN', 'ADMIN_BMN')
  );

-- Policy PIC BMN & Admin: Berwenang menyetujui dan memperbarui status
CREATE POLICY rls_pic_update ON peminjaman
  FOR UPDATE
  TO authenticated
  USING (
    (SELECT peran FROM pengguna WHERE id = auth.uid()) IN ('PIC_BMN', 'ADMIN_BMN')
  );

-- Policy Audit Log: Append-only, Dilarang UPDATE atau DELETE (Section 10 PRD Rule 4)
CREATE POLICY rls_audit_insert ON audit_log
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY rls_audit_select ON audit_log
  FOR SELECT
  TO authenticated
  USING (
    (SELECT peran FROM pengguna WHERE id = auth.uid()) IN ('PIC_BMN', 'ADMIN_BMN')
  );

-- Trigger Otomatis: Anti-Pencatatan Ganda & Deteksi Jadwal Bentrok
CREATE OR REPLACE FUNCTION fn_cek_jadwal_bentrok()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM peminjaman_item pi
    JOIN peminjaman p ON p.id = pi.peminjaman_id
    WHERE pi.barang_id = NEW.barang_id
      AND p.status IN ('DISETUJUI', 'SEDANG_DIPINJAM', 'MENUNGGU_PERSETUJUAN')
      AND p.id <> NEW.peminjaman_id
      AND (
        (SELECT waktu_pinjam FROM peminjaman WHERE id = NEW.peminjaman_id) < p.rencana_kembali
        AND (SELECT rencana_kembali FROM peminjaman WHERE id = NEW.peminjaman_id) > p.waktu_pinjam
      )
  ) THEN
    RAISE EXCEPTION 'BARANG_BENTROK: Salah satu barang telah dijadwalkan pada jam tersebut.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validasi_bentrok
BEFORE INSERT ON peminjaman_item
FOR EACH ROW
EXECUTE FUNCTION fn_cek_jadwal_bentrok();
`;
