import React, { useState } from 'react';
import { 
  Lock, 
  Mail, 
  KeyRound, 
  ArrowRight, 
  ShieldCheck, 
  Layers, 
  User, 
  Sparkles,
  Building,
  CheckCircle2
} from 'lucide-react';
import { UserProfile } from '../types/simba';

interface LoginScreenProps {
  users: UserProfile[];
  onLogin: (userId: string) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ users, onLogin }) => {
  const [selectedUserPreset, setSelectedUserPreset] = useState<string>(users[0]?.id || '');
  const [emailInput, setEmailInput] = useState(users[0]?.email || '');
  const [passwordInput, setPasswordInput] = useState('komdigi2026');
  const [activeMode, setActiveMode] = useState<'preset' | 'manual'>('preset');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handlePresetSelect = (u: UserProfile) => {
    setSelectedUserPreset(u.id);
    setEmailInput(u.email);
    setErrorMsg(null);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const matched = users.find((u) => u.email.toLowerCase() === emailInput.toLowerCase());
    if (matched) {
      onLogin(matched.id);
    } else {
      setErrorMsg('Akun pegawai tidak terdaftar di sistem SIMBA AI BLSDM Komdigi Jakarta.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex flex-col justify-center items-center px-4 py-8 text-slate-100">
      {/* Top Banner Branding */}
      <div className="text-center mb-6 max-w-lg space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-300 text-xs font-semibold border border-blue-500/20">
          <Building className="w-3.5 h-3.5 text-blue-400" />
          <span>Kementerian Komunikasi dan Digital RI</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center justify-center gap-2">
          <span>SIMBA</span>
          <span className="px-2 py-0.5 rounded text-sm bg-blue-600 text-white font-black">AI</span>
        </h1>
        <p className="text-xs text-slate-300 leading-relaxed font-medium">
          Sistem Informasi Peminjaman & Pemantauan BMN Terpadu
          <br />
          <strong className="text-blue-400">BLSDM Komdigi Jakarta</strong>
        </p>
      </div>

      {/* Main Login Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl backdrop-blur-xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-base font-bold text-white">Autentikasi Akun Pegawai</h2>
            <p className="text-[11px] text-slate-400">Pilih profil kedinasan atau masuk dengan email</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Lock className="w-4 h-4" />
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            {errorMsg}
          </div>
        )}

        {/* 1-Click Role Presets for Easy Review */}
        <div className="space-y-2.5">
          <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
            Pilih Akun Masuk Cepat:
          </label>
          <div className="space-y-2">
            {users.map((u) => {
              const isSelected = selectedUserPreset === u.id;
              const roleTitle =
                u.role === 'ADMIN_BMN'
                  ? 'Ketua Tim / Admin BMN'
                  : u.role === 'PIC_BMN'
                  ? 'PIC BMN Multimedia'
                  : 'Peminjam (Pegawai)';

              return (
                <div
                  key={u.id}
                  onClick={() => handlePresetSelect(u)}
                  className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'border-blue-500 bg-blue-500/10 text-white'
                      : 'border-slate-800 bg-slate-800/40 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={u.avatar}
                      alt={u.name}
                      className="w-10 h-10 rounded-full object-cover border border-slate-700 shrink-0"
                    />
                    <div>
                      <div className="font-bold text-xs text-white">{u.name}</div>
                      <div className="text-[10px] text-blue-400 font-medium">{roleTitle}</div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[210px]">{u.unit}</div>
                    </div>
                  </div>
                  {isSelected && (
                    <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={() => onLogin(selectedUserPreset)}
          className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition"
        >
          <span>Masuk Sebagai {users.find((u) => u.id === selectedUserPreset)?.name.split(',')[0]}</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        {/* Security Notice */}
        <div className="pt-2 border-t border-slate-800/80 text-[10px] text-slate-400 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            Akses internal terenkripsi • Khusus pegawai BLSDM Komdigi Jakarta sesuai tata kelola BMN.
          </span>
        </div>
      </div>
    </div>
  );
};
