import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  User, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  ArrowRight, 
  Layers, 
  ShieldAlert, 
  RotateCcw,
  Check,
  MessageSquare,
  BarChart3,
  Lightbulb,
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import { BmnItem, UserProfile, AiParsedRequest, LoanRequest } from '../types/simba';
import { processAiRequest, evaluateItemWithAi } from '../services/aiService';
import { storageService } from '../services/storageService';

interface AiBorrowingAssistantProps {
  items: BmnItem[];
  currentUser: UserProfile;
  initialItemsToDraft?: BmnItem[];
  onLoanCreatedSuccess?: (loan: LoanRequest) => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  timestamp: string;
  parsedDraft?: AiParsedRequest;
  isDraftSubmitted?: boolean;
}

export const AiBorrowingAssistant: React.FC<AiBorrowingAssistantProps> = ({
  items,
  currentUser,
  initialItemsToDraft,
  onLoanCreatedSuccess,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-init',
      sender: 'agent',
      text: `Halo ${currentUser.name}! 👋 Saya **SIMBA AI Agent**, asisten cerdas peminjaman dan pemantauan Barang Milik Negara (BMN) **BLSDM Komdigi Jakarta**.\n\n✨ **Kemampuan Baru AI Agent:**\n1. **Peminjaman Cerdas & Interaktif:** Anda cukup sebutkan *"kamera sony"*, saya akan memberikan pilihan model kamera yang tersedia untuk Anda pilih langsung!\n2. **Akurasi Tanggal & Waktu:** Sebutkan *"besok"*, *"lusa"*, atau tanggal spesifik seperti *"18 Oktober 2026 jam 09.00-16.00"*.\n3. **Penilaian Kelayakan BMN:** Tanyakan kondisi & kelayakan barang apa pun (contoh: *"Nilai kamera Sony A7 IV"*).\n4. **Rekomendasi Paket Pelatihan:** Minta saran paket peralatan untuk kelas bootcamp DTS atau rekaman e-learning.`,
      timestamp: 'Baru saja',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedItemForEval, setSelectedItemForEval] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const samplePrompts = [
    'Pinjam kamera sony besok jam 09.00 sampai 16.00',
    'Pinjam Sony FX3 dan Rode Mic tanggal 18 Oktober 2026 jam 08.30-16.00 untuk rekaman modul e-learning',
    'Nilai kondisi dan kelayakan kamera Sony Alpha 7 IV',
    'Sarankan paket peralatan untuk pelatihan DTS kelas coding hybrid',
    'Kamera apa yang tersedia hari ini?',
    'Siapa yang sedang meminjam lensa 24-70mm?',
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    if (initialItemsToDraft && initialItemsToDraft.length > 0) {
      const names = initialItemsToDraft.map((i) => i.name).join(' dan ');
      const autoPrompt = `Pinjam ${names} besok jam 09.00 sampai 16.00 untuk kegiatan pelatihan BLSDM Komdigi Jakarta`;
      setInputText(autoPrompt);
    }
  }, [initialItemsToDraft]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query || isLoading) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const isLendingQuery =
        query.toLowerCase().startsWith('pinjam') ||
        query.toLowerCase().startsWith('butuh') ||
        query.toLowerCase().includes('buatkan draf') ||
        query.toLowerCase().includes('ingin meminjam') ||
        query.toLowerCase().includes('kamera sony') ||
        query.toLowerCase().includes('pinjam');

      const response = await processAiRequest(
        query,
        items,
        isLendingQuery ? 'parse_intent' : 'chat'
      );

      const agentMsg: ChatMessage = {
        id: `agent-${Date.now()}`,
        sender: 'agent',
        text: response.text,
        parsedDraft: response.parsedIntent,
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
      };

      setMessages((prev) => [...prev, agentMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'agent',
          text: 'Maaf, terjadi kendala saat memproses permintaan Anda. Silakan coba lagi.',
          timestamp: 'Baru saja',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // User chooses an item from the clarification options (e.g. Sony Alpha 7 IV vs FX3)
  const handleSelectClarificationItem = (item: BmnItem, prevDraft?: AiParsedRequest) => {
    const startDate = prevDraft?.startDate || new Date().toISOString().split('T')[0];
    const startTime = prevDraft?.startTime || '09:00';
    const endDate = prevDraft?.endDate || startDate;
    const endTime = prevDraft?.endTime || '16:00';
    const purpose = prevDraft?.purpose || 'Peliputan kegiatan kedinasan BLSDM Komdigi Jakarta';
    const purposeCategory = prevDraft?.purposeCategory || 'Peliputan Pelatihan Digital';

    const chosenPrompt = `Pinjam ${item.name} pada tanggal ${startDate} pukul ${startTime} sampai ${endTime} WIB untuk ${purpose}`;

    // Directly process with that concrete item
    handleSendMessage(chosenPrompt);
  };

  const handleConfirmDraftSubmission = (messageId: string, draft: AiParsedRequest) => {
    if (!draft.detectedItems || draft.detectedItems.length === 0) return;

    const itemIds = draft.detectedItems
      .map((d) => items.find((i) => i.id === d.matchedId || i.name === d.name)?.id)
      .filter(Boolean) as string[];

    if (itemIds.length === 0) {
      alert('Barang tidak ditemukan dalam inventaris aktif.');
      return;
    }

    const res = storageService.createLoan({
      borrower: currentUser,
      itemIds,
      purpose: draft.purpose || 'Peliputan kegiatan kedinasan BLSDM Komdigi Jakarta',
      purposeCategory: draft.purposeCategory || 'Peliputan Pelatihan Digital',
      startDate: draft.startDate || new Date().toISOString().split('T')[0],
      startTime: draft.startTime || '09:00',
      plannedEndDate: draft.endDate || draft.startDate || new Date().toISOString().split('T')[0],
      plannedEndTime: draft.endTime || '17:00',
    });

    if (res.success && res.loan) {
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, isDraftSubmitted: true } : m))
      );

      setMessages((prev) => [
        ...prev,
        {
          id: `succ-${Date.now()}`,
          sender: 'agent',
          text: `🎉 **Pengajuan Berhasil Dikirimkan!**\nNomor Tiket: **\`${res.loan?.ticketNumber}\`**.\nNotifikasi telah diteruskan secara otomatis ke PIC BMN (**${res.loan?.picName}**). Anda dapat memantau status persetujuan di tab Antrean & Riwayat.`,
          timestamp: 'Baru saja',
        },
      ]);

      if (onLoanCreatedSuccess && res.loan) {
        onLoanCreatedSuccess(res.loan);
      }
    } else {
      alert(res.error || 'Gagal mengirimkan pengajuan peminjaman.');
    }
  };

  // Quick AI Item Evaluation trigger
  const handleTriggerQuickEvaluation = (itemId: string) => {
    const item = items.find((i) => i.id === itemId);
    if (!item) return;
    handleSendMessage(`Nilai kelayakan barang ${item.name}`);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-blue-950 rounded-2xl p-6 text-white border border-indigo-900/60 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold mb-2 border border-indigo-400/30">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              AI Agent BMN BLSDM Komdigi Jakarta
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
              SIMBA AI Intelligent Assistant & Evaluator
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Ajukan permohonan peminjaman dalam bahasa alami, dapatkan opsi pilihan jika menyebutkan nama umum (misal: "kamera sony"),
              atau minta penilaian kelayakan fisik & rekomendasi paket peralatan pelatihan digital.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 text-[11px] space-y-1 text-slate-300">
            <div className="font-bold text-white flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              <span>Batasan AI (PRD Sec. 10):</span>
            </div>
            <div>• Tidak dapat auto-approve (Wewenang PIC)</div>
            <div>• Wajib konfirmasi pengguna sebelum kirim</div>
            <div>• Dilarang mengarang informasi inventaris</div>
          </div>
        </div>
      </div>

      {/* AI Agent Quick Tool: Evaluasi Cepat & Rekomendasi */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-700 font-bold">
          <BarChart3 className="w-4 h-4 text-indigo-600" />
          <span>Minta Penilaian & Analisis Kelayakan AI:</span>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={selectedItemForEval}
            onChange={(e) => {
              setSelectedItemForEval(e.target.value);
              if (e.target.value) {
                handleTriggerQuickEvaluation(e.target.value);
              }
            }}
            className="flex-1 md:flex-initial bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          >
            <option value="">-- Pilih Barang untuk Dinilai AI --</option>
            {items.map((it) => (
              <option key={it.id} value={it.id}>
                {it.name} ({it.category})
              </option>
            ))}
          </select>
          <button
            onClick={() => handleSendMessage('Sarankan paket peralatan untuk pelatihan DTS kelas coding hybrid')}
            className="px-3 py-2 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 font-bold whitespace-nowrap transition"
          >
            💡 Rekomendasi Paket DTS
          </button>
        </div>
      </div>

      {/* Quick Prompt Chips */}
      <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-sm">
        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <MessageSquare className="w-3.5 h-3.5 text-blue-500" />
          <span>Skenario Pertanyaan Cepat (Quick Prompts):</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {samplePrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(prompt)}
              className="text-left text-xs bg-slate-50 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700 transition"
            >
              "{prompt}"
            </button>
          ))}
        </div>
      </div>

      {/* Main Chat Box */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[560px] overflow-hidden">
        {/* Chat History */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-slate-50/50">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-3xl ${
                msg.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
              }`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-white font-bold text-xs ${
                  msg.sender === 'user' ? 'bg-blue-600' : 'bg-gradient-to-tr from-indigo-600 to-purple-600'
                }`}
              >
                {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Bubble */}
              <div className="space-y-3 max-w-xl">
                <div
                  className={`p-4 rounded-2xl text-xs leading-relaxed shadow-sm ${
                    msg.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-none'
                      : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
                  }`}
                >
                  <div className="whitespace-pre-line">{msg.text}</div>
                  <div
                    className={`text-[9px] mt-1.5 text-right ${
                      msg.sender === 'user' ? 'text-blue-200' : 'text-slate-400'
                    }`}
                  >
                    {msg.timestamp}
                  </div>
                </div>

                {/* Clarification Options Card: When multiple items match (e.g. "kamera sony" => Sony A7 IV vs FX3) */}
                {msg.parsedDraft?.needsClarification && msg.parsedDraft.clarificationItems && (
                  <div className="bg-white rounded-2xl p-4 border-2 border-indigo-200 shadow-md text-xs space-y-3 animate-in fade-in duration-200">
                    <div className="flex items-center gap-2 text-indigo-900 font-bold border-b border-indigo-100 pb-2">
                      <Sparkles className="w-4 h-4 text-indigo-600" />
                      <span>{msg.parsedDraft.clarificationPrompt || 'Silakan pilih model peralatan yang diinginkan:'}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {msg.parsedDraft.clarificationItems.map((opt) => (
                        <div
                          key={opt.id}
                          className="p-3 rounded-xl border border-slate-200 hover:border-indigo-400 hover:shadow-sm bg-slate-50 transition flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-bold text-slate-900 text-xs">{opt.name}</span>
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                                  opt.status === 'TERSEDIA'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                                }`}
                              >
                                {opt.status}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 mb-2">{opt.brandModel}</p>
                            <p className="text-[10px] text-slate-600 line-clamp-2 mb-3 bg-white p-1.5 rounded border border-slate-100">
                              {opt.specifications}
                            </p>
                          </div>

                          <button
                            onClick={() => handleSelectClarificationItem(opt, msg.parsedDraft)}
                            className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-sm"
                          >
                            <span>Pilih {opt.name.split(' ')[1] || opt.name}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Interactive Confirmation Draft Card */}
                {msg.parsedDraft && !msg.parsedDraft.needsClarification && msg.parsedDraft.detectedItems && msg.parsedDraft.detectedItems.length > 0 && (
                  <div className="bg-white rounded-2xl p-4 border-2 border-indigo-200 shadow-md text-xs space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-indigo-100">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping"></span>
                        <span className="font-bold text-indigo-950 text-xs">
                          Draf Formulir Peminjaman BMN Terverifikasi
                        </span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {msg.parsedDraft.purposeCategory}
                      </span>
                    </div>

                    {/* Detected Items (No BMN code) */}
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                        Barang BMN Terdeteksi:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.parsedDraft.detectedItems.map((item, i) => (
                          <span
                            key={i}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 border ${
                              item.isAvailable !== false
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : 'bg-rose-50 text-rose-800 border-rose-200'
                            }`}
                          >
                            <span>{item.name}</span>
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Schedule with inline editable inputs for 100% precision */}
                    <div className="p-3 bg-slate-50 rounded-xl space-y-2 text-[11px] border border-slate-100">
                      <div className="flex items-center justify-between text-slate-500 font-bold uppercase text-[10px]">
                        <span>Jadwal Peminjaman (Terverifikasi Akurat)</span>
                        <span className="text-indigo-600 normal-case font-normal">*Dapat disesuaikan langsung</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-slate-400 block text-[10px] mb-0.5">Tanggal & Jam Mulai:</label>
                          <div className="flex items-center gap-1">
                            <input
                              type="date"
                              value={msg.parsedDraft.startDate || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                setMessages((prev) =>
                                  prev.map((m) =>
                                    m.id === msg.id && m.parsedDraft
                                      ? { ...m, parsedDraft: { ...m.parsedDraft, startDate: val } }
                                      : m
                                  )
                                );
                              }}
                              className="w-full bg-white border border-slate-200 rounded px-1.5 py-1 text-slate-800 font-bold text-xs"
                            />
                            <input
                              type="time"
                              value={msg.parsedDraft.startTime || '09:00'}
                              onChange={(e) => {
                                const val = e.target.value;
                                setMessages((prev) =>
                                  prev.map((m) =>
                                    m.id === msg.id && m.parsedDraft
                                      ? { ...m, parsedDraft: { ...m.parsedDraft, startTime: val } }
                                      : m
                                  )
                                );
                              }}
                              className="bg-white border border-slate-200 rounded px-1.5 py-1 text-slate-800 font-bold text-xs"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-slate-400 block text-[10px] mb-0.5">Rencana Kembali:</label>
                          <div className="flex items-center gap-1">
                            <input
                              type="date"
                              value={msg.parsedDraft.endDate || msg.parsedDraft.startDate || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                setMessages((prev) =>
                                  prev.map((m) =>
                                    m.id === msg.id && m.parsedDraft
                                      ? { ...m, parsedDraft: { ...m.parsedDraft, endDate: val } }
                                      : m
                                  )
                                );
                              }}
                              className="w-full bg-white border border-slate-200 rounded px-1.5 py-1 text-slate-800 font-bold text-xs"
                            />
                            <input
                              type="time"
                              value={msg.parsedDraft.endTime || '16:00'}
                              onChange={(e) => {
                                const val = e.target.value;
                                setMessages((prev) =>
                                  prev.map((m) =>
                                    m.id === msg.id && m.parsedDraft
                                      ? { ...m, parsedDraft: { ...m.parsedDraft, endTime: val } }
                                      : m
                                  )
                                );
                              }}
                              className="bg-white border border-slate-200 rounded px-1.5 py-1 text-slate-800 font-bold text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Interactive Purpose & Category Customization Section (Penyesuaian Sendiri Terkait Keperluan) */}
                    <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-200 text-[11px] space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 font-bold text-blue-950 text-xs">
                          <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                          <span>Penyesuaian Mandiri Terkait Keperluan Peminjaman:</span>
                        </div>
                        <span className="text-[10px] text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded font-semibold">
                          Dapat Disesuaikan Sendiri
                        </span>
                      </div>

                      {/* Purpose Category Selector */}
                      <div>
                        <label className="text-slate-600 font-semibold block text-[10px] mb-1">
                          Kategori Keperluan Kegiatan:
                        </label>
                        <select
                          value={msg.parsedDraft.purposeCategory || 'Peliputan Pelatihan Digital'}
                          onChange={(e) => {
                            const val = e.target.value as any;
                            setMessages((prev) =>
                              prev.map((m) =>
                                m.id === msg.id && m.parsedDraft
                                  ? { ...m, parsedDraft: { ...m.parsedDraft, purposeCategory: val } }
                                  : m
                              )
                            );
                          }}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="Peliputan Pelatihan Digital">Peliputan Pelatihan Digital (DTS, FGA, VSGA, DLA)</option>
                          <option value="Produksi Modul E-Learning">Produksi Modul E-Learning Talenta Digital</option>
                          <option value="Dokumentasi Sertifikasi Kompetensi">Dokumentasi Sertifikasi Kompetensi Asesi</option>
                          <option value="Webinar & Live Workshop">Webinar & Live Workshop Digital</option>
                          <option value="Uji Lab & Bootcamp Talenta Digital">Uji Lab & Bootcamp Talenta Digital</option>
                        </select>
                      </div>

                      {/* Editable Purpose Textarea */}
                      <div>
                        <label className="text-slate-600 font-semibold block text-[10px] mb-1">
                          Uraian Rincian Keperluan Kedinasan BLSDM Komdigi Jakarta:
                        </label>
                        <textarea
                          rows={2}
                          value={msg.parsedDraft.purpose || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setMessages((prev) =>
                              prev.map((m) =>
                                m.id === msg.id && m.parsedDraft
                                  ? { ...m, parsedDraft: { ...m.parsedDraft, purpose: val } }
                                  : m
                              )
                            );
                          }}
                          placeholder="Ketik rincian agenda atau pilih template preset di bawah..."
                          className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-800 text-xs leading-snug focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      {/* Quick Purpose Presets */}
                      <div>
                        <span className="text-[10px] text-slate-500 block mb-1">Pilihan Cepat Template Keperluan:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            { label: '🎓 Peliputan DTS FGA', cat: 'Peliputan Pelatihan Digital', text: 'Peliputan dan dokumentasi sesi kelas Digital Talent Scholarship (DTS) Fresh Graduate Academy di BLSDM Komdigi Jakarta.' },
                            { label: '📹 Modul Video AI & Cyber', cat: 'Produksi Modul E-Learning', text: 'Produksi rekaman video pembelajaran modul kurikulum Artificial Intelligence dan Cyber Security di studio multimedia.' },
                            { label: '📝 Uji Sertifikasi Asesi', cat: 'Dokumentasi Sertifikasi Kompetensi', text: 'Dokumentasi dan pengawasan ujian sertifikasi talenta digital di lingkungan BLSDM Komdigi Jakarta.' },
                            { label: '🎙️ Live Webinar Komdigi', cat: 'Webinar & Live Workshop', text: 'Siaran langsung dan live switching webinar nasional pengembangan SDM digital Kementerian Komunikasi dan Digital.' },
                          ].map((preset, pIdx) => (
                            <button
                              key={pIdx}
                              type="button"
                              onClick={() => {
                                setMessages((prev) =>
                                  prev.map((m) =>
                                    m.id === msg.id && m.parsedDraft
                                      ? { ...m, parsedDraft: { ...m.parsedDraft, purpose: preset.text, purposeCategory: preset.cat as any } }
                                      : m
                                  )
                                );
                              }}
                              className="text-[10px] bg-white hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300 border border-slate-200 rounded-md px-2 py-1 text-slate-700 font-medium transition"
                            >
                              {preset.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Action Confirmation Button */}
                    <div className="pt-1 flex items-center justify-between">
                      <span className="text-[10px] text-slate-500 italic">
                        *Klik tombol konfirmasi untuk meneruskan ke PIC BMN.
                      </span>

                      {msg.isDraftSubmitted ? (
                        <div className="inline-flex items-center gap-1.5 text-emerald-700 font-bold bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                          <Check className="w-3.5 h-3.5" />
                          <span>Pengajuan Telah Dikirim</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleConfirmDraftSubmission(msg.id, msg.parsedDraft!)}
                          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition"
                        >
                          <span>Kirim Pengajuan Resmi Ini</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 max-w-lg items-center text-xs text-slate-500 bg-white p-3 rounded-2xl border border-slate-200 w-fit">
              <Sparkles className="w-4 h-4 text-indigo-500 animate-spin" />
              <span>SIMBA AI sedang menganalisis ketersediaan inventaris BMN...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-white border-t border-slate-200">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Contoh: 'kamera sony' atau 'Pinjam Sony FX3 tanggal 18 Oktober 2026 jam 09.00-16.00'..."
              className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-200 text-white font-bold text-xs shadow-md shadow-indigo-600/20 flex items-center gap-1.5 transition"
            >
              <span>Kirim</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
