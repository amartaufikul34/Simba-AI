import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { LoginScreen } from './components/LoginScreen';
import { ItemCatalog } from './components/ItemCatalog';
import { ItemAvailabilitySchedule } from './components/ItemAvailabilitySchedule';
import { AnalyticsConditionChart } from './components/AnalyticsConditionChart';
import { AiBorrowingAssistant } from './components/AiBorrowingAssistant';
import { PicApprovalQueue } from './components/PicApprovalQueue';
import { HistoryAndReports } from './components/HistoryAndReports';
import { AdminInventoryManager } from './components/AdminInventoryManager';
import { EvaluationDashboard } from './components/EvaluationDashboard';
import { DatabaseSecurityDoc } from './components/DatabaseSecurityDoc';
import { LoanRequestModal } from './components/LoanRequestModal';
import { ReturnConfirmationModal } from './components/ReturnConfirmationModal';
import { storageService } from './services/storageService';
import { BmnItem, LoanRequest, UserProfile, SimbaNotification } from './types/simba';

export default function App() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [items, setItems] = useState<BmnItem[]>([]);
  const [loans, setLoans] = useState<LoanRequest[]>([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [notifications, setNotifications] = useState<SimbaNotification[]>([]);

  // Navigation & UI Modals
  const [activeTab, setActiveTab] = useState<string>('katalog');
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);
  const [inspectionLoan, setInspectionLoan] = useState<LoanRequest | null>(null);
  const [initialItemsForAi, setInitialItemsForAi] = useState<BmnItem[]>([]);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Sync data from storage service
  const loadState = () => {
    const u = storageService.getUsers();
    setUsers(u);
    const authUser = storageService.getCurrentUser();
    setCurrentUser(authUser);
    setItems(storageService.getItems());
    setLoans(storageService.getLoans());
    setAuditLogs(storageService.getLogs() as any);
    setNotifications(storageService.getNotifications());
  };

  useEffect(() => {
    loadState();
    const unsubscribe = storageService.subscribe(() => {
      loadState();
    });
    return unsubscribe;
  }, []);

  const handleLogin = (userId: string) => {
    const loggedIn = storageService.login(userId);
    if (loggedIn) {
      setCurrentUser(loggedIn);
      // Reset activeTab if current tab is restricted
      if (loggedIn.role !== 'ADMIN_BMN' && activeTab === 'admin-master') {
        setActiveTab('katalog');
      }
      setSuccessToast(`Selamat datang di SIMBA AI, ${loggedIn.name.split(',')[0]}!`);
      setTimeout(() => setSuccessToast(null), 3500);
    }
  };

  const handleLogout = () => {
    storageService.logout();
    setCurrentUser(null);
    setSelectedItemIds([]);
    setSuccessToast('Anda telah keluar dari akun SIMBA AI.');
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const handleToggleSelectItem = (item: BmnItem) => {
    if (selectedItemIds.includes(item.id)) {
      setSelectedItemIds(selectedItemIds.filter((id) => id !== item.id));
    } else {
      setSelectedItemIds([...selectedItemIds, item.id]);
    }
  };

  const handleRemoveSelectedItem = (id: string) => {
    setSelectedItemIds(selectedItemIds.filter((itemId) => itemId !== id));
  };

  const handleOpenAiAssistantWithItems = (selectedItems: BmnItem[]) => {
    setInitialItemsForAi(selectedItems);
    setActiveTab('ai-agent');
  };

  const handleLoanCreated = (loan: LoanRequest) => {
    setSelectedItemIds([]);
    setSuccessToast(`Pengajuan ${loan.ticketNumber} berhasil dikirim! Notifikasi diteruskan ke PIC BMN.`);
    setTimeout(() => setSuccessToast(null), 5000);
  };

  // Notification Deep-Linking
  const handleNotificationClick = (notif: SimbaNotification) => {
    storageService.markNotificationRead(notif.id);

    if (notif.actionTab) {
      setActiveTab(notif.actionTab);
      return;
    }

    const titleLower = notif.title.toLowerCase();
    const msgLower = notif.message.toLowerCase();

    if (titleLower.includes('pengingat') || msgLower.includes('pengingat') || titleLower.includes('kembali')) {
      if (currentUser?.role === 'PEMINJAM') {
        setActiveTab('riwayat');
        setSuccessToast(`Pengingat Pengembalian: Silakan periksa status barang Anda.`);
        setTimeout(() => setSuccessToast(null), 4000);
      } else {
        setActiveTab('antrean-pic');
      }
    } else if (titleLower.includes('persetujuan') || titleLower.includes('pengajuan')) {
      if (currentUser?.role === 'PIC_BMN' || currentUser?.role === 'ADMIN_BMN') {
        setActiveTab('antrean-pic');
      } else {
        setActiveTab('riwayat');
      }
    } else if (titleLower.includes('perawatan') || titleLower.includes('status') || titleLower.includes('katalog')) {
      setActiveTab('katalog');
    } else if (titleLower.includes('ai') || msgLower.includes('asisten')) {
      setActiveTab('ai-agent');
    } else {
      setActiveTab('riwayat');
    }
  };

  // If not authenticated, render Login Screen
  if (!currentUser) {
    return <LoginScreen users={users} onLogin={handleLogin} />;
  }

  const selectedItemsList = items.filter((i) => selectedItemIds.includes(i.id));

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col text-slate-800 font-sans selection:bg-blue-600 selection:text-white">
      {/* Global Toast Notification */}
      {successToast && (
        <div className="fixed top-18 right-4 z-50 bg-emerald-700 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-xs border border-emerald-500 animate-in slide-in-from-top duration-300">
          <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping"></span>
          <span className="font-semibold">{successToast}</span>
          <button onClick={() => setSuccessToast(null)} className="ml-2 text-emerald-200 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* Main Header with User Profile, Notifications, Logout & Tabs */}
      <Header
        currentUser={currentUser}
        onLogout={handleLogout}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        selectedItemsCount={selectedItemIds.length}
        onOpenCartModal={() => setIsLoanModalOpen(true)}
        notifications={notifications}
        onMarkNotificationRead={(id) => storageService.markNotificationRead(id)}
        onOpenAiAssistant={() => setActiveTab('ai-agent')}
        onNotificationClick={handleNotificationClick}
      />

      {/* Main App Content View Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'katalog' && (
          <ItemCatalog
            items={items}
            currentUser={currentUser}
            selectedItemIds={selectedItemIds}
            onToggleSelectItem={handleToggleSelectItem}
            onOpenLoanModal={() => setIsLoanModalOpen(true)}
            onOpenAiAssistantWithItems={handleOpenAiAssistantWithItems}
            onOpenAiAssistantWithPrompt={(prompt) => {
              setActiveTab('ai-agent');
            }}
          />
        )}

        {activeTab === 'jadwal' && (
          <ItemAvailabilitySchedule
            items={items}
            loans={loans}
            onSelectItemForLoan={(item) => {
              if (!selectedItemIds.includes(item.id)) {
                setSelectedItemIds([...selectedItemIds, item.id]);
              }
              setIsLoanModalOpen(true);
            }}
          />
        )}

        {activeTab === 'diagram' && (
          <AnalyticsConditionChart items={items} currentUser={currentUser} />
        )}

        {activeTab === 'ai-agent' && (
          <AiBorrowingAssistant
            items={items}
            currentUser={currentUser}
            initialItemsToDraft={initialItemsForAi}
            onLoanCreatedSuccess={(loan) => {
              setInitialItemsForAi([]);
              handleLoanCreated(loan);
            }}
          />
        )}

        {activeTab === 'antrean-pic' && (
          <PicApprovalQueue
            loans={loans}
            currentUser={currentUser}
            onOpenReturnInspection={(loan) => setInspectionLoan(loan)}
          />
        )}

        {activeTab === 'riwayat' && (
          <HistoryAndReports
            loans={loans}
            auditLogs={auditLogs}
            currentUser={currentUser}
            onRequestReturnFromHistory={(loan) => {
              storageService.requestReturn(loan.id, currentUser);
              setSuccessToast(`Permintaan pengembalian ${loan.ticketNumber} telah dikirim ke PIC.`);
              setTimeout(() => setSuccessToast(null), 4000);
            }}
          />
        )}

        {activeTab === 'admin-master' && currentUser.role === 'ADMIN_BMN' && (
          <AdminInventoryManager
            items={items}
            currentUser={currentUser}
          />
        )}

        {activeTab === 'evaluasi' && (
          <EvaluationDashboard items={items} />
        )}

        {activeTab === 'arsitektur' && (
          <DatabaseSecurityDoc />
        )}
      </main>

      {/* Loan Request Modal (1x Single Input FR-05) */}
      <LoanRequestModal
        isOpen={isLoanModalOpen}
        onClose={() => setIsLoanModalOpen(false)}
        currentUser={currentUser}
        selectedItems={selectedItemsList}
        onRemoveItem={handleRemoveSelectedItem}
        onSuccess={handleLoanCreated}
      />

      {/* Physical Inspection & Return Modal (FR-07) */}
      <ReturnConfirmationModal
        isOpen={Boolean(inspectionLoan)}
        onClose={() => setInspectionLoan(null)}
        loan={inspectionLoan}
        currentUser={currentUser}
        onSuccess={() => {
          setSuccessToast('Pengembalian barang dan inspeksi fisik berhasil diverifikasi! Status kembali Tersedia.');
          setTimeout(() => setSuccessToast(null), 4000);
        }}
      />

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 text-xs py-6 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">SIMBA AI</span>
            <span>•</span>
            <span>Sistem Peminjaman & Pemantauan BMN</span>
          </div>
          <div className="text-[11px] text-slate-400 text-center sm:text-right">
            Balai Pengembangan Sumber Daya Manusia dan Penelitian Komunikasi dan Digital Jakarta (BLSDM Komdigi Jakarta)
            <div className="text-slate-500">Kementerian Komunikasi dan Digital Republik Indonesia</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
