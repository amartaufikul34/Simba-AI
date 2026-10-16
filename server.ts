import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// Initialize GoogleGenAI server-side if key is available
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    aiEnabled: Boolean(apiKey),
    app: 'SIMBA AI - BMN BLSDM Komdigi Jakarta',
  });
});

// Endpoint for AI Agent (Natural language parser & Status assistant)
app.post('/api/ai/process', async (req, res) => {
  try {
    const { message, contextData, mode } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // If Gemini API is available, invoke gemini-3.8-flash with system instructions
    if (ai) {
      const now = new Date();
      const currentDateStr = now.toISOString().split('T')[0];
      const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      const dayName = days[now.getDay()];

      const systemInstruction = `Anda adalah AI Agent SIMBA (Sistem Peminjaman & Pemantauan Barang Milik Negara) pada BLSDM Komdigi Jakarta (Balai Pengembangan Sumber Daya Manusia dan Penelitian Komunikasi dan Digital Jakarta - Kementerian Komunikasi dan Digital).
WAKTU & TANGGAL SAAT INI SEBAGAI ACUAN: ${currentDateStr} (Hari ${dayName}).

ATURAN KETAT & BATASAN:
1. Konteks Anda HANYA dan WAJIB seputar pengembangan sumber daya manusia di bidang digital pada BLSDM Komdigi Jakarta (seperti pelatihan Digital Talent Scholarship DTS, FGA, VSGA, DEA, rekam modul e-learning talenta digital, dokumentasi pelatihan AI & Cyber Security, uji sertifikasi kompetensi).
2. Anda TIDAK BOLEH menyetujui, menolak, atau mengubah status peminjaman secara mandiri. Keputusan hanya oleh PIC BMN.
3. Anda TIDAK BOLEH mengirimkan pengajuan tanpa konfirmasi peminjam.
4. Anda TIDAK BOLEH mengarang informasi ketersediaan. Gunakan data barang yang diberikan.
5. Gunakan Bahasa Indonesia yang resmi, ramah, ringkas, dan jelas. Dilarang memunculkan kode BMN atau nomor NIP.
6. FITUR DISAMBIGUASI BARANG (Sangat Penting): Jika pengguna hanya menyebutkan nama umum seperti "kamera sony", "kamera", "audio", "mic", "laptop", "drone" dan ada lebih dari 1 pilihan barang yang cocok di inventaris, JANGAN langsung memilihkan satu barang secara sepihak. Berikan opsi pilihan yang tersedia agar pengguna dapat memilih mana yang sesuai dengan kebutuhannya.
7. PENULISAN TANGGAL: Hitung tanggal secara akurat berdasarkan tanggal acuan (${currentDateStr}). "Besok" adalah 1 hari setelah hari ini, "lusa" adalah 2 hari setelah hari ini. Jika pengguna menyebutkan hari tertentu (misal: "hari Jumat", "hari Senin") atau tanggal spesifik (misal: "18 Oktober 2026", "20/10/2026"), konversikan secara tepat ke format ISO YYYY-MM-DD.
8. FITUR PENILAIAN & SARAN AI: Bila pengguna meminta saran, rekomendasi kombinasi barang pelatihan, atau penilaian kelayakan barang, berikan penilaian objektif berdasarkan kondisi fisik, tingkat kesehatan (%), frekuensi pemakaian, dan saran apakah barang tersebut "Sangat Layak Pakai", "Perlu Servis Rutin", atau "Tidak Layak Pakai".

Tugas Anda:
- Mode "parse_intent": Pengguna ingin meminjam barang dengan bahasa alami.
Jika pengguna menyebutkan barang umum seperti "kamera sony" dan terdapat beberapa barang cocok, kembalikan:
{
  "isLendingIntent": true,
  "needsClarification": true,
  "clarificationPrompt": "Di BLSDM Komdigi Jakarta tersedia beberapa kamera Sony. Silakan pilih salah satu kamera yang ingin digunakan:",
  "summary": "Terdapat beberapa pilihan kamera Sony di inventaris. Silakan pilih salah satu untuk melanjutkan draf pengajuan."
}
Jika barang dan tanggal sudah jelas:
{
  "isLendingIntent": true,
  "needsClarification": false,
  "detectedItems": [{"name": string}],
  "startDate": "YYYY-MM-DD",
  "startTime": "HH:mm",
  "endDate": "YYYY-MM-DD",
  "endTime": "HH:mm",
  "purpose": "keperluan dalam konteks BLSDM Komdigi Jakarta",
  "summary": "Ringkasan konfirmasi peminjaman untuk diverifikasi pengguna"
}

- Mode "chat": Jawab pertanyaan ketersediaan, peminjam aktif, saran kombinasi barang, atau penilaian kondisi barang BMN secara komprehensif.`;

      const prompt = `Data Inventaris Saat Ini: ${JSON.stringify(contextData || [])}
Tanggal Hari Ini: ${currentDateStr} (${dayName})
Mode: ${mode || 'chat'}
Pesan Pengguna: ${message}

Responlah sesuai instruksi. Jika mode adalah "parse_intent", berikan JSON murni.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.2,
          ...(mode === 'parse_intent' ? { responseMimeType: 'application/json' } : {}),
        },
      });

      const responseText = response.text || '';
      return res.json({
        success: true,
        reply: responseText,
        source: 'gemini-3.8-flash',
      });
    }

    // Fallback if API key is not yet set
    return res.json({
      success: false,
      reply: null,
      source: 'local-fallback-required',
    });
  } catch (error: any) {
    console.error('AI Processing Error:', error);
    res.status(500).json({
      error: 'Gagal memproses permintaan AI',
      details: error.message,
    });
  }
});

async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SIMBA AI Server running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Server failed to start:', err);
});
