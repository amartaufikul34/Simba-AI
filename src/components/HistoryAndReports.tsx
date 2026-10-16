import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Download, 
  Filter, 
  Search, 
  Printer, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Calendar, 
  User, 
  Layers, 
  Eye, 
  X,
  FileCheck,
  ShieldCheck,
  Bell,
  FileText,
  BarChart3,
  CalendarCheck
} from 'lucide-react';
import { LoanRequest, AuditLog, UserProfile, ItemCondition } from '../types/simba';

interface HistoryAndReportsProps {
  loans: LoanRequest[];
  auditLogs: AuditLog[];
  currentUser: UserProfile;
  onRequestReturnFromHistory?: (loan: LoanRequest) => void;
}

export const HistoryAndReports: React.FC<HistoryAndReportsProps> = ({
  loans,
  auditLogs,
  currentUser,
  onRequestReturnFromHistory,
}) => {
  const [activeTab, setActiveTab] = useState<'loans' | 'monthly_report' | 'audit_trail'>('loans');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('SEMUA');
  const [selectedPrintLoan, setSelectedPrintLoan] = useState<LoanRequest | null>(null);
  const [downloadSuccessToast, setDownloadSuccessToast] = useState<string | null>(null);

  // Monthly Report State
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedMonth, setSelectedMonth] = useState<string>('10'); // Default October 2026

  const monthNames = [
    { value: '01', label: 'Januari' },
    { value: '02', label: 'Februari' },
    { value: '03', label: 'Maret' },
    { value: '04', label: 'April' },
    { value: '05', label: 'Mei' },
    { value: '06', label: 'Juni' },
    { value: '07', label: 'Juli' },
    { value: '08', label: 'Agustus' },
    { value: '09', label: 'September' },
    { value: '10', label: 'Oktober' },
    { value: '11', label: 'November' },
    { value: '12', label: 'Desember' },
  ];

  const currentMonthName = monthNames.find((m) => m.value === selectedMonth)?.label || 'Bulan Ini';

  // Filter loans for regular view
  const filteredLoans = loans.filter((loan) => {
    const matchesSearch =
      loan.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loan.borrowerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loan.purpose.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loan.items.some((i) => i.itemName.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'SEMUA' || loan.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Filter loans for Monthly Report (matches selected year and month)
  const monthlyLoans = loans.filter((loan) => {
    const prefix = `${selectedYear}-${selectedMonth}`;
    return loan.startDate.startsWith(prefix);
  });

  // Monthly Report Statistics
  const monthlyTotalLoans = monthlyLoans.length;
  const monthlyTotalItems = monthlyLoans.reduce((acc, l) => acc + l.items.length, 0);
  const monthlyReturnedLoans = monthlyLoans.filter((l) => l.status === 'DIKEMBALIKAN');
  const monthlyConditionGood = monthlyReturnedLoans.filter((l) => (l.returnCondition || 'Baik') === 'Baik').length;
  const monthlyConditionNeedsCare = monthlyReturnedLoans.filter((l) => l.returnCondition === 'Perlu Perawatan' || l.returnCondition === 'Rusak Ringan').length;
  const monthlyConditionDamaged = monthlyReturnedLoans.filter((l) => l.returnCondition === 'Rusak Berat').length;

  const returnConditionPercentage = monthlyReturnedLoans.length > 0
    ? ((monthlyConditionGood / monthlyReturnedLoans.length) * 100).toFixed(1)
    : '100.0';

  // Direct download official receipt document for a single loan
  const downloadOfficialReceipt = (loan: LoanRequest) => {
    const htmlContent = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Surat Bukti Peminjaman BMN - ${loan.ticketNumber}</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; margin: 40px; color: #0f172a; line-height: 1.5; font-size: 11pt; background: #fff; }
    .header { text-align: center; border-bottom: 3px double #0f172a; padding-bottom: 12px; margin-bottom: 20px; }
    .kop-1 { font-size: 10pt; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; color: #475569; }
    .kop-2 { font-size: 12pt; font-weight: 900; text-transform: uppercase; margin: 4px 0; color: #0f172a; }
    .kop-3 { font-size: 9pt; color: #64748b; }
    .title { text-align: center; font-size: 13pt; font-weight: bold; text-decoration: underline; margin: 20px 0 10px; }
    .ticket-badge { background: #f1f5f9; border: 1px solid #cbd5e1; padding: 6px 14px; border-radius: 6px; display: inline-block; font-family: monospace; font-weight: bold; font-size: 11pt; }
    .info-grid { display: flex; justify-content: space-between; margin: 20px 0; gap: 20px; }
    .info-col { width: 50%; background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 8px; }
    .info-label { font-size: 8.5pt; text-transform: uppercase; color: #64748b; font-weight: bold; margin-bottom: 4px; }
    .info-val { font-size: 11pt; font-weight: bold; margin-bottom: 4px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 10pt; }
    th, td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; }
    th { background: #f1f5f9; font-weight: bold; }
    .purpose-box { background: #eff6ff; border: 1px solid #bfdbfe; padding: 12px; border-radius: 8px; margin: 15px 0; font-size: 10pt; }
    .signature-row { display: flex; justify-content: space-between; margin-top: 45px; text-align: center; }
    .sig-col { width: 45%; }
    .sig-space { height: 75px; }
    .sig-name { font-weight: bold; text-decoration: underline; font-size: 11pt; }
    .footer-note { font-size: 8pt; color: #94a3b8; text-align: center; margin-top: 40px; border-top: 1px dashed #cbd5e1; padding-top: 10px; }
    @media print {
      body { margin: 20px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="kop-1">KEMENTERIAN KOMUNIKASI DAN DIGITAL REPUBLIK INDONESIA</div>
    <div class="kop-2">BALAI PENGEMBANGAN SUMBER DAYA MANUSIA DAN PENELITIAN KOMUNIKASI DAN DIGITAL JAKARTA</div>
    <div class="kop-3">BLSDM Komdigi Jakarta • Dokumen Tata Kelola Inventaris BMN • SIMBA AI</div>
  </div>

  <div class="title">SURAT BUKTI & BERITA ACARA PEMINJAMAN BMN</div>
  <div style="text-align: center; margin-bottom: 20px;">
    <span class="ticket-badge">NO. TIKET: ${loan.ticketNumber}</span>
  </div>

  <div class="info-grid">
    <div class="info-col">
      <div class="info-label">Identitas Peminjam (Pegawai):</div>
      <div class="info-val">${loan.borrowerName}</div>
      <div>Unit Kerja: <strong>${loan.borrowerUnit}</strong></div>
      <div style="margin-top: 6px; font-size: 9pt; color: #64748b;">Tanggal Pengajuan: ${loan.createdAt}</div>
    </div>
    <div class="info-col">
      <div class="info-label">Jadwal Penggunaan Peralatan:</div>
      <div>Mulai: <strong>${loan.startDate}</strong> pukul <strong>${loan.startTime} WIB</strong></div>
      <div>Rencana Kembali: <strong>${loan.plannedEndDate}</strong> pukul <strong>${loan.plannedEndTime} WIB</strong></div>
      <div style="margin-top: 6px;">Status Terkini: <strong>${loan.status.replace('_', ' ')}</strong></div>
    </div>
  </div>

  <div class="info-label">Daftar Peralatan Barang Milik Negara (BMN) yang Dipinjam:</div>
  <table>
    <thead>
      <tr>
        <th style="width: 40px; text-align: center;">No.</th>
        <th>Nama Barang</th>
        <th>Kategori</th>
        <th>Kondisi Awal</th>
        <th>Kondisi Akhir</th>
      </tr>
    </thead>
    <tbody>
      ${loan.items.map((it, idx) => `
        <tr>
          <td style="text-align: center;">${idx + 1}</td>
          <td><strong>${it.itemName}</strong></td>
          <td>${it.category}</td>
          <td>${it.initialCondition || loan.initialCondition || 'Baik'}</td>
          <td>${it.returnCondition || loan.returnCondition || (loan.status === 'SEDANG_DIPINJAM' ? 'Sedang Digunakan' : '-')}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="purpose-box">
    <strong>Kategori Kegiatan:</strong> ${loan.purposeCategory}<br/>
    <strong>Uraian Keperluan Kedinasan BLSDM Komdigi Jakarta:</strong><br/>
    <em>"${loan.purpose}"</em>
  </div>

  <div class="signature-row">
    <div class="sig-col">
      <div>Peminjam Barang,</div>
      <div class="sig-space"></div>
      <div class="sig-name">${loan.borrowerName}</div>
      <div style="font-size: 9pt; color: #64748b;">Pegawai BLSDM Komdigi Jakarta</div>
    </div>
    <div class="sig-col">
      <div>Mengetahui / Menyetujui,<br/>PIC Sarana Prasarana BMN,</div>
      <div class="sig-space"></div>
      <div class="sig-name">${loan.picName}</div>
      <div style="font-size: 9pt; color: #64748b;">Pranata BMN BLSDM Komdigi Jakarta</div>
    </div>
  </div>

  <div class="footer-note">
    Dokumen ini dicetak secara sah melalui SIMBA AI (Sistem Peminjaman & Pemantauan BMN BLSDM Komdigi Jakarta).<br/>
    Peminjam bertanggung jawab penuh atas keutuhan dan kelayakan fisik barang selama masa penggunaan dinas.
  </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Surat_Bukti_Peminjaman_BMN_${loan.ticketNumber}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloadSuccessToast(`Surat Bukti ${loan.ticketNumber} berhasil diunduh!`);
    setTimeout(() => setDownloadSuccessToast(null), 3500);
  };

  // Download Official Monthly Report Document (.html)
  const downloadMonthlyReport = () => {
    const htmlContent = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Laporan Bulanan Peminjaman BMN - ${currentMonthName} ${selectedYear}</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; margin: 35px; color: #0f172a; line-height: 1.45; font-size: 10.5pt; background: #fff; }
    .header { text-align: center; border-bottom: 3px double #0f172a; padding-bottom: 12px; margin-bottom: 18px; }
    .kop-1 { font-size: 10pt; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; color: #475569; }
    .kop-2 { font-size: 12pt; font-weight: 900; text-transform: uppercase; margin: 4px 0; color: #0f172a; }
    .kop-3 { font-size: 9pt; color: #64748b; }
    .title { text-align: center; font-size: 13pt; font-weight: bold; text-decoration: underline; margin: 15px 0 5px; }
    .period { text-align: center; font-size: 10.5pt; font-weight: bold; color: #1e3a8a; margin-bottom: 15px; }
    .stat-cards { display: flex; justify-content: space-between; margin: 15px 0; gap: 12px; }
    .stat-card { width: 23%; background: #f8fafc; border: 1px solid #cbd5e1; padding: 10px; border-radius: 8px; text-align: center; }
    .stat-num { font-size: 14pt; font-weight: 900; color: #0f172a; margin-top: 3px; }
    .stat-label { font-size: 8pt; text-transform: uppercase; font-weight: bold; color: #64748b; }
    table { width: 100%; border-collapse: collapse; margin: 18px 0; font-size: 9pt; }
    th, td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; }
    th { background: #f1f5f9; font-weight: bold; text-align: center; }
    .badge-good { background: #ecfdf5; color: #065f46; font-weight: bold; padding: 2px 6px; border-radius: 4px; display: inline-block; font-size: 8pt; }
    .badge-warn { background: #fffbeb; color: #92400e; font-weight: bold; padding: 2px 6px; border-radius: 4px; display: inline-block; font-size: 8pt; }
    .badge-bad { background: #fef2f2; color: #991b1b; font-weight: bold; padding: 2px 6px; border-radius: 4px; display: inline-block; font-size: 8pt; }
    .signature-row { display: flex; justify-content: space-between; margin-top: 40px; text-align: center; font-size: 10pt; }
    .sig-col { width: 42%; }
    .sig-space { height: 70px; }
    .sig-name { font-weight: bold; text-decoration: underline; }
    .footer-note { font-size: 8pt; color: #94a3b8; text-align: center; margin-top: 30px; border-top: 1px dashed #cbd5e1; padding-top: 8px; }
    @media print {
      body { margin: 15px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="kop-1">KEMENTERIAN KOMUNIKASI DAN DIGITAL REPUBLIK INDONESIA</div>
    <div class="kop-2">BALAI PENGEMBANGAN SUMBER DAYA MANUSIA DAN PENELITIAN KOMUNIKASI DAN DIGITAL JAKARTA</div>
    <div class="kop-3">Jl. Kelapa Dua Sasak No. 42, Kebon Jeruk, Jakarta Barat • SIMBA AI - BMN BLSDM Komdigi Jakarta</div>
  </div>

  <div class="title">LAPORAN BULANAN PEMANTAUAN & PEMINJAMAN BARANG MILIK NEGARA (BMN)</div>
  <div class="period">PERIODE: BULAN ${currentMonthName.toUpperCase()} TAHUN ${selectedYear}</div>

  <div class="stat-cards">
    <div class="stat-card">
      <div class="stat-label">Total Transaksi</div>
      <div class="stat-num">${monthlyTotalLoans} Kali</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Total Unit Dipinjam</div>
      <div class="stat-num">${monthlyTotalItems} Unit</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Kembali Kondisi Baik</div>
      <div class="stat-num" style="color: #059669;">${monthlyConditionGood} (${returnConditionPercentage}%)</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Perlu Servis/Rawat</div>
      <div class="stat-num" style="color: #d97706;">${monthlyConditionNeedsCare + monthlyConditionDamaged} Unit</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 25px;">No.</th>
        <th style="width: 100px;">No. Tiket</th>
        <th style="width: 80px;">Tgl Pinjam</th>
        <th style="width: 110px;">Peminjam</th>
        <th>Daftar Peralatan BMN</th>
        <th>Keperluan BLSDM Komdigi Jakarta</th>
        <th style="width: 85px;">Kondisi Awal (Dipinjam)</th>
        <th style="width: 85px;">Kondisi Akhir (Kembali)</th>
        <th style="width: 80px;">Status</th>
      </tr>
    </thead>
    <tbody>
      ${monthlyLoans.length === 0 ? `
        <tr>
          <td colspan="9" style="text-align: center; padding: 20px; color: #94a3b8;">
            Tidak ada transaksi peminjaman BMN yang tercatat pada bulan ${currentMonthName} ${selectedYear}.
          </td>
        </tr>
      ` : monthlyLoans.map((l, idx) => `
        <tr>
          <td style="text-align: center;">${idx + 1}</td>
          <td style="font-family: monospace; font-weight: bold;">${l.ticketNumber}</td>
          <td>${l.startDate}</td>
          <td><strong>${l.borrowerName}</strong><br/><span style="font-size: 8pt; color: #64748b;">${l.borrowerUnit}</span></td>
          <td>${l.items.map((i) => `• ${i.itemName}`).join('<br/>')}</td>
          <td><em>${l.purpose}</em></td>
          <td style="text-align: center;"><span class="badge-good">${l.initialCondition || 'Baik'}</span></td>
          <td style="text-align: center;">
            <span class="${
              (l.returnCondition || 'Baik') === 'Baik'
                ? 'badge-good'
                : l.returnCondition === 'Perlu Perawatan'
                ? 'badge-warn'
                : 'badge-bad'
            }">
              ${l.returnCondition || (l.status === 'SEDANG_DIPINJAM' ? 'Sedang Dipakai' : '-')}
            </span>
            ${l.returnNotes ? `<div style="font-size: 7.5pt; color: #64748b; margin-top: 2px;">${l.returnNotes}</div>` : ''}
          </td>
          <td style="text-align: center;"><strong>${l.status.replace('_', ' ')}</strong></td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="signature-row">
    <div class="sig-col">
      <div>Mengetahui,<br/>Ketua Tim Penatausahaan BMN,</div>
      <div class="sig-space"></div>
      <div class="sig-name">Hendro Wibowo, S.E.</div>
      <div style="font-size: 8.5pt; color: #64748b;">Pengelola BMN Ahli Muda BLSDM Komdigi Jakarta</div>
    </div>
    <div class="sig-col">
      <div>Dibuat dan Diverifikasi Oleh,<br/>PIC Sarana Prasarana Multimedia BMN,</div>
      <div class="sig-space"></div>
      <div class="sig-name">Bambang Haryanto, S.Sos.</div>
      <div style="font-size: 8.5pt; color: #64748b;">Pranata BMN BLSDM Komdigi Jakarta</div>
    </div>
  </div>

  <div class="footer-note">
    Laporan Bulanan Resmi digenerate otomatis melalui SIMBA AI pada ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}.
    Arsip tersimpan dalam database aset negara BLSDM Komdigi Jakarta.
  </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Laporan_Bulanan_Peminjaman_BMN_${currentMonthName}_${selectedYear}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloadSuccessToast(`Laporan Bulanan ${currentMonthName} ${selectedYear} berhasil diunduh!`);
    setTimeout(() => setDownloadSuccessToast(null), 3500);
  };

  // Export Monthly Data to CSV with explicit Condition columns
  const exportMonthlyCsv = () => {
    const headers = [
      'Nomor Tiket',
      'Tanggal Pinjam',
      'Jam Pinjam',
      'Rencana Kembali',
      'Waktu Kembali Aktual',
      'Nama Peminjam',
      'Unit Kerja',
      'Daftar Barang BMN',
      'Kategori Keperluan',
      'Rincian Agenda BLSDM Komdigi Jakarta',
      'PIC BMN',
      'Kondisi Awal Barang (Saat Dipinjam)',
      'Kondisi Akhir Barang (Saat Dikembalikan)',
      'Catatan Pemeriksaan Fisik PIC',
      'Status Peminjaman',
    ];

    const rows = monthlyLoans.map((l) => [
      `"${l.ticketNumber}"`,
      `"${l.startDate}"`,
      `"${l.startTime}"`,
      `"${l.plannedEndDate}"`,
      `"${l.actualReturnDateTime || '-'}"`,
      `"${l.borrowerName}"`,
      `"${l.borrowerUnit}"`,
      `"${l.items.map((i) => i.itemName).join('; ')}"`,
      `"${l.purposeCategory}"`,
      `"${l.purpose.replace(/"/g, '""')}"`,
      `"${l.picName}"`,
      `"${l.initialCondition || 'Baik'}"`,
      `"${l.returnCondition || (l.status === 'SEDANG_DIPINJAM' ? 'Sedang Digunakan' : '-')}"`,
      `"${(l.returnNotes || '-').replace(/"/g, '""')}"`,
      `"${l.status}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Laporan_Bulanan_BMN_${currentMonthName}_${selectedYear}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloadSuccessToast(`Laporan CSV Bulanan ${currentMonthName} berhasil diunduh!`);
    setTimeout(() => setDownloadSuccessToast(null), 3500);
  };

  // Export full historical CSV with UTF-8 BOM
  const exportToCsv = () => {
    const headers = [
      'Nomor Tiket',
      'Tanggal Pinjam',
      'Jam Pinjam',
      'Rencana Kembali',
      'Jam Kembali',
      'Nama Peminjam',
      'Unit Kerja',
      'Daftar Barang BMN',
      'Kategori Keperluan',
      'Rincian Agenda BLSDM Komdigi Jakarta',
      'PIC BMN',
      'Status Peminjaman',
      'Kondisi Awal',
      'Kondisi Saat Kembali',
      'Waktu Kembali Aktual',
    ];

    const rows = filteredLoans.map((l) => [
      `"${l.ticketNumber}"`,
      `"${l.startDate}"`,
      `"${l.startTime}"`,
      `"${l.plannedEndDate}"`,
      `"${l.plannedEndTime}"`,
      `"${l.borrowerName}"`,
      `"${l.borrowerUnit}"`,
      `"${l.items.map((i) => i.itemName).join('; ')}"`,
      `"${l.purposeCategory}"`,
      `"${l.purpose.replace(/"/g, '""')}"`,
      `"${l.picName}"`,
      `"${l.status}"`,
      `"${l.initialCondition || 'Baik'}"`,
      `"${l.returnCondition || '-'}"`,
      `"${l.actualReturnDateTime || '-'}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Laporan_Peminjaman_BMN_BLSDM_Komdigi_Jakarta_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloadSuccessToast('Laporan CSV berhasil diunduh!');
    setTimeout(() => setDownloadSuccessToast(null), 3500);
  };

  const getStatusBadge = (status: LoanRequest['status']) => {
    switch (status) {
      case 'DIKEMBALIKAN':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'SEDANG_DIPINJAM':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'MENUNGGU_PERSETUJUAN':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'DITOLAK':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'MENUNGGU_PENGEMBALIAN':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getConditionBadge = (condition?: ItemCondition | string) => {
    switch (condition) {
      case 'Baik':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Perlu Perawatan':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Rusak Ringan':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'Rusak Berat':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Download Toast Notification */}
      {downloadSuccessToast && (
        <div className="fixed top-18 right-4 z-50 bg-emerald-700 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-xs border border-emerald-500 animate-in slide-in-from-top duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          <span>{downloadSuccessToast}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
            <FileSpreadsheet className="w-4 h-4" />
            Laporan Riwayat & Rekapitulasi BMN BLSDM Komdigi Jakarta
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Riwayat Peminjaman & Laporan Bulanan BMN
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Pusat data peminjaman BMN, pelaporan bulanan resmi lengkap dengan kondisi awal dan kondisi pengembalian fisik barang,
            serta fasilitas cetak Berita Acara resmi.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2">
          {activeTab === 'monthly_report' ? (
            <>
              <button
                onClick={downloadMonthlyReport}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20 flex items-center gap-2 transition"
              >
                <Download className="w-4 h-4" />
                <span>Unduh Berita Acara Bulanan (.html)</span>
              </button>
              <button
                onClick={exportMonthlyCsv}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center gap-2 transition"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Ekspor CSV Bulanan</span>
              </button>
            </>
          ) : (
            <button
              onClick={exportToCsv}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center gap-2 transition"
            >
              <Download className="w-4 h-4" />
              <span>Ekspor Semua ke CSV / Excel</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs Filter Bar with New "Laporan Bulanan BMN" Tab */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setActiveTab('loans')}
            className={`px-4 py-2 rounded-lg font-bold transition flex items-center gap-1.5 ${
              activeTab === 'loans'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>Daftar Peminjaman</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">({loans.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('monthly_report')}
            className={`px-4 py-2 rounded-lg font-bold transition flex items-center gap-1.5 ${
              activeTab === 'monthly_report'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-indigo-600 bg-indigo-50/60 hover:bg-indigo-100/70 border border-indigo-200'
            }`}
          >
            <CalendarCheck className="w-3.5 h-3.5" />
            <span>Laporan Bulanan BMN & Kondisi</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-200 text-indigo-900 font-extrabold">
              Baru
            </span>
          </button>

          <button
            onClick={() => setActiveTab('audit_trail')}
            className={`px-4 py-2 rounded-lg font-bold transition ${
              activeTab === 'audit_trail'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Jejak Audit Permanen ({auditLogs.length})
          </button>
        </div>

        {activeTab === 'loans' && (
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {/* Search */}
            <div className="relative flex-1 sm:w-60">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Cari tiket, barang, peminjam..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="SEMUA">Semua Status</option>
              <option value="SEDANG_DIPINJAM">Sedang Dipinjam</option>
              <option value="MENUNGGU_PERSETUJUAN">Menunggu Persetujuan</option>
              <option value="MENUNGGU_PENGEMBALIAN">Menunggu Pengembalian</option>
              <option value="DIKEMBALIKAN">Dikembalikan</option>
              <option value="DITOLAK">Ditolak</option>
            </select>
          </div>
        )}

        {activeTab === 'monthly_report' && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="font-semibold text-slate-600">Pilih Periode:</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {monthNames.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>

            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={2026}>2026</option>
              <option value={2025}>2025</option>
            </select>
          </div>
        )}
      </div>

      {/* VIEW 1: REGULAR LOANS TABLE */}
      {activeTab === 'loans' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                  <th className="py-3 px-4">No. Tiket & Tanggal</th>
                  <th className="py-3 px-4">Peminjam</th>
                  <th className="py-3 px-4">Daftar Barang BMN</th>
                  <th className="py-3 px-4">Keperluan BLSDM Komdigi Jakarta</th>
                  <th className="py-3 px-4">Status & Waktu</th>
                  <th className="py-3 px-4 text-right">Aksi & Unduh</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLoans.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      Tidak ada riwayat peminjaman yang sesuai.
                    </td>
                  </tr>
                ) : (
                  filteredLoans.map((loan) => (
                    <tr key={loan.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-slate-900">{loan.ticketNumber}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{loan.startDate}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-800">{loan.borrowerName}</div>
                        <div className="text-[10px] text-slate-500">{loan.borrowerUnit}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          {loan.items.map((i) => (
                            <div key={i.itemId} className="font-medium text-slate-800 text-[11px]">
                              • {i.itemName}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 mb-1">
                          {loan.purposeCategory}
                        </span>
                        <div className="text-slate-600 text-[11px] line-clamp-2 leading-snug">
                          {loan.purpose}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold border ${getStatusBadge(loan.status)}`}>
                          {loan.status.replace('_', ' ')}
                        </span>
                        {loan.status === 'DIKEMBALIKAN' && (
                          <div className="text-[10px] text-emerald-700 font-medium mt-1">
                            Kondisi: {loan.returnCondition || 'Baik'}
                          </div>
                        )}
                        {loan.status === 'SEDANG_DIPINJAM' && (
                          <div className="text-[10px] text-slate-500 mt-1">
                            Kembali: {loan.plannedEndDate} {loan.plannedEndTime}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Direct Download Action Button */}
                          <button
                            onClick={() => downloadOfficialReceipt(loan)}
                            className="p-1.5 rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 transition"
                            title="Unduh Berita Acara Peminjaman (File HTML/Dokumen Resmi)"
                          >
                            <Download className="w-4 h-4" />
                          </button>

                          {/* Preview / Print Modal */}
                          <button
                            onClick={() => setSelectedPrintLoan(loan)}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition"
                            title="Lihat & Cetak Berita Acara"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          {loan.status === 'SEDANG_DIPINJAM' && onRequestReturnFromHistory && (
                            <button
                              onClick={() => onRequestReturnFromHistory(loan)}
                              className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 text-[11px] font-semibold transition"
                            >
                              Kembalikan
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: DEDICATED MONTHLY BMN REPORT (LAPORAN BULANAN DENGAN KONDISI BARANG) */}
      {activeTab === 'monthly_report' && (
        <div className="space-y-5 animate-in fade-in duration-150">
          {/* Monthly KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Peminjaman Bulan {currentMonthName}</span>
              <div className="text-2xl font-black text-slate-900 mt-1">{monthlyTotalLoans} Transaksi</div>
              <p className="text-[10px] text-slate-500 mt-1">Tercatat resmi di register BMN</p>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Unit Barang Dipinjam</span>
              <div className="text-2xl font-black text-blue-600 mt-1">{monthlyTotalItems} Unit</div>
              <p className="text-[10px] text-slate-500 mt-1">Multi-item peralatan terdistribusi</p>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Kondisi Pengembalian Baik</span>
              <div className="text-2xl font-black text-emerald-600 mt-1">{monthlyConditionGood} Unit ({returnConditionPercentage}%)</div>
              <p className="text-[10px] text-emerald-700 font-medium mt-1">Telah diverifikasi fisik oleh PIC BMN</p>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Perlu Perawatan / Servis</span>
              <div className={`text-2xl font-black mt-1 ${monthlyConditionNeedsCare > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                {monthlyConditionNeedsCare + monthlyConditionDamaged} Unit
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Catatan pemeliharaan berkala</p>
            </div>
          </div>

          {/* Monthly Report Table with Condition Tracking */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
                  <span>Rekapitulasi Peminjaman BMN - Periode {currentMonthName} {selectedYear}</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Laporan resmi memuat kondisi fisik awal saat serah terima barang serta kondisi aktual saat pengembalian barang.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={downloadMonthlyReport}
                  className="px-3.5 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh Dokumen Bulanan</span>
                </button>
                <button
                  onClick={exportMonthlyCsv}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Ekspor CSV</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                    <th className="py-3 px-3 text-center">No.</th>
                    <th className="py-3 px-3">No. Tiket</th>
                    <th className="py-3 px-3">Tgl Pinjam</th>
                    <th className="py-3 px-3">Peminjam & Unit</th>
                    <th className="py-3 px-3">Daftar Barang BMN</th>
                    <th className="py-3 px-3">Keperluan Kedinasan</th>
                    <th className="py-3 px-3 text-center">Kondisi Awal (Saat Dipinjam)</th>
                    <th className="py-3 px-3 text-center">Kondisi Akhir (Saat Kembali)</th>
                    <th className="py-3 px-3">Catatan Pemeriksaan Fisik</th>
                    <th className="py-3 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {monthlyLoans.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-slate-400">
                        Tidak ada riwayat peminjaman BMN pada periode {currentMonthName} {selectedYear}.
                        <div className="text-[11px] text-slate-400 mt-1">Pilih bulan lain pada dropdown periode di atas.</div>
                      </td>
                    </tr>
                  ) : (
                    monthlyLoans.map((loan, idx) => (
                      <tr key={loan.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 px-3 text-center text-slate-400">{idx + 1}</td>
                        <td className="py-3 px-3 font-mono font-bold text-slate-900">{loan.ticketNumber}</td>
                        <td className="py-3 px-3 text-slate-600 whitespace-nowrap">{loan.startDate}</td>
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-800">{loan.borrowerName}</div>
                          <div className="text-[10px] text-slate-500">{loan.borrowerUnit}</div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="space-y-0.5">
                            {loan.items.map((i) => (
                              <div key={i.itemId} className="font-medium text-slate-800 text-[11px]">
                                • {i.itemName}
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-3 max-w-xs">
                          <span className="inline-block px-1.5 py-0.2 rounded text-[9px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 mb-0.5">
                            {loan.purposeCategory}
                          </span>
                          <div className="text-slate-600 text-[11px] line-clamp-2 leading-snug">
                            {loan.purpose}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getConditionBadge(loan.initialCondition || 'Baik')}`}>
                            {loan.initialCondition || 'Baik'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            loan.status === 'SEDANG_DIPINJAM'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : getConditionBadge(loan.returnCondition || 'Baik')
                          }`}>
                            {loan.returnCondition || (loan.status === 'SEDANG_DIPINJAM' ? 'Sedang Digunakan' : '-')}
                          </span>
                        </td>
                        <td className="py-3 px-3 max-w-[160px] text-[11px] text-slate-600 italic">
                          {loan.returnNotes || (loan.status === 'SEDANG_DIPINJAM' ? 'Dalam pemanfaatan resmi' : '-')}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusBadge(loan.status)}`}>
                            {loan.status.replace('_', ' ')}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: AUDIT TRAIL LOG */}
      {activeTab === 'audit_trail' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                Log Jejak Audit Permanen
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Setiap aksi pengajuan, keputusan persetujuan, pengiriman pengingat, dan verifikasi fisik tercatat secara otomatis.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
              Append-Only Protection
            </span>
          </div>

          <div className="space-y-3">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-800">
                      {log.action}
                    </span>
                    {log.ticketNumber && (
                      <span className="font-mono text-blue-700 font-bold">{log.ticketNumber}</span>
                    )}
                    <span className="text-slate-400 text-[10px]">• Pelaku: <strong>{log.actorName}</strong> ({log.actorRole})</span>
                  </div>
                  <p className="text-slate-700 leading-snug">{log.details}</p>
                </div>

                <div className="text-[10px] text-slate-400 font-mono shrink-0">
                  {log.timestamp}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Printable & Downloadable Berita Acara BMN Official Modal */}
      {selectedPrintLoan && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 my-6 text-slate-900 animate-in fade-in zoom-in-95 duration-150">
            {/* Government Official Letterhead */}
            <div className="text-center pb-4 border-b-2 border-slate-900 space-y-1">
              <div className="text-xs font-bold tracking-wider text-slate-600 uppercase">
                Kementerian Komunikasi dan Digital Republik Indonesia
              </div>
              <div className="text-sm font-extrabold uppercase">
                Balai Pengembangan Sumber Daya Manusia dan Penelitian Komunikasi dan Digital Jakarta (BLSDM Komdigi Jakarta)
              </div>
              <div className="text-[11px] text-slate-500">
                Surat Bukti Peminjaman & Pemantauan Barang Milik Negara (SIMBA AI)
              </div>
            </div>

            <div className="py-4 space-y-4 text-xs">
              <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <span>Nomor Tiket BMN: <strong>{selectedPrintLoan.ticketNumber}</strong></span>
                <span>Tanggal Terbit: <strong>{selectedPrintLoan.createdAt}</strong></span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Identitas Peminjam</span>
                  <div className="font-bold text-slate-900 mt-0.5">{selectedPrintLoan.borrowerName}</div>
                  <div>Unit Kerja: {selectedPrintLoan.borrowerUnit}</div>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Jadwal Penggunaan</span>
                  <div>Mulai: {selectedPrintLoan.startDate} {selectedPrintLoan.startTime} WIB</div>
                  <div>Rencana Kembali: {selectedPrintLoan.plannedEndDate} {selectedPrintLoan.plannedEndTime} WIB</div>
                  <div>Status: <strong>{selectedPrintLoan.status}</strong></div>
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Daftar Barang Milik Negara yang Dipinjam:
                </span>
                <table className="w-full border border-slate-300 text-[11px] text-left">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="p-2 border border-slate-300">No.</th>
                      <th className="p-2 border border-slate-300">Nama Barang</th>
                      <th className="p-2 border border-slate-300">Kategori</th>
                      <th className="p-2 border border-slate-300">Kondisi Awal</th>
                      <th className="p-2 border border-slate-300">Kondisi Akhir</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedPrintLoan.items.map((it, idx) => (
                      <tr key={it.itemId}>
                        <td className="p-2 border border-slate-300">{idx + 1}</td>
                        <td className="p-2 border border-slate-300 font-semibold">{it.itemName}</td>
                        <td className="p-2 border border-slate-300">{it.category}</td>
                        <td className="p-2 border border-slate-300">{it.initialCondition || selectedPrintLoan.initialCondition || 'Baik'}</td>
                        <td className="p-2 border border-slate-300">{it.returnCondition || selectedPrintLoan.returnCondition || (selectedPrintLoan.status === 'SEDANG_DIPINJAM' ? 'Sedang Digunakan' : '-')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <span className="font-bold block mb-0.5">Keperluan Kegiatan BLSDM Komdigi Jakarta:</span>
                <p className="text-slate-700 italic">"{selectedPrintLoan.purpose}"</p>
              </div>

              {/* Signatures */}
              <div className="pt-6 grid grid-cols-2 text-center text-xs">
                <div className="space-y-12">
                  <div>Peminjam Barang,</div>
                  <div>
                    <div className="font-bold underline">{selectedPrintLoan.borrowerName}</div>
                    <div className="text-[10px] text-slate-500">Pegawai BLSDM Komdigi Jakarta</div>
                  </div>
                </div>

                <div className="space-y-12">
                  <div>PIC Barang Milik Negara,</div>
                  <div>
                    <div className="font-bold underline">{selectedPrintLoan.picName}</div>
                    <div className="text-[10px] text-slate-500">Pranata BMN BLSDM Komdigi Jakarta</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={() => setSelectedPrintLoan(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold hover:bg-slate-50"
              >
                Tutup
              </button>
              <button
                onClick={() => downloadOfficialReceipt(selectedPrintLoan)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
              >
                <Download className="w-4 h-4" />
                <span>Unduh Dokumen Berita Acara (.html)</span>
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Lembar</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
