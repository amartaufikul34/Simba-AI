import React, { useState } from 'react';
import { 
  Shield, 
  User, 
  Bell, 
  ShoppingBag, 
  Bot, 
  Calendar, 
  LayoutGrid, 
  ClipboardCheck, 
  FileSpreadsheet, 
  Settings, 
  Award, 
  Database,
  Menu,
  X,
  Layers,
  Sparkles,
  BarChart3,
  LogOut
} from 'lucide-react';
import { UserProfile, UserRole, SimbaNotification } from '../types/simba';

interface HeaderProps {
  currentUser: UserProfile;
  onLogout: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  selectedItemsCount: number;
  onOpenCartModal: () => void;
  notifications: SimbaNotification[];
  onMarkNotificationRead: (id: string) => void;
  onOpenAiAssistant: () => void;
  onNotificationClick?: (notif: SimbaNotification) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onLogout,
  activeTab,
  onTabChange,
  selectedItemsCount,
  onOpenCartModal,
  notifications,
  onMarkNotificationRead,
  onOpenAiAssistant,
  onNotificationClick,
}) => {
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const unreadNotifs = notifications.filter(
    (n) => !n.isRead && (n.recipientRole === 'ALL' || n.recipientRole === currentUser.role || n.recipientId === currentUser.id)
  );

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'ADMIN_BMN':
        return { label: 'Ketua Tim / Admin BMN', color: 'bg-rose-50 text-rose-700 border-rose-200' };
      case 'PIC_BMN':
        return { label: 'PIC BMN Multimedia', color: 'bg-amber-50 text-amber-700 border-amber-200' };
      default:
        return { label: 'Peminjam (Pegawai)', color: 'bg-blue-50 text-blue-700 border-blue-200' };
    }
  };

  const navItems = [
    { id: 'katalog', label: 'Katalog BMN', icon: LayoutGrid, count: null },
    { id: 'jadwal', label: 'Status & Jadwal', icon: Calendar, count: null },
    { id: 'diagram', label: 'Diagram & Kelayakan', icon: BarChart3, count: null, highlight: true },
    { id: 'ai-agent', label: 'SIMBA AI Agent', icon: Bot, count: null },
    { id: 'antrean-pic', label: 'Antrean PIC & Pengingat', icon: ClipboardCheck, badge: currentUser.role === 'PIC_BMN' ? 'PIC' : undefined },
    { id: 'riwayat', label: 'Riwayat & Ekspor', icon: FileSpreadsheet, count: null },
    { id: 'admin-master', label: 'Master Aset BMN', icon: Settings, adminOnly: true },
    { id: 'evaluasi', label: 'Evaluasi PRD', icon: Award, count: null },
    { id: 'arsitektur', label: 'Arsitektur DB', icon: Database, count: null },
  ];

  const filteredNavItems = navItems.filter((item) => {
    if (item.adminOnly && currentUser.role !== 'ADMIN_BMN') return false;
    return true;
  });

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 text-slate-100 shadow-md">
      {/* Top Banner: BLSDM Komdigi Jakarta Context */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 px-4 py-1.5 text-xs text-slate-300 border-b border-slate-800 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
            KEMENTERIAN KOMUNIKASI DAN DIGITAL
          </span>
          <span className="hidden sm:inline text-slate-400">|</span>
          <span className="font-medium text-slate-300 truncate">
            Balai Pengembangan Sumber Daya Manusia dan Penelitian Komunikasi dan Digital Jakarta (BLSDM Komdigi Jakarta)
          </span>
        </div>
        <div className="flex items-center gap-3 text-[11px]">
          <span className="inline-flex items-center gap-1.5 text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Server Realtime: Siap
          </span>
          <span className="text-slate-400 hidden md:inline">SOP Tata Kelola BMN No. 42/2026</span>
        </div>
      </div>

      {/* Main Header Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & App Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => onTabChange('katalog')}>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 font-black text-lg tracking-wider">
                S
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg tracking-tight text-white">SIMBA</span>
                  <span className="px-1.5 py-0.5 text-[11px] font-bold bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded">
                    AI
                  </span>
                </div>
                <p className="text-[11px] text-blue-400 leading-none font-medium">
                  BLSDM Komdigi Jakarta
                </p>
              </div>
            </div>
          </div>

          {/* User Profile, Cart, Notifications & Logout */}
          <div className="flex items-center gap-3">
            {/* AI Fast Launcher */}
            <button
              onClick={onOpenAiAssistant}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 text-xs font-semibold transition"
              title="Buka Asisten SIMBA AI Natural Language"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Tanya / Pinjam via AI</span>
            </button>

            {/* Cart Button (Multi-Item Selection FR-02) */}
            <button
              onClick={onOpenCartModal}
              className="relative p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
              title="Barang Terpilih untuk Pengajuan"
            >
              <ShoppingBag className="w-5 h-5" />
              {selectedItemsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-600 text-white font-bold rounded-full w-5 h-5 text-[11px] flex items-center justify-center shadow">
                  {selectedItemsCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown (FR-06, FR-08) */}
            <div className="relative">
              <button
                onClick={() => setShowNotifMenu(!showNotifMenu)}
                className="relative p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                title="Pemberitahuan & Pengingat"
              >
                <Bell className="w-5 h-5" />
                {unreadNotifs.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-amber-500 text-slate-900 font-bold rounded-full w-5 h-5 text-[11px] flex items-center justify-center shadow animate-pulse">
                    {unreadNotifs.length}
                  </span>
                )}
              </button>

              {showNotifMenu && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-2 z-50">
                  <div className="px-4 py-2 border-b border-slate-800 flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      Notifikasi ({unreadNotifs.length} Baru)
                    </span>
                    <button
                      onClick={() => unreadNotifs.forEach((n) => onMarkNotificationRead(n.id))}
                      className="text-[11px] text-blue-400 hover:underline"
                    >
                      Tandai Semua Dibaca
                    </button>
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-800">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-400">Tidak ada notifikasi baru</div>
                    ) : (
                      notifications.slice(0, 8).map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => {
                            onMarkNotificationRead(notif.id);
                            setShowNotifMenu(false);
                            if (onNotificationClick) {
                              onNotificationClick(notif);
                            }
                          }}
                          className={`p-3 text-xs hover:bg-slate-800/90 cursor-pointer transition group border-l-2 ${
                            notif.isRead
                              ? 'border-transparent opacity-60'
                              : notif.type === 'urgent' || notif.type === 'warning'
                              ? 'border-amber-500 bg-slate-800/40'
                              : 'border-blue-500 bg-slate-800/30'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-slate-200 group-hover:text-blue-300 transition">
                              {notif.title}
                            </span>
                            <span className="text-[10px] text-slate-400">{notif.timestamp}</span>
                          </div>
                          <p className="text-slate-300 text-[11px] leading-relaxed mb-1.5">{notif.message}</p>
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-blue-400 font-bold group-hover:underline flex items-center gap-1">
                              <span>Buka & Tindak Lanjuti</span>
                              <span>➔</span>
                            </span>
                            {notif.ticketNumber && (
                              <span className="font-mono text-slate-400 font-bold">{notif.ticketNumber}</span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Logged in user profile & Logout */}
            <div className="flex items-center gap-3 pl-3 border-l border-slate-800">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-9 h-9 rounded-full object-cover border border-slate-700"
              />
              <div className="hidden sm:block text-left">
                <div className="text-xs font-bold text-white truncate max-w-[140px]">{currentUser.name}</div>
                <div className="text-[10px] text-blue-400 font-medium">
                  {getRoleBadge(currentUser.role).label}
                </div>
              </div>

              <button
                onClick={onLogout}
                className="p-2 rounded-lg bg-slate-800 hover:bg-rose-900/40 text-slate-300 hover:text-rose-300 border border-slate-700 transition"
                title="Keluar dari Akun (Logout)"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Desktop Navigation Tabs */}
        <nav className="hidden lg:flex items-center space-x-1 py-2 border-t border-slate-800/80 text-xs overflow-x-auto">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : item.highlight
                    ? 'text-indigo-400 hover:bg-indigo-950/40 hover:text-indigo-200'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : item.highlight ? 'text-indigo-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {item.badge && (
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-slate-900 border-t border-slate-800 px-4 pt-2 pb-4 space-y-1">
          <div className="text-[11px] font-bold text-slate-400 px-3 py-1 uppercase tracking-wider">
            Menu Navigasi SIMBA AI
          </div>
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onTabChange(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/30 text-amber-300">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between px-3">
            <span className="text-[11px] text-slate-400">{currentUser.name}</span>
            <button
              onClick={onLogout}
              className="text-xs text-rose-400 font-bold flex items-center gap-1 hover:underline"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
