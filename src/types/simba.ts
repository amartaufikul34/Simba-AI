export type UserRole = 'PEMINJAM' | 'PIC_BMN' | 'ADMIN_BMN';

export type ItemStatus = 'TERSEDIA' | 'MENUNGGU_PERSETUJUAN' | 'DIPINJAM' | 'DALAM_PERAWATAN';

export type ItemCondition = 'Baik' | 'Perlu Perawatan' | 'Rusak Ringan' | 'Rusak Berat';

export type LoanStatus = 
  | 'MENUNGGU_PERSETUJUAN'
  | 'DISETUJUI'
  | 'DITOLAK'
  | 'SEDANG_DIPINJAM'
  | 'MENUNGGU_PENGEMBALIAN'
  | 'DIKEMBALIKAN'
  | 'TERLAMBAT';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone: string;
  unit: string; // BLSDM Komdigi Jakarta
  avatar: string;
}

export interface BmnItem {
  id: string;
  name: string;
  brandModel: string;
  category: 'Kamera' | 'Lensa' | 'Audio & Mic' | 'Lighting Studio' | 'Gimbal & Drone' | 'Workstation Editing' | 'Streaming Kit';
  picId: string;
  picName: string;
  picPhone: string;
  status: ItemStatus;
  condition: ItemCondition;
  storageLocation: string;
  specifications: string;
  usageContext: string; // Detail relevansi dengan kegiatan BLSDM Komdigi Jakarta
  currentBorrowerName?: string;
  currentLoanTicket?: string;
  estimatedReturnTime?: string;
  imageUrl: string;
  totalBorrowCount?: number; // Akumulasi peminjaman untuk analisis diagram
  healthPercentage?: number; // Persentase kondisi fisik (0 - 100%)
  aiRating?: number; // Nilai kecocokan AI (1 - 100)
  aiPros?: string[]; // Kelebihan untuk kegiatan BLSDM Komdigi Jakarta
  aiCons?: string[]; // Catatan atau perhatian teknis
  aiBestUse?: string; // Rekomendasi kegiatan terbaik
  aiSynergy?: string[]; // Pasangan alat rekomendasi AI
}

export interface LoanItemDetail {
  itemId: string;
  itemName: string;
  category: string;
  initialCondition?: ItemCondition;
  returnCondition?: ItemCondition;
}

export interface LoanRequest {
  id: string;
  ticketNumber: string;
  borrowerId: string;
  borrowerName: string;
  borrowerEmail: string;
  borrowerUnit: string;
  borrowerPhone: string;
  items: LoanItemDetail[];
  initialCondition?: ItemCondition;
  purpose: string; // Konteks kegiatan BLSDM Komdigi Jakarta
  purposeCategory: 
    | 'Peliputan Pelatihan Digital'
    | 'Produksi Modul E-Learning'
    | 'Dokumentasi Sertifikasi Kompetensi'
    | 'Webinar & Live Workshop'
    | 'Uji Lab & Bootcamp Talenta Digital';
  startDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  plannedEndDate: string; // YYYY-MM-DD
  plannedEndTime: string; // HH:mm
  actualReturnDateTime?: string;
  status: LoanStatus;
  picId: string;
  picName: string;
  approvalNotes?: string;
  rejectionReason?: string;
  approvedAt?: string;
  returnedAt?: string;
  returnCondition?: ItemCondition;
  returnNotes?: string;
  reminderSentCount?: number;
  lastReminderSentAt?: string;
  lastReminderMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actorName: string;
  actorRole: UserRole;
  action: 
    | 'PENGAJUAN_DIBUAT'
    | 'PERSETUJUAN_PIC'
    | 'PENOLAKAN_PIC'
    | 'BARANG_DISERAHKAN'
    | 'PENGAJUAN_PENGEMBALIAN'
    | 'PENGEMBALIAN_DIKONFIRMASI'
    | 'PENGINGAT_PENGEMBALIAN_DIKIRIM'
    | 'UPDATE_MASTER_BARANG'
    | 'PERINGATAN_KETERLAMBATAN';
  ticketNumber?: string;
  itemNames?: string[];
  details: string;
}

export interface SimbaNotification {
  id: string;
  recipientRole: UserRole | 'ALL';
  recipientId?: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'urgent';
  timestamp: string;
  isRead: boolean;
  actionUrl?: string;
  ticketNumber?: string;
  actionTab?: string; // Direct navigation target tab ('antrean-pic', 'riwayat', 'katalog', etc.)
  actionLoanId?: string;
}

export interface AiParsedRequest {
  isLendingIntent: boolean;
  detectedItems: {
    matchedId?: string;
    name: string;
    category?: string;
    isAvailable?: boolean;
  }[];
  startDate?: string;
  startTime?: string;
  endDate?: string;
  endTime?: string;
  purpose?: string;
  purposeCategory?: LoanRequest['purposeCategory'];
  summary: string;
  confidenceScore: number;
  conflictsFound?: string[];
  needsClarification?: boolean; // True when multiple items match (e.g. "kamera sony" => A7 IV or FX3)
  clarificationPrompt?: string;
  clarificationItems?: BmnItem[];
  evaluation?: {
    score: number;
    conditionVerdict: string;
    recommendation: string;
    details: string;
    maintenanceUrgency: 'low' | 'medium' | 'high';
  };
}
