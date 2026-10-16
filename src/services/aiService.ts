import { BmnItem, AiParsedRequest } from '../types/simba';

export async function processAiRequest(
  message: string,
  items: BmnItem[],
  mode: 'parse_intent' | 'chat' = 'chat'
): Promise<{ text: string; parsedIntent?: AiParsedRequest; source: 'gemini-3.8-flash' | 'local-nlp-engine' }> {
  try {
    const res = await fetch('/api/ai/process', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        contextData: items.map((i) => ({
          id: i.id,
          nama: i.name,
          brandModel: i.brandModel,
          kategori: i.category,
          status: i.status,
          kondisi: i.condition,
          lokasi: i.storageLocation,
          peminjamSaatIni: i.currentBorrowerName || null,
          rencanaKembali: i.estimatedReturnTime || null,
          pic: i.picName,
          healthPercentage: i.healthPercentage || 95,
          totalBorrowCount: i.totalBorrowCount || 1,
        })),
        mode,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.reply) {
        if (mode === 'parse_intent') {
          try {
            const parsed = JSON.parse(data.reply);
            // Verify if clarification is needed from Gemini response or fallback to local
            if (parsed.needsClarification) {
              const matchingItems = items.filter((i) =>
                message.toLowerCase().includes('sony')
                  ? i.brandModel.toLowerCase().includes('sony') || i.name.toLowerCase().includes('sony')
                  : i.category.toLowerCase().includes(message.toLowerCase())
              );
              parsed.clarificationItems = matchingItems.length > 0 ? matchingItems : items.slice(0, 3);
            }
            return {
              text: parsed.summary || parsed.clarificationPrompt || 'Draf pengajuan peminjaman berhasil dipersiapkan.',
              parsedIntent: parsed,
              source: 'gemini-3.8-flash',
            };
          } catch {
            // If json parse failed, fall through to local parser
          }
        } else {
          return {
            text: data.reply,
            source: 'gemini-3.8-flash',
          };
        }
      }
    }
  } catch (err) {
    console.warn('Backend AI route failed or key missing, using intelligent local engine:', err);
  }

  // High-performance intelligent local NLP engine
  return runLocalAiEngine(message, items, mode);
}

// Helper: Parse Indonesian Date and Time with high accuracy
function parseIndonesianDateAndTime(query: string) {
  const today = new Date();
  const formatDate = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  let startDate = formatDate(today);
  let endDate = formatDate(today);
  const lower = query.toLowerCase();

  // Day offsets
  if (lower.includes('besok lusa')) {
    const d = new Date(today);
    d.setDate(today.getDate() + 2);
    startDate = formatDate(d);
    endDate = formatDate(d);
  } else if (lower.includes('besok')) {
    const d = new Date(today);
    d.setDate(today.getDate() + 1);
    startDate = formatDate(d);
    endDate = formatDate(d);
  } else if (lower.includes('lusa')) {
    const d = new Date(today);
    d.setDate(today.getDate() + 2);
    startDate = formatDate(d);
    endDate = formatDate(d);
  } else if (lower.includes('minggu depan')) {
    const d = new Date(today);
    d.setDate(today.getDate() + 7);
    startDate = formatDate(d);
    endDate = formatDate(d);
  } else {
    // Weekday check: senin, selasa, rabu, kamis, jumat, sabtu, minggu
    const dayMap: { [key: string]: number } = {
      minggu: 0,
      senin: 1,
      selasa: 2,
      rabu: 3,
      kamis: 4,
      jumat: 5,
      sabtu: 6,
    };
    for (const [dayName, targetDayNum] of Object.entries(dayMap)) {
      if (lower.includes(`hari ${dayName}`) || lower.includes(` ${dayName}`)) {
        const currentDayNum = today.getDay();
        let diff = targetDayNum - currentDayNum;
        if (diff <= 0) diff += 7; // next occurrence
        const targetDate = new Date(today);
        targetDate.setDate(today.getDate() + diff);
        startDate = formatDate(targetDate);
        endDate = formatDate(targetDate);
        break;
      }
    }
  }

  // Indonesian Month names: e.g. "18 Oktober 2026", "20 okt", "18 sampai 20 oktober"
  const monthMap: { [key: string]: number } = {
    januari: 0, jan: 0,
    februari: 1, feb: 1,
    maret: 2, mar: 2,
    april: 3, apr: 3,
    mei: 4,
    juni: 5, jun: 5,
    juli: 6, jul: 6,
    agustus: 7, ags: 7, agu: 7,
    september: 8, sep: 8,
    oktober: 9, okt: 9,
    november: 10, nov: 10,
    desember: 11, des: 11,
  };

  // Date range detection: e.g. "18 sampai 20 oktober 2026" or "18 - 20 oktober"
  const rangeMatch = lower.match(
    /(\d{1,2})\s*(?:sampai|-|s\/d|hingga)\s*(\d{1,2})\s+(januari|februari|maret|april|mei|juni|juli|agustus|september|oktober|november|desember|jan|feb|mar|apr|mei|jun|jul|ags|agu|sep|okt|nov|des)\s*(\d{4})?/
  );
  if (rangeMatch) {
    const startDay = parseInt(rangeMatch[1], 10);
    const endDay = parseInt(rangeMatch[2], 10);
    const mName = rangeMatch[3];
    const month = monthMap[mName];
    const year = rangeMatch[4] ? parseInt(rangeMatch[4], 10) : today.getFullYear();
    if (month !== undefined) {
      const sDate = new Date(year, month, startDay);
      const eDate = new Date(year, month, endDay);
      startDate = formatDate(sDate);
      endDate = formatDate(eDate);
    }
  } else {
    // Single explicit date: "18 oktober 2026", "25 november", "tanggal 20 oktober"
    const singleDateMatch = lower.match(
      /(?:tanggal\s+)?(\d{1,2})\s+(januari|februari|maret|april|mei|juni|juli|agustus|september|oktober|november|desember|jan|feb|mar|apr|mei|jun|jul|ags|agu|sep|okt|nov|des)\s*(\d{4})?/
    );
    if (singleDateMatch) {
      const day = parseInt(singleDateMatch[1], 10);
      const mName = singleDateMatch[2];
      const month = monthMap[mName];
      const year = singleDateMatch[3] ? parseInt(singleDateMatch[3], 10) : today.getFullYear();
      if (month !== undefined) {
        const d = new Date(year, month, day);
        startDate = formatDate(d);
        endDate = formatDate(d);
      }
    } else {
      // Numerical format DD/MM/YYYY or YYYY-MM-DD
      const numDateMatch = lower.match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/) || lower.match(/(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})/);
      if (numDateMatch) {
        if (numDateMatch[1].length === 4) {
          startDate = `${numDateMatch[1]}-${numDateMatch[2].padStart(2, '0')}-${numDateMatch[3].padStart(2, '0')}`;
          endDate = startDate;
        } else {
          const year = numDateMatch[3].length === 2 ? `20${numDateMatch[3]}` : numDateMatch[3];
          startDate = `${year}-${numDateMatch[2].padStart(2, '0')}-${numDateMatch[1].padStart(2, '0')}`;
          endDate = startDate;
        }
      } else {
        const justDate = lower.match(/tanggal\s+(\d{1,2})/);
        if (justDate) {
          const day = parseInt(justDate[1], 10);
          const d = new Date(today.getFullYear(), today.getMonth(), day);
          startDate = formatDate(d);
          endDate = formatDate(d);
        }
      }
    }
  }

  // Parse Times accurately
  let startTime = '09:00';
  let endTime = '16:00';

  const timeRangeMatch = query.match(/(\d{1,2})[.:](\d{2})\s*(?:-|sampai|s\/d|hingga)\s*(\d{1,2})[.:](\d{2})/i);
  if (timeRangeMatch) {
    startTime = `${timeRangeMatch[1].padStart(2, '0')}:${timeRangeMatch[2]}`;
    endTime = `${timeRangeMatch[3].padStart(2, '0')}:${timeRangeMatch[4]}`;
  } else {
    const hourRangeMatch = query.match(/jam\s+(\d{1,2})\s*(?:-|sampai|s\/d|hingga)\s*(\d{1,2})/i);
    if (hourRangeMatch) {
      let startH = parseInt(hourRangeMatch[1], 10);
      let endH = parseInt(hourRangeMatch[2], 10);
      if (lower.includes('siang') || lower.includes('sore')) {
        if (startH < 12 && startH >= 1) startH += 12;
        if (endH < 12 && endH >= 1) endH += 12;
      }
      startTime = `${String(startH).padStart(2, '0')}:00`;
      endTime = `${String(endH).padStart(2, '0')}:00`;
    } else {
      const simpleTimes = query.match(/(\d{1,2})[.:](\d{2})/g);
      if (simpleTimes && simpleTimes.length >= 2) {
        startTime = simpleTimes[0].replace('.', ':').padStart(5, '0');
        endTime = simpleTimes[1].replace('.', ':').padStart(5, '0');
      } else if (simpleTimes && simpleTimes.length === 1) {
        startTime = simpleTimes[0].replace('.', ':').padStart(5, '0');
        endTime = '17:00';
      }
    }
  }

  return { startDate, endDate, startTime, endTime };
}

function runLocalAiEngine(
  query: string,
  items: BmnItem[],
  mode: 'parse_intent' | 'chat'
): { text: string; parsedIntent?: AiParsedRequest; source: 'local-nlp-engine' } {
  const lower = query.toLowerCase();

  // Strict Rule Check #1: AI cannot approve or modify loans itself (Section 10 PRD)
  if (
    lower.includes('setujui') ||
    lower.includes('approve') ||
    lower.includes('acc pinjaman') ||
    lower.includes('langsung setujui')
  ) {
    return {
      text: '⚠️ **Batasan Kewenangan AI (Section 10 PRD - Aturan #1):**\nSesuai SOP penatausahaan BMN BLSDM Komdigi Jakarta, AI Agent **dilarang keras menyetujui, menolak, atau mengubah status peminjaman secara mandiri**. Hak persetujuan mutlak berada pada **PIC BMN (Bambang Haryanto, S.Sos.)**. Silakan ajukan draf peminjaman resmi agar PIC menerima notifikasi persetujuan di aplikasi.',
      source: 'local-nlp-engine',
    };
  }

  // Strict Rule Check #2: Personal / Non-dinas usage rejection (Section 10 PRD)
  if (
    lower.includes('pribadi') ||
    lower.includes('liburan') ||
    lower.includes('jalan-jalan') ||
    lower.includes('pantai') ||
    lower.includes('nikahan') ||
    lower.includes('rekreasi')
  ) {
    return {
      text: '⛔ **Penolakan Kebijakan BMN (Section 10 PRD - Aturan #5):**\nBarang Milik Negara (BMN) BLSDM Komdigi Jakarta **hanya boleh dipinjam untuk keperluan kedinasan resmi pengembangan talenta digital** (seperti peliputan pelatihan coding, produksi modul e-learning, dokumentasi sertifikasi talenta digital, atau workshop). Peminjaman untuk kepentingan pribadi tidak diperbolehkan.',
      source: 'local-nlp-engine',
    };
  }

  // Strict Rule Check #3: Delete history rejection (Section 10 PRD)
  if (lower.includes('hapus') && (lower.includes('riwayat') || lower.includes('catatan') || lower.includes('log') || lower.includes('pinjam-'))) {
    return {
      text: '🔒 **Prinsip Auditabilitas Permanen (NFR-05 & Batasan #4):**\nSistem SIMBA AI **tidak mengizinkan penghapusan atau modifikasi riwayat peminjaman yang sudah tercatat**. Seluruh jejak audit dan status transaksi tersimpan permanen demi akuntabilitas penatausahaan BMN negara.',
      source: 'local-nlp-engine',
    };
  }

  // AI Feature: Penilaian / Evaluasi Kelayakan Barang
  if (
    lower.includes('nilai barang') ||
    lower.includes('penilaian') ||
    lower.includes('kelayakan') ||
    lower.includes('kondisi kamera') ||
    lower.includes('apakah layak') ||
    lower.includes('kondisi fisik')
  ) {
    // Find target item
    const targetItem = items.find((i) =>
      lower.includes(i.name.toLowerCase()) ||
      (i.name.includes('Alpha 7') && (lower.includes('a7') || lower.includes('sony'))) ||
      (i.name.includes('FX3') && lower.includes('fx3')) ||
      (i.name.includes('24-70mm') && lower.includes('24-70')) ||
      (i.name.includes('Wireless PRO') && lower.includes('rode')) ||
      (i.name.includes('Air 3') && lower.includes('drone'))
    ) || items[0];

    const evalResult = evaluateItemWithAi(targetItem);
    return {
      text: `📊 **Penilaian AI Agent terhadap Barang BMN: ${targetItem.name}**\n\n` +
        `• **Skor Kelayakan Pakai:** **${evalResult.score}%** (${evalResult.healthStatus === 'PRIMA' ? '🟢 KONDISI PRIMA' : evalResult.healthStatus === 'LAYAK_CATATAN' ? '🟡 LAYAK BERSYARAT' : '🔴 PERLU PERAWATAN'})\n` +
        `• **Frekuensi Peminjaman:** Telah dipinjam ${targetItem.totalBorrowCount || 1} kali di lingkungan BLSDM Komdigi Jakarta\n` +
        `• **Status Saat Ini:** ${targetItem.status} | Kondisi Fisik: ${targetItem.condition}\n` +
        `• **Analisis AI:** ${evalResult.summary}\n\n` +
        `💡 **Saran Tindakan AI Agent:**\n${evalResult.recommendation}\n\n` +
        `🎯 **Rekomendasi Pemanfaatan:**\n${evalResult.suitableTasks.map((t) => `  - ${t}`).join('\n')}`,
      source: 'local-nlp-engine',
    };
  }

  // AI Feature: Rekomendasi Paket Peralatan Pelatihan Digital
  if (
    lower.includes('rekomendasi') ||
    lower.includes('masukan') ||
    lower.includes('sarankan') ||
    lower.includes('paket pelatihan') ||
    lower.includes('kombinasi')
  ) {
    if (lower.includes('bootcamp') || lower.includes('coding') || lower.includes('dts') || lower.includes('lab')) {
      return {
        text: `💡 **Rekomendasi Paket BMN untuk Bootcamp / Pelatihan Coding Digital (DTS):**\n\n` +
          `1. **Kamera Utama:** Sony Alpha 7 IV (Untuk dokumentasi dinamis & potret peserta)\n` +
          `2. **Lensa Utama:** Sony FE 24-70mm F2.8 GM II (Fleksibel dari wide ke portrait)\n` +
          `3. **Audio:** RØDE Wireless PRO (Untuk wawancara instruktur dan peserta tanpa kabel ribet)\n` +
          `4. **Pencahayaan:** Aputure Amaran 200d S + Softbox (Pencahayaan ruang kelas terang merata)\n` +
          `5. **Workstation:** Apple MacBook Pro M3 Max (Untuk transfer & editing cepat video recap hari itu)\n\n` +
          `*Ketik "Pinjam paket bootcamp DTS besok jam 09.00 sampai 17.00" jika Anda ingin membuat draf peminjaman otomatis.*`,
        source: 'local-nlp-engine',
      };
    } else if (lower.includes('e-learning') || lower.includes('modul') || lower.includes('rekam')) {
      return {
        text: `💡 **Rekomendasi Paket BMN untuk Produksi Modul E-Learning Talenta Digital:**\n\n` +
          `1. **Kamera Sinema:** Sony FX3 Cinema Line (Kualitas video 4K jernih tanpa batas rekaman)\n` +
          `2. **Lensa:** Sony FE 24-70mm F2.8 GM II (Aperture lebar bokeh profesional)\n` +
          `3. **Audio Nirkabel:** DJI Mic 2 Wireless Microphone Set (Kapsul 32-bit float anti-clipping)\n` +
          `4. **Lighting Studio:** Aputure Amaran 200d S LED Spotlight (Pencahayaan studio standar broadcast)\n` +
          `5. **Live Switcher:** Blackmagic ATEM Mini Extreme ISO (Peralihan multi-kamera & capture slide materi)\n\n` +
          `*Ketik "Pinjam paket modul e-learning besok jam 08.30-16.00" untuk langsung menyiapkan draf permohonan.*`,
        source: 'local-nlp-engine',
      };
    }
  }

  // Check for general item queries requiring Disambiguation (e.g. "kamera sony", "kamera", "mic")
  const isGenericSonyCamera =
    (lower.includes('kamera sony') || lower.includes('sony kamera') || lower === 'kamera' || lower === 'pinjam kamera' || lower === 'pinjam sony') &&
    !lower.includes('fx3') &&
    !lower.includes('a7');

  if (isGenericSonyCamera) {
    const sonyCameras = items.filter(
      (i) => i.name.includes('Sony Alpha 7 IV') || i.name.includes('Sony FX3')
    );
    const { startDate, endDate, startTime, endTime } = parseIndonesianDateAndTime(query);

    return {
      text: `Di **BLSDM Komdigi Jakarta** tersedia 2 pilihan kamera Sony untuk produksi media & pelatihan digital:\n\n` +
        `1. **Sony Alpha 7 IV** (Kamera Mirrorless 4K Full-Frame) - Status: **${sonyCameras[0]?.status || 'TERSEDIA'}**\n` +
        `2. **Sony FX3 Cinema Line** (Kamera Sinema Full-Frame) - Status: **${sonyCameras[1]?.status || 'TERSEDIA'}**\n\n` +
        `Silakan pilih salah satu kamera di bawah ini untuk langsung memproses draf peminjaman Anda:`,
      parsedIntent: {
        isLendingIntent: true,
        needsClarification: true,
        detectedItems: [],
        clarificationPrompt: 'Silakan pilih salah satu kamera Sony yang ingin dipinjam:',
        clarificationItems: sonyCameras,
        startDate,
        startTime,
        endDate,
        endTime,
        purpose: 'Peliputan kegiatan kedinasan BLSDM Komdigi Jakarta',
        purposeCategory: 'Peliputan Pelatihan Digital',
        summary: 'Terdapat beberapa pilihan kamera Sony. Silakan pilih kamera yang diinginkan.',
        confidenceScore: 0.9,
      },
      source: 'local-nlp-engine',
    };
  }

  // General Mic query disambiguation
  const isGenericMic =
    (lower === 'mic' || lower === 'audio' || lower === 'pinjam mic' || lower === 'pinjam audio') &&
    !lower.includes('rode') &&
    !lower.includes('dji');

  if (isGenericMic) {
    const audioItems = items.filter(
      (i) => i.name.includes('RØDE Wireless PRO') || i.name.includes('DJI Mic 2')
    );
    const { startDate, endDate, startTime, endTime } = parseIndonesianDateAndTime(query);

    return {
      text: `Di **BLSDM Komdigi Jakarta** tersedia 2 paket mikrofon nirkabel profesional:\n\n` +
        `1. **RØDE Wireless PRO** - Status: **${audioItems[0]?.status || 'TERSEDIA'}**\n` +
        `2. **DJI Mic 2 Wireless Microphone Set** - Status: **${audioItems[1]?.status || 'TERSEDIA'}**\n\n` +
        `Silakan pilih mic yang ingin Anda gunakan:`,
      parsedIntent: {
        isLendingIntent: true,
        needsClarification: true,
        detectedItems: [],
        clarificationPrompt: 'Silakan pilih mikrofon yang ingin dipinjam:',
        clarificationItems: audioItems,
        startDate,
        startTime,
        endDate,
        endTime,
        purpose: 'Peliputan kegiatan kedinasan BLSDM Komdigi Jakarta',
        purposeCategory: 'Peliputan Pelatihan Digital',
        summary: 'Terdapat beberapa pilihan mikrofon profesional. Silakan pilih salah satu.',
        confidenceScore: 0.9,
      },
      source: 'local-nlp-engine',
    };
  }

  // Mode: parse_intent (Natural Language to structured cart / draft form)
  if (
    mode === 'parse_intent' ||
    lower.startsWith('pinjam') ||
    lower.startsWith('butuh') ||
    lower.includes('buatkan draf') ||
    lower.includes('ingin meminjam')
  ) {
    const detectedItems: { matchedId?: string; name: string; category?: string; isAvailable?: boolean }[] = [];
    const conflictsFound: string[] = [];

    // Match inventory keywords
    for (const item of items) {
      const nameMatch = lower.includes(item.name.toLowerCase());
      const brandMatch = lower.includes(item.brandModel.toLowerCase());

      let keywordMatch = false;
      if (item.name.includes('Alpha 7 IV') && (lower.includes('a7 iv') || lower.includes('a7iv') || lower.includes('sony a7'))) keywordMatch = true;
      if (item.name.includes('FX3') && lower.includes('fx3')) keywordMatch = true;
      if (item.name.includes('24-70mm') && (lower.includes('24-70') || lower.includes('lensa 24'))) keywordMatch = true;
      if (item.name.includes('70-200mm') && (lower.includes('70-200') || lower.includes('tele'))) keywordMatch = true;
      if (item.name.includes('Wireless PRO') && (lower.includes('rode') || lower.includes('wireless pro'))) keywordMatch = true;
      if (item.name.includes('DJI Mic') && (lower.includes('dji mic') || lower.includes('mic 2'))) keywordMatch = true;
      if (item.name.includes('Amaran') && (lower.includes('amaran') || lower.includes('lampu') || lower.includes('lighting') || lower.includes('aputure'))) keywordMatch = true;
      if (item.name.includes('RS3 Pro') && (lower.includes('rs3') || lower.includes('gimbal') || lower.includes('stabilizer'))) keywordMatch = true;
      if (item.name.includes('Air 3') && lower.includes('drone')) keywordMatch = true;
      if (item.name.includes('MacBook Pro') && (lower.includes('macbook') || lower.includes('m3 max') || lower.includes('laptop') || lower.includes('workstation'))) keywordMatch = true;
      if (item.name.includes('ATEM') && (lower.includes('atem') || lower.includes('switcher'))) keywordMatch = true;
      if (item.name.includes('Stream Deck') && (lower.includes('stream deck') || lower.includes('cam link'))) keywordMatch = true;

      if (nameMatch || brandMatch || keywordMatch) {
        if (!detectedItems.some((d) => d.name === item.name)) {
          detectedItems.push({
            matchedId: item.id,
            name: item.name,
            category: item.category,
            isAvailable: item.status === 'TERSEDIA',
          });

          if (item.status !== 'TERSEDIA') {
            conflictsFound.push(`${item.name} saat ini berstatus ${item.status}.`);
          }
        }
      }
    }

    // Accurate Indonesian Date and Time extraction
    const { startDate, endDate, startTime, endTime } = parseIndonesianDateAndTime(query);

    let purposeCategory: AiParsedRequest['purposeCategory'] = 'Peliputan Pelatihan Digital';
    if (lower.includes('modul') || lower.includes('e-learning') || lower.includes('microlearning') || lower.includes('rekam')) {
      purposeCategory = 'Produksi Modul E-Learning';
    } else if (lower.includes('sertifikasi') || lower.includes('ujikom') || lower.includes('asesor')) {
      purposeCategory = 'Dokumentasi Sertifikasi Kompetensi';
    } else if (lower.includes('webinar') || lower.includes('streaming') || lower.includes('broadcast') || lower.includes('live')) {
      purposeCategory = 'Webinar & Live Workshop';
    } else if (lower.includes('bootcamp') || lower.includes('lab') || lower.includes('coding') || lower.includes('hackathon') || lower.includes('dts')) {
      purposeCategory = 'Uji Lab & Bootcamp Talenta Digital';
    }

    const purpose =
      query.length > 15
        ? `Kegiatan BLSDM Komdigi Jakarta: ${query.replace(/^(pinjam|butuh|tolong pinjamkan)\s+/i, '')}`
        : 'Peliputan kegiatan kedinasan BLSDM Komdigi Jakarta';

    const parsed: AiParsedRequest = {
      isLendingIntent: true,
      needsClarification: false,
      detectedItems,
      startDate,
      startTime,
      endDate,
      endTime,
      purpose,
      purposeCategory,
      summary:
        detectedItems.length > 0
          ? `SIMBA AI mendeteksi permintaan peminjaman untuk ${detectedItems.length} barang (${detectedItems.map((i) => i.name).join(', ')}) pada tanggal ${startDate} pukul ${startTime} - ${endTime} WIB.`
          : 'Permintaan peminjaman terdeteksi. Silakan sebutkan nama peralatan BMN dengan jelas atau pilih dari rekomendasi.',
      confidenceScore: detectedItems.length > 0 ? 0.95 : 0.4,
      conflictsFound,
    };

    return {
      text: parsed.summary,
      parsedIntent: parsed,
      source: 'local-nlp-engine',
    };
  }

  // Mode: chat (Q&A about inventory status, borrowers, rules)
  if (lower.includes('siapa yang') || lower.includes('siapa meminjam') || lower.includes('sedang dipinjam oleh')) {
    const borrowedItems = items.filter((i) => i.status === 'DIPINJAM' || i.status === 'MENUNGGU_PERSETUJUAN');

    const matched = items.find(
      (i) =>
        lower.includes(i.name.toLowerCase()) ||
        (i.name.includes('24-70mm') && lower.includes('24-70')) ||
        (i.name.includes('Alpha 7') && (lower.includes('a7') || lower.includes('sony')))
    );

    if (matched) {
      if (matched.status === 'DIPINJAM') {
        return {
          text: `🔍 **Status Aset ${matched.name}:**\nSaat ini sedang dipinjam oleh **${matched.currentBorrowerName || 'Pegawai BLSDM Komdigi Jakarta'}**.\nPerkiraan waktu pengembalian: **${matched.estimatedReturnTime || 'Hari ini'}** ke ${matched.storageLocation}.\nNomor Tiket: \`${matched.currentLoanTicket || '-'}\`.`,
          source: 'local-nlp-engine',
        };
      } else if (matched.status === 'MENUNGGU_PERSETUJUAN') {
        return {
          text: `⏳ **Status Aset ${matched.name}:**\nSedang dalam proses antrean persetujuan PIC untuk pemohon **${matched.currentBorrowerName}** (Tiket: \`${matched.currentLoanTicket}\`).`,
          source: 'local-nlp-engine',
        };
      } else {
        return {
          text: `✅ **Barang ${matched.name} saat ini TERSEDIA** dan siap dipinjam di ${matched.storageLocation}.`,
          source: 'local-nlp-engine',
        };
      }
    }

    if (borrowedItems.length === 0) {
      return {
        text: 'Saat ini tidak ada barang BMN yang sedang dipinjam di BLSDM Komdigi Jakarta. Seluruh unit dalam kondisi siap di tempat penyimpanan.',
        source: 'local-nlp-engine',
      };
    }

    return {
      text: `Berikut daftar barang BMN BLSDM Komdigi Jakarta yang sedang aktif digunakan:\n${borrowedItems
        .map(
          (i) =>
            `• **${i.name}**: Dipinjam oleh **${i.currentBorrowerName || 'Pegawai'}** (Estimasi kembali: ${i.estimatedReturnTime || 'Segera'})`
        )
        .join('\n')}`,
      source: 'local-nlp-engine',
    };
  }

  // Camera availability question
  if (lower.includes('kamera') && (lower.includes('tersedia') || lower.includes('apa saja') || lower.includes('ada apa'))) {
    const cameras = items.filter((i) => i.category === 'Kamera');
    return {
      text: `Berikut kamera inventaris BMN di **BLSDM Komdigi Jakarta**:\n\n${cameras
        .map(
          (c) =>
            `• **${c.name}**\n  Status: **${c.status}** | Kondisi: ${c.condition} (${c.healthPercentage || 95}% Prima)\n  Lokasi: ${c.storageLocation}`
        )
        .join('\n\n')}\n\n*Anda dapat langsung meminta peminjaman atau meminta saran AI untuk kamera mana yang paling cocok.*`,
      source: 'local-nlp-engine',
    };
  }

  // General Assistant fallback
  return {
    text: `Halo! Saya **SIMBA AI Agent** untuk BLSDM Komdigi Jakarta.\n\nAnda dapat:\n1. Mengajukan peminjaman dengan menyebutkan nama barang (contoh: *"Pinjam kamera sony besok jam 09.00-16.00"*).\n2. Meminta saran peralatan untuk pelatihan (contoh: *"Sarankan paket peralatan untuk bootcamp DTS 50 peserta"*).\n3. Meminta penilaian kelayakan fisik barang (contoh: *"Nilai kondisi kamera Sony A7 IV"*).\n4. Menanyakan status ketersediaan barang apa pun di inventaris BMN.`,
    source: 'local-nlp-engine',
  };
}

// Dedicated AI Agent evaluation function
export function evaluateItemWithAi(item: BmnItem): {
  score: number;
  verdict: string;
  healthStatus: 'PRIMA' | 'LAYAK_CATATAN' | 'PERLU_PERAWATAN';
  summary: string;
  recommendation: string;
  suitableTasks: string[];
} {
  const borrowCount = item.totalBorrowCount || 1;
  const baseHealth = item.healthPercentage || 95;

  let score = baseHealth;
  if (item.status === 'DALAM_PERAWATAN') {
    score = Math.min(score, 50);
  } else if (item.condition === 'Rusak Berat') {
    score = 40;
  } else if (item.condition === 'Perlu Perawatan' || item.condition === 'Rusak Ringan') {
    score = Math.min(score, 75);
  }

  let healthStatus: 'PRIMA' | 'LAYAK_CATATAN' | 'PERLU_PERAWATAN' = 'PRIMA';
  let verdict = 'Sangat Layak Pakai (Kondisi Prima)';
  let recommendation = 'Unit dalam kondisi fisik optimal dan siap digunakan untuk agenda prioritas dinas.';

  if (score < 60 || item.status === 'DALAM_PERAWATAN') {
    healthStatus = 'PERLU_PERAWATAN';
    verdict = 'Tidak Layak Pakai (Perlu Penanganan/Servis)';
    recommendation =
      'Unit memiliki tingkat keausan signifikan atau kendala operasional. Disarankan segera masuk jadwal perawatan bengkel resmi BLSDM Komdigi Jakarta sebelum diizinkan dipinjam kembali.';
  } else if (score < 85 || borrowCount > 35) {
    healthStatus = 'LAYAK_CATATAN';
    verdict = 'Layak Pakai dengan Catatan Pemeliharaan';
    recommendation =
      'Unit masih dapat beroperasi dengan baik untuk kegiatan harian. Disarankan pembersihan optik/sensor, pembaruan firmware, atau kalibrasi berkala.';
  }

  const suitableTasks: string[] = [];
  if (item.category === 'Kamera' || item.category === 'Lensa') {
    suitableTasks.push('Dokumentasi VVIP / Pimpinan Kementerian Komdigi');
    suitableTasks.push('Produksi Video Modul E-Learning Talenta Digital');
    suitableTasks.push('Peliputan Bootcamp & Uji Kompetensi Peserta DTS');
  } else if (item.category === 'Audio & Mic') {
    suitableTasks.push('Rekaman Audio Voiceover & Microlearning');
    suitableTasks.push('Pewawancara Instrukur & Narasumber Webinar');
  } else if (item.category === 'Workstation Editing') {
    suitableTasks.push('Rendering Video Resolusi 4K ProRes');
    suitableTasks.push('Live Switching & Broadcasting Webinar Komdigi');
  } else {
    suitableTasks.push('Mendukung Pelaksanaan Pelatihan Digital di BLSDM Komdigi Jakarta');
  }

  return {
    score,
    verdict,
    healthStatus,
    summary: `Berdasarkan riwayat ${borrowCount} kali peminjaman dan inspeksi fisik terakhir (${item.condition}), unit memiliki rasio kesehatan ${score}%. ${item.usageContext}`,
    recommendation,
    suitableTasks,
  };
}
