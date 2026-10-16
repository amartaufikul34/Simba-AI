import { 
  BmnItem, 
  LoanRequest, 
  AuditLog, 
  SimbaNotification, 
  UserProfile, 
  ItemCondition
} from '../types/simba';
import { 
  INITIAL_ITEMS, 
  INITIAL_LOANS, 
  INITIAL_AUDIT_LOGS, 
  INITIAL_NOTIFICATIONS, 
  INITIAL_USERS 
} from '../data/mockData';

const STORAGE_KEYS = {
  ITEMS: 'simba_items_v2',
  LOANS: 'simba_loans_v2',
  LOGS: 'simba_logs_v2',
  NOTIFS: 'simba_notifs_v2',
  USERS: 'simba_users_v2',
  AUTH: 'simba_auth_user_v2',
};

class StorageService {
  private items: BmnItem[] = [];
  private loans: LoanRequest[] = [];
  private logs: AuditLog[] = [];
  private notifs: SimbaNotification[] = [];
  private users: UserProfile[] = [];
  private currentUserId: string | null = null;
  private listeners: (() => void)[] = [];

  constructor() {
    this.initData();
  }

  private initData() {
    try {
      const storedItems = localStorage.getItem(STORAGE_KEYS.ITEMS);
      this.items = storedItems ? JSON.parse(storedItems) : INITIAL_ITEMS;

      const storedLoans = localStorage.getItem(STORAGE_KEYS.LOANS);
      this.loans = storedLoans ? JSON.parse(storedLoans) : INITIAL_LOANS;

      const storedLogs = localStorage.getItem(STORAGE_KEYS.LOGS);
      this.logs = storedLogs ? JSON.parse(storedLogs) : INITIAL_AUDIT_LOGS;

      const storedNotifs = localStorage.getItem(STORAGE_KEYS.NOTIFS);
      this.notifs = storedNotifs ? JSON.parse(storedNotifs) : INITIAL_NOTIFICATIONS;

      const storedUsers = localStorage.getItem(STORAGE_KEYS.USERS);
      this.users = storedUsers ? JSON.parse(storedUsers) : INITIAL_USERS;

      const storedAuth = localStorage.getItem(STORAGE_KEYS.AUTH);
      this.currentUserId = storedAuth || null;
    } catch (e) {
      console.warn('Using memory fallback for storage:', e);
      this.items = [...INITIAL_ITEMS];
      this.loans = [...INITIAL_LOANS];
      this.logs = [...INITIAL_AUDIT_LOGS];
      this.notifs = [...INITIAL_NOTIFICATIONS];
      this.users = [...INITIAL_USERS];
      this.currentUserId = null;
    }
  }

  private persist() {
    try {
      localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(this.items));
      localStorage.setItem(STORAGE_KEYS.LOANS, JSON.stringify(this.loans));
      localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(this.logs));
      localStorage.setItem(STORAGE_KEYS.NOTIFS, JSON.stringify(this.notifs));
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(this.users));
      if (this.currentUserId) {
        localStorage.setItem(STORAGE_KEYS.AUTH, this.currentUserId);
      } else {
        localStorage.removeItem(STORAGE_KEYS.AUTH);
      }
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
    this.notifyListeners();
  }

  public subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach((fn) => fn());
  }

  // Authentication Management
  public login(userId: string): UserProfile | null {
    const user = this.users.find((u) => u.id === userId);
    if (user) {
      this.currentUserId = user.id;
      this.persist();
      return user;
    }
    return null;
  }

  public logout() {
    this.currentUserId = null;
    this.persist();
  }

  public getCurrentUser(): UserProfile | null {
    if (!this.currentUserId) return null;
    return this.users.find((u) => u.id === this.currentUserId) || null;
  }

  public getItems(): BmnItem[] {
    return [...this.items];
  }

  public getItemById(id: string): BmnItem | undefined {
    return this.items.find((item) => item.id === id);
  }

  public getLoans(): LoanRequest[] {
    return [...this.loans];
  }

  public getLogs(): AuditLog[] {
    return [...this.logs];
  }

  public getNotifications(): SimbaNotification[] {
    return [...this.notifs];
  }

  public getUsers(): UserProfile[] {
    return [...this.users];
  }

  public getUserById(id: string): UserProfile | undefined {
    return this.users.find((u) => u.id === id);
  }

  // Check conflicts (FR-04)
  public checkConflict(
    itemIds: string[],
    startDate: string,
    startTime: string,
    plannedEndDate: string,
    plannedEndTime: string,
    excludeLoanId?: string
  ): { hasConflict: boolean; conflictingItemNames: string[]; conflictDetails: string[] } {
    const startCandidate = new Date(`${startDate}T${startTime}:00`).getTime();
    const endCandidate = new Date(`${plannedEndDate}T${plannedEndTime}:00`).getTime();

    const conflictingItemNames: string[] = [];
    const conflictDetails: string[] = [];

    for (const loan of this.loans) {
      if (excludeLoanId && loan.id === excludeLoanId) continue;
      if (loan.status !== 'SEDANG_DIPINJAM' && loan.status !== 'MENUNGGU_PERSETUJUAN') continue;

      const loanStart = new Date(`${loan.startDate}T${loan.startTime}:00`).getTime();
      const loanEnd = new Date(`${loan.plannedEndDate}T${loan.plannedEndTime}:00`).getTime();

      const isOverlap = startCandidate < loanEnd && endCandidate > loanStart;

      if (isOverlap) {
        for (const itm of loan.items) {
          if (itemIds.includes(itm.itemId)) {
            if (!conflictingItemNames.includes(itm.itemName)) {
              conflictingItemNames.push(itm.itemName);
              conflictDetails.push(
                `${itm.itemName} sedang diajukan/dipinjam oleh ${loan.borrowerName} (${loan.startDate} ${loan.startTime} s/d ${loan.plannedEndDate} ${loan.plannedEndTime})`
              );
            }
          }
        }
      }
    }

    return {
      hasConflict: conflictingItemNames.length > 0,
      conflictingItemNames,
      conflictDetails,
    };
  }

  // Feature: Send Return Reminder (Pengingat Pengembalian Barang)
  public sendReturnReminder(loanId: string, customMessage?: string): boolean {
    const loan = this.loans.find((l) => l.id === loanId);
    if (!loan) return false;

    const now = new Date();
    const formattedNow = `${now.toISOString().split('T')[0]} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} WIB`;

    const itemNamesStr = loan.items.map((i) => i.itemName).join(', ');
    const reminderText = customMessage || 
      `Halo ${loan.borrowerName}, pengingat bahwa peminjaman ${itemNamesStr} (Tiket: ${loan.ticketNumber}) untuk kegiatan BLSDM Komdigi Jakarta dijadwalkan kembali pada ${loan.plannedEndDate} pukul ${loan.plannedEndTime} WIB ke Studio BMN. Mohon segera disiapkan.`;

    // Increment count & update last reminder
    loan.reminderSentCount = (loan.reminderSentCount || 0) + 1;
    loan.lastReminderSentAt = formattedNow;

    // Create Notification for Borrower
    this.notifs.unshift({
      id: `notif-${Date.now()}`,
      recipientRole: 'PEMINJAM',
      recipientId: loan.borrowerId,
      title: '🔔 Pengingat Waktu Pengembalian BMN',
      message: reminderText,
      type: 'urgent',
      timestamp: formattedNow.split(' ')[1] + ' WIB',
      isRead: false,
      ticketNumber: loan.ticketNumber,
    });

    // Create Audit Log
    this.logs.unshift({
      id: `log-${Date.now()}`,
      timestamp: formattedNow,
      actorName: 'Sistem Pengingat BLSDM Komdigi Jakarta',
      actorRole: 'PIC_BMN',
      action: 'PENGINGAT_PENGEMBALIAN_DIKIRIM',
      ticketNumber: loan.ticketNumber,
      itemNames: loan.items.map((i) => i.itemName),
      details: `Notifikasi pengingat pengembalian ke-${loan.reminderSentCount} berhasil dikirimkan kepada peminjam ${loan.borrowerName}.`,
    });

    this.persist();
    return true;
  }

  // Single-Step Loan Request (FR-05, FR-02)
  public createLoan(
    data: {
      borrower: UserProfile;
      itemIds: string[];
      purpose: string;
      purposeCategory: LoanRequest['purposeCategory'];
      startDate: string;
      startTime: string;
      plannedEndDate: string;
      plannedEndTime: string;
    }
  ): { success: boolean; loan?: LoanRequest; error?: string } {
    const { borrower, itemIds, purpose, purposeCategory, startDate, startTime, plannedEndDate, plannedEndTime } = data;

    if (!itemIds || itemIds.length === 0) {
      return { success: false, error: 'Pilih minimal satu barang BMN yang akan dipinjam.' };
    }

    const conflict = this.checkConflict(itemIds, startDate, startTime, plannedEndDate, plannedEndTime);
    if (conflict.hasConflict) {
      return {
        success: false,
        error: `Jadwal bentrok terdeteksi: ${conflict.conflictDetails.join(', ')}`,
      };
    }

    const matchedItems = this.items.filter((item) => itemIds.includes(item.id));
    if (matchedItems.length === 0) {
      return { success: false, error: 'Barang yang dipilih tidak ditemukan dalam sistem.' };
    }

    const now = new Date();
    const formattedNow = `${now.toISOString().split('T')[0]} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} WIB`;
    const randomTicketNum = Math.floor(1000 + Math.random() * 9000);
    const ticketNumber = `PINJAM-${now.getFullYear()}-${randomTicketNum}`;

    const newLoan: LoanRequest = {
      id: `loan-${Date.now()}`,
      ticketNumber,
      borrowerId: borrower.id,
      borrowerName: borrower.name,
      borrowerEmail: borrower.email,
      borrowerUnit: borrower.unit,
      borrowerPhone: borrower.phone,
      items: matchedItems.map((itm) => ({
        itemId: itm.id,
        itemName: itm.name,
        category: itm.category,
        initialCondition: itm.condition,
      })),
      initialCondition: matchedItems[0]?.condition || 'Baik',
      purpose,
      purposeCategory,
      startDate,
      startTime,
      plannedEndDate,
      plannedEndTime,
      status: 'MENUNGGU_PERSETUJUAN',
      picId: matchedItems[0].picId,
      picName: matchedItems[0].picName,
      reminderSentCount: 0,
      createdAt: formattedNow,
      updatedAt: formattedNow,
    };

    // Update item status in real-time and increase usage count
    this.items = this.items.map((item) => {
      if (itemIds.includes(item.id)) {
        return {
          ...item,
          status: 'MENUNGGU_PERSETUJUAN',
          currentBorrowerName: borrower.name,
          currentLoanTicket: ticketNumber,
          estimatedReturnTime: `${plannedEndDate}, ${plannedEndTime} WIB`,
          totalBorrowCount: (item.totalBorrowCount || 0) + 1,
        };
      }
      return item;
    });

    this.loans.unshift(newLoan);

    // Audit Log
    this.logs.unshift({
      id: `log-${Date.now()}`,
      timestamp: formattedNow,
      actorName: borrower.name,
      actorRole: borrower.role,
      action: 'PENGAJUAN_DIBUAT',
      ticketNumber,
      itemNames: matchedItems.map((i) => i.name),
      details: `Pengajuan peminjaman baru dibuat untuk kegiatan: "${purpose}" (${matchedItems.length} barang).`,
    });

    // Notification for PIC
    this.notifs.unshift({
      id: `notif-${Date.now()}`,
      recipientRole: 'PIC_BMN',
      title: 'Pengajuan Peminjaman Baru',
      message: `${borrower.name} mengajukan peminjaman ${matchedItems.map((i) => i.name).join(', ')} (${ticketNumber}).`,
      type: 'info',
      timestamp: formattedNow.split(' ')[1] + ' WIB',
      isRead: false,
      ticketNumber,
    });

    this.persist();
    return { success: true, loan: newLoan };
  }

  // PIC Approves (FR-06)
  public approveLoan(loanId: string, notes: string, pic: UserProfile): boolean {
    const loanIndex = this.loans.findIndex((l) => l.id === loanId);
    if (loanIndex === -1) return false;

    const loan = this.loans[loanIndex];
    const now = new Date();
    const formattedNow = `${now.toISOString().split('T')[0]} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} WIB`;

    this.loans[loanIndex] = {
      ...loan,
      status: 'SEDANG_DIPINJAM',
      approvalNotes: notes || 'Disetujui untuk kegiatan BLSDM Komdigi Jakarta.',
      approvedAt: formattedNow,
      updatedAt: formattedNow,
    };

    const itemIds = loan.items.map((i) => i.itemId);
    this.items = this.items.map((item) => {
      if (itemIds.includes(item.id)) {
        return {
          ...item,
          status: 'DIPINJAM',
          currentBorrowerName: loan.borrowerName,
          currentLoanTicket: loan.ticketNumber,
          estimatedReturnTime: `${loan.plannedEndDate}, ${loan.plannedEndTime} WIB`,
        };
      }
      return item;
    });

    // Audit Log
    this.logs.unshift({
      id: `log-${Date.now()}`,
      timestamp: formattedNow,
      actorName: pic.name,
      actorRole: 'PIC_BMN',
      action: 'PERSETUJUAN_PIC',
      ticketNumber: loan.ticketNumber,
      itemNames: loan.items.map((i) => i.itemName),
      details: `Peminjaman disetujui oleh PIC ${pic.name}. Catatan: ${notes || 'Tidak ada catatan.'}`,
    });

    // Notification to Borrower
    this.notifs.unshift({
      id: `notif-${Date.now()}`,
      recipientRole: 'PEMINJAM',
      recipientId: loan.borrowerId,
      title: 'Peminjaman BMN Disetujui',
      message: `Pengajuan ${loan.ticketNumber} disetujui oleh PIC ${pic.name}. Silakan ambil barang di lokasi penyimpanan BMN.`,
      type: 'success',
      timestamp: formattedNow.split(' ')[1] + ' WIB',
      isRead: false,
      ticketNumber: loan.ticketNumber,
    });

    this.persist();
    return true;
  }

  // PIC Rejects (FR-06)
  public rejectLoan(loanId: string, reason: string, pic: UserProfile): boolean {
    const loanIndex = this.loans.findIndex((l) => l.id === loanId);
    if (loanIndex === -1) return false;

    const loan = this.loans[loanIndex];
    const now = new Date();
    const formattedNow = `${now.toISOString().split('T')[0]} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} WIB`;

    this.loans[loanIndex] = {
      ...loan,
      status: 'DITOLAK',
      rejectionReason: reason || 'Kebutuhan prioritas agenda diklat BLSDM Komdigi Jakarta lain.',
      updatedAt: formattedNow,
    };

    const itemIds = loan.items.map((i) => i.itemId);
    this.items = this.items.map((item) => {
      if (itemIds.includes(item.id) && item.currentLoanTicket === loan.ticketNumber) {
        return {
          ...item,
          status: 'TERSEDIA',
          currentBorrowerName: undefined,
          currentLoanTicket: undefined,
          estimatedReturnTime: undefined,
        };
      }
      return item;
    });

    this.logs.unshift({
      id: `log-${Date.now()}`,
      timestamp: formattedNow,
      actorName: pic.name,
      actorRole: 'PIC_BMN',
      action: 'PENOLAKAN_PIC',
      ticketNumber: loan.ticketNumber,
      itemNames: loan.items.map((i) => i.itemName),
      details: `Peminjaman ditolak oleh PIC ${pic.name}. Alasan: ${reason}`,
    });

    this.notifs.unshift({
      id: `notif-${Date.now()}`,
      recipientRole: 'PEMINJAM',
      recipientId: loan.borrowerId,
      title: 'Pengajuan Peminjaman Ditolak',
      message: `Pengajuan ${loan.ticketNumber} tidak disetujui. Alasan: ${reason}`,
      type: 'urgent',
      timestamp: formattedNow.split(' ')[1] + ' WIB',
      isRead: false,
      ticketNumber: loan.ticketNumber,
    });

    this.persist();
    return true;
  }

  // Borrower Initiates Return (FR-07)
  public requestReturn(loanId: string, actor: UserProfile): boolean {
    const loanIndex = this.loans.findIndex((l) => l.id === loanId);
    if (loanIndex === -1) return false;

    const loan = this.loans[loanIndex];
    const now = new Date();
    const formattedNow = `${now.toISOString().split('T')[0]} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} WIB`;

    this.loans[loanIndex] = {
      ...loan,
      status: 'MENUNGGU_PENGEMBALIAN',
      updatedAt: formattedNow,
    };

    this.logs.unshift({
      id: `log-${Date.now()}`,
      timestamp: formattedNow,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'PENGAJUAN_PENGEMBALIAN',
      ticketNumber: loan.ticketNumber,
      itemNames: loan.items.map((i) => i.itemName),
      details: `Peminjam ${actor.name} telah menyerahkan barang fisik dan meminta verifikasi kondisi oleh PIC BMN.`,
    });

    this.notifs.unshift({
      id: `notif-${Date.now()}`,
      recipientRole: 'PIC_BMN',
      title: 'Permintaan Konfirmasi Pengembalian',
      message: `${actor.name} mengajukan pengembalian untuk tiket ${loan.ticketNumber}. Mohon lakukan inspeksi fisik.`,
      type: 'warning',
      timestamp: formattedNow.split(' ')[1] + ' WIB',
      isRead: false,
      ticketNumber: loan.ticketNumber,
    });

    this.persist();
    return true;
  }

  // PIC Confirms Return & Fills Physical Condition (FR-07)
  public confirmReturn(
    loanId: string,
    condition: ItemCondition,
    notes: string,
    pic: UserProfile
  ): boolean {
    const loanIndex = this.loans.findIndex((l) => l.id === loanId);
    if (loanIndex === -1) return false;

    const loan = this.loans[loanIndex];
    const now = new Date();
    const formattedNow = `${now.toISOString().split('T')[0]} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} WIB`;

    this.loans[loanIndex] = {
      ...loan,
      status: 'DIKEMBALIKAN',
      actualReturnDateTime: formattedNow,
      returnedAt: formattedNow,
      returnCondition: condition,
      returnNotes: notes || 'Kondisi fisik diperiksa dan diverifikasi lengkap.',
      updatedAt: formattedNow,
    };

    // Update item status back to TERSEDIA (or DALAM_PERAWATAN if damaged) and adjust health percentage
    const itemIds = loan.items.map((i) => i.itemId);
    this.items = this.items.map((item) => {
      if (itemIds.includes(item.id)) {
        const nextStatus = condition === 'Rusak Berat' || condition === 'Perlu Perawatan' ? 'DALAM_PERAWATAN' : 'TERSEDIA';
        let health = item.healthPercentage || 90;
        if (condition === 'Rusak Berat') health = Math.max(35, health - 25);
        else if (condition === 'Rusak Ringan') health = Math.max(50, health - 10);
        else if (condition === 'Perlu Perawatan') health = Math.max(65, health - 5);

        return {
          ...item,
          status: nextStatus,
          condition: condition,
          healthPercentage: health,
          currentBorrowerName: undefined,
          currentLoanTicket: undefined,
          estimatedReturnTime: undefined,
        };
      }
      return item;
    });

    this.logs.unshift({
      id: `log-${Date.now()}`,
      timestamp: formattedNow,
      actorName: pic.name,
      actorRole: 'PIC_BMN',
      action: 'PENGEMBALIAN_DIKONFIRMASI',
      ticketNumber: loan.ticketNumber,
      itemNames: loan.items.map((i) => i.itemName),
      details: `Pengembalian barang ${loan.ticketNumber} diverifikasi oleh PIC ${pic.name}. Kondisi: ${condition}. Catatan: ${notes || 'Kondisi baik.'}`,
    });

    this.notifs.unshift({
      id: `notif-${Date.now()}`,
      recipientRole: 'PEMINJAM',
      recipientId: loan.borrowerId,
      title: 'Pengembalian Selesai Diverifikasi',
      message: `Terima kasih! Pengembalian tiket ${loan.ticketNumber} telah diterima dan diverifikasi dengan kondisi ${condition}.`,
      type: 'success',
      timestamp: formattedNow.split(' ')[1] + ' WIB',
      isRead: false,
      ticketNumber: loan.ticketNumber,
    });

    this.persist();
    return true;
  }

  // Admin Master Item CRUD (FR-11)
  public saveItem(itemData: Partial<BmnItem> & { name: string; category: BmnItem['category'] }): BmnItem {
    const existingIndex = this.items.findIndex((i) => i.id === itemData.id);
    const now = new Date();
    const formattedNow = `${now.toISOString().split('T')[0]} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} WIB`;

    let savedItem: BmnItem;
    if (existingIndex >= 0) {
      savedItem = {
        ...this.items[existingIndex],
        ...itemData,
      } as BmnItem;
      this.items[existingIndex] = savedItem;

      this.logs.unshift({
        id: `log-${Date.now()}`,
        timestamp: formattedNow,
        actorName: 'Admin BMN BLSDM Komdigi Jakarta',
        actorRole: 'ADMIN_BMN',
        action: 'UPDATE_MASTER_BARANG',
        itemNames: [savedItem.name],
        details: `Pembaruan data master BMN: ${savedItem.name}.`,
      });
    } else {
      savedItem = {
        id: `item-${Date.now()}`,
        name: itemData.name,
        brandModel: itemData.brandModel || 'Sony / DJI / Apple Pro Series',
        category: itemData.category,
        picId: 'user-pic',
        picName: 'Bambang Haryanto, S.Sos.',
        picPhone: '0811-2345-6789',
        status: itemData.status || 'TERSEDIA',
        condition: itemData.condition || 'Baik',
        storageLocation: itemData.storageLocation || 'Studio Multimedia BLSDM Komdigi Jakarta Lt. 2',
        specifications: itemData.specifications || 'Spesifikasi standar kedinasan BLSDM Komdigi Jakarta.',
        usageContext: itemData.usageContext || 'Mendukung kegiatan pelatihan, bootcamp, dan sertifikasi talenta digital.',
        imageUrl: itemData.imageUrl || 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600&auto=format&fit=crop&q=80',
        totalBorrowCount: 1,
        healthPercentage: 95,
      };
      this.items.unshift(savedItem);

      this.logs.unshift({
        id: `log-${Date.now()}`,
        timestamp: formattedNow,
        actorName: 'Admin BMN BLSDM Komdigi Jakarta',
        actorRole: 'ADMIN_BMN',
        action: 'UPDATE_MASTER_BARANG',
        itemNames: [savedItem.name],
        details: `Pencatatan aset baru BMN BLSDM Komdigi Jakarta: ${savedItem.name}.`,
      });
    }

    this.persist();
    return savedItem;
  }

  public deleteItem(id: string): boolean {
    const item = this.items.find((i) => i.id === id);
    if (!item) return false;
    if (item.status === 'DIPINJAM') {
      return false;
    }
    this.items = this.items.filter((i) => i.id !== id);
    this.persist();
    return true;
  }

  // Admin updates catalog item status (e.g. Perawatan vs Tersedia)
  public updateItemStatus(
    itemId: string,
    newStatus: 'TERSEDIA' | 'DALAM_PERAWATAN',
    notes: string,
    actor?: UserProfile
  ): boolean {
    const itemIndex = this.items.findIndex((i) => i.id === itemId);
    if (itemIndex === -1) return false;

    const item = this.items[itemIndex];
    const prevStatus = item.status;
    const actorName = actor ? actor.name : 'Ketua Tim / Admin BMN';
    const actorRole = actor ? actor.role : 'ADMIN_BMN';
    const now = new Date();
    const formattedNow = `${now.toISOString().split('T')[0]} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} WIB`;

    this.items[itemIndex] = {
      ...item,
      status: newStatus,
      condition: newStatus === 'DALAM_PERAWATAN' ? 'Perlu Perawatan' : 'Baik',
      currentBorrowerName: newStatus === 'DALAM_PERAWATAN' ? undefined : item.currentBorrowerName,
      currentLoanTicket: newStatus === 'DALAM_PERAWATAN' ? undefined : item.currentLoanTicket,
    };

    // Audit Trail
    this.logs.unshift({
      id: `log-${Date.now()}`,
      timestamp: formattedNow,
      actorName,
      actorRole,
      action: 'UPDATE_MASTER_BARANG',
      itemNames: [item.name],
      details: `Status inventaris BMN "${item.name}" diubah dari ${prevStatus} menjadi ${newStatus}. Keterangan: ${notes || 'Penyesuaian operasional BLSDM Komdigi Jakarta.'}`,
    });

    // Send notification
    this.notifs.unshift({
      id: `notif-${Date.now()}`,
      recipientRole: 'ALL',
      title: newStatus === 'DALAM_PERAWATAN' ? 'Aset Masuk Masa Perawatan' : 'Aset Siap Pakai Kembali',
      message: newStatus === 'DALAM_PERAWATAN'
        ? `Barang ${item.name} sedang dalam perawatan (${notes || 'Servis/Kalibrasi rutin'}). Tidak dapat dipinjam sementara waktu.`
        : `Barang ${item.name} telah selesai proses perawatan dan kini siap dipinjam kembali di katalog BMN.`,
      type: newStatus === 'DALAM_PERAWATAN' ? 'warning' : 'success',
      timestamp: formattedNow.split(' ')[1] + ' WIB',
      isRead: false,
      actionTab: 'katalog',
    });

    this.persist();
    return true;
  }

  // Admin / Ketua Tim BMN sets asset condition & health percentage
  public updateItemCondition(
    itemId: string,
    condition: ItemCondition,
    healthPercentage: number,
    notes?: string,
    actor?: UserProfile
  ): boolean {
    const itemIndex = this.items.findIndex((i) => i.id === itemId);
    if (itemIndex === -1) return false;

    const item = this.items[itemIndex];
    const prevCondition = item.condition;
    const actorName = actor ? actor.name : 'Ketua Tim / Admin BMN';
    const actorRole = actor ? actor.role : 'ADMIN_BMN';
    const now = new Date();
    const formattedNow = `${now.toISOString().split('T')[0]} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} WIB`;

    const nextStatus = (condition === 'Rusak Berat' || condition === 'Perlu Perawatan') ? 'DALAM_PERAWATAN' : item.status;

    this.items[itemIndex] = {
      ...item,
      condition,
      healthPercentage: Math.min(100, Math.max(0, healthPercentage)),
      status: nextStatus,
    };

    // Audit Log
    this.logs.unshift({
      id: `log-${Date.now()}`,
      timestamp: formattedNow,
      actorName,
      actorRole,
      action: 'UPDATE_MASTER_BARANG',
      itemNames: [item.name],
      details: `Kondisi fisik aset "${item.name}" ditetapkan menjadi ${condition} (Kesehatan: ${healthPercentage}%) oleh ${actorName}. Catatan: ${notes || 'Penyesuaian resmi oleh Ketua Tim BMN.'}`,
    });

    this.persist();
    return true;
  }

  public markNotificationRead(id: string) {
    this.notifs = this.notifs.map((n) => (n.id === id ? { ...n, isRead: true } : n));
    this.persist();
  }

  public resetToInitial() {
    this.items = [...INITIAL_ITEMS];
    this.loans = [...INITIAL_LOANS];
    this.logs = [...INITIAL_AUDIT_LOGS];
    this.notifs = [...INITIAL_NOTIFICATIONS];
    this.users = [...INITIAL_USERS];
    this.persist();
  }
}

export const storageService = new StorageService();
