/**
 * Robust Indonesian Date & Time Parser for SIMBA AI
 * Supports relative terms (hari ini, besok, lusa, X hari lagi, senin depan)
 * and explicit formats (20 Oktober 2026, 20/10/2026, 20-10-2026, tgl 20, dll.)
 */

export interface ParsedDateTimeRange {
  startDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endDate: string;   // YYYY-MM-DD
  endTime: string;   // HH:mm
  confidence: number;
  detectedDateDescription: string;
}

const MONTH_NAMES: { [key: string]: number } = {
  januari: 0, jan: 0,
  februari: 1, feb: 1,
  maret: 2, mar: 2,
  april: 3, apr: 3,
  mei: 4,
  juni: 5, jun: 5,
  juli: 6, jul: 6,
  agustus: 7, agu: 7, ags: 7,
  september: 8, sep: 8, sept: 8,
  oktober: 9, okt: 9,
  november: 10, nov: 10,
  desember: 11, des: 11,
};

const DAY_NAMES: { [key: string]: number } = {
  minggu: 0, ahad: 0,
  senin: 1,
  selasa: 2,
  rabu: 3,
  kamis: 4,
  jumat: 5, "jum'at": 5,
  sabtu: 6,
};

export function parseIndonesianDateTime(text: string, referenceDate: Date = new Date()): ParsedDateTimeRange {
  const lower = text.toLowerCase();
  const refYear = referenceDate.getFullYear();
  const refMonth = referenceDate.getMonth();
  const refDay = referenceDate.getDate();

  let targetStartDate = new Date(referenceDate);
  let targetEndDate = new Date(referenceDate);
  let detectedDescription = 'Hari ini';

  // 1. Check relative date keywords
  if (lower.includes('lusa')) {
    targetStartDate.setDate(refDay + 2);
    targetEndDate.setDate(refDay + 2);
    detectedDescription = 'Lusa';
  } else if (lower.includes('besok')) {
    targetStartDate.setDate(refDay + 1);
    targetEndDate.setDate(refDay + 1);
    detectedDescription = 'Besok';
  } else if (lower.includes('hari ini')) {
    targetStartDate.setDate(refDay);
    targetEndDate.setDate(refDay);
    detectedDescription = 'Hari ini';
  } else {
    // Check "X hari lagi"
    const daysAheadMatch = lower.match(/(\d+)\s*hari\s*lagi/);
    if (daysAheadMatch) {
      const days = parseInt(daysAheadMatch[1], 10);
      targetStartDate.setDate(refDay + days);
      targetEndDate.setDate(refDay + days);
      detectedDescription = `${days} hari lagi`;
    } else {
      // Check day of week (e.g. "senin", "selasa depan", "hari rabu")
      let matchedDayIdx: number | null = null;
      for (const [dayName, dayIdx] of Object.entries(DAY_NAMES)) {
        if (new RegExp(`\\b${dayName}\\b`).test(lower)) {
          matchedDayIdx = dayIdx;
          detectedDescription = `Hari ${dayName.charAt(0).toUpperCase() + dayName.slice(1)}`;
          break;
        }
      }

      if (matchedDayIdx !== null) {
        const currentDayIdx = referenceDate.getDay();
        let diff = matchedDayIdx - currentDayIdx;
        if (diff <= 0 || lower.includes('depan')) {
          diff += 7;
        }
        targetStartDate.setDate(refDay + diff);
        targetEndDate.setDate(refDay + diff);
      } else {
        // 2. Check explicit date patterns like "20 Oktober 2026" or "tanggal 25 oktober"
        const explicitDateMatch = lower.match(/(?:tanggal|tgl\s*)?(\d{1,2})\s+([a-z]+)(?:\s+(\d{4}))?/);
        if (explicitDateMatch && MONTH_NAMES[explicitDateMatch[2]] !== undefined) {
          const d = parseInt(explicitDateMatch[1], 10);
          const m = MONTH_NAMES[explicitDateMatch[2]];
          const y = explicitDateMatch[3] ? parseInt(explicitDateMatch[3], 10) : refYear;
          targetStartDate = new Date(y, m, d);
          targetEndDate = new Date(y, m, d);
          detectedDescription = `${d} ${explicitDateMatch[2]} ${y}`;
        } else {
          // Check DD/MM/YYYY or DD-MM-YYYY
          const slashDateMatch = lower.match(/(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?/);
          if (slashDateMatch) {
            const d = parseInt(slashDateMatch[1], 10);
            const m = parseInt(slashDateMatch[2], 10) - 1;
            let y = slashDateMatch[3] ? parseInt(slashDateMatch[3], 10) : refYear;
            if (y < 100) y += 2000;
            targetStartDate = new Date(y, m, d);
            targetEndDate = new Date(y, m, d);
            detectedDescription = `${d}/${m + 1}/${y}`;
          } else {
            // Check standalone "tanggal 25" or "tgl 18"
            const standaloneDayMatch = lower.match(/(?:tanggal|tgl)\s*(\d{1,2})/);
            if (standaloneDayMatch) {
              const d = parseInt(standaloneDayMatch[1], 10);
              // if day has passed this month, consider next month or same month
              targetStartDate = new Date(refYear, refMonth, d);
              targetEndDate = new Date(refYear, refMonth, d);
              detectedDescription = `Tanggal ${d}`;
            }
          }
        }
      }
    }
  }

  // Check date ranges (e.g. "sampai tanggal 25" or "selama 3 hari")
  const durationMatch = lower.match(/selama\s*(\d+)\s*hari/);
  if (durationMatch) {
    const days = parseInt(durationMatch[1], 10);
    targetEndDate = new Date(targetStartDate);
    targetEndDate.setDate(targetStartDate.getDate() + Math.max(0, days - 1));
  } else {
    const rangeMatch = lower.match(/(?:sampai|hingga|s\/d)\s*(?:tanggal|tgl\s*)?(\d{1,2})\s*([a-z]+)?/);
    if (rangeMatch) {
      const endDay = parseInt(rangeMatch[1], 10);
      let endMonth = targetStartDate.getMonth();
      if (rangeMatch[2] && MONTH_NAMES[rangeMatch[2]] !== undefined) {
        endMonth = MONTH_NAMES[rangeMatch[2]];
      }
      targetEndDate = new Date(targetStartDate.getFullYear(), endMonth, endDay);
    }
  }

  // Ensure end date is not before start date
  if (targetEndDate < targetStartDate) {
    targetEndDate = new Date(targetStartDate);
  }

  // 3. Parse Time (e.g. "jam 09.00 sampai 16.00", "pukul 10:00 - 15:00", "08.00-14.00")
  let startTime = '09:00';
  let endTime = '16:00';

  const timeMatches = lower.match(/(\d{1,2})[.:](\d{2})/g);
  if (timeMatches && timeMatches.length >= 2) {
    startTime = timeMatches[0].replace('.', ':').padStart(5, '0');
    endTime = timeMatches[1].replace('.', ':').padStart(5, '0');
  } else if (timeMatches && timeMatches.length === 1) {
    startTime = timeMatches[0].replace('.', ':').padStart(5, '0');
    // Default to +4 hours or 17:00
    const startHour = parseInt(startTime.split(':')[0], 10);
    const endHour = Math.min(20, startHour + 5);
    endTime = `${String(endHour).padStart(2, '0')}:00`;
  } else {
    // Check "jam 9 sampai jam 4"
    const simpleHourRange = lower.match(/(?:jam|pukul)\s*(\d{1,2})\s*(?:sampai|hingga|-|s\/d)\s*(?:jam|pukul)?\s*(\d{1,2})/);
    if (simpleHourRange) {
      let h1 = parseInt(simpleHourRange[1], 10);
      let h2 = parseInt(simpleHourRange[2], 10);
      // If h2 <= 12 and h2 < h1, it's likely PM (e.g., jam 9 sampai 4 => 16:00)
      if (h2 <= 12 && h2 < h1) h2 += 12;
      startTime = `${String(h1).padStart(2, '0')}:00`;
      endTime = `${String(h2).padStart(2, '0')}:00`;
    }
  }

  const formatIsoDate = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return {
    startDate: formatIsoDate(targetStartDate),
    startTime,
    endDate: formatIsoDate(targetEndDate),
    endTime,
    confidence: 0.95,
    detectedDateDescription: detectedDescription,
  };
}
